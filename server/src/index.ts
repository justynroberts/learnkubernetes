import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { LESSONS, findLesson, findStep, toSummary, toDetail } from "./lessons/index.js";
import { attachPty } from "./pty.js";
import {
  clusterReachable,
  currentNodeInfo,
  ensureNamespace,
  ensureKubeContext,
  resetNamespace,
  applyManifest,
  NAMESPACE,
  KUBE_CONTEXT,
} from "./kube.js";

const PORT = Number(process.env.PORT ?? 4000);
/**
 * Loopback only. This server runs `kubectl` against your cluster and hands out
 * a real shell over /pty, so it must not be reachable from the network — on a
 * shared or café wifi, binding 0.0.0.0 would offer both to anyone on it.
 */
const HOST = process.env.HOST ?? "127.0.0.1";

/**
 * The only origins allowed to drive this server: the course itself, running on
 * this machine. Without this, any page you happen to have open could POST
 * manifests to your cluster, or open the terminal socket and run commands as
 * you — WebSockets ignore CORS, so /pty needs the check enforced by hand.
 */
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
]);

const app = express();
app.use(
  cors({
    origin(origin, cb) {
      // No Origin header means a non-browser client (curl, the app's own
      // tooling); the loopback bind already limits those to this machine.
      cb(null, !origin || ALLOWED_ORIGINS.has(origin));
    },
  }),
);
app.use(express.json());

app.get("/api/status", async (_req, res) => {
  const reachable = await clusterReachable();
  const nodes = reachable ? await currentNodeInfo() : [];
  res.json({ reachable, context: KUBE_CONTEXT, namespace: NAMESPACE, nodes });
});

app.get("/api/lessons", (_req, res) => {
  res.json(LESSONS.map(toSummary));
});

app.get("/api/lessons/:id", (req, res) => {
  const lesson = findLesson(req.params.id);
  if (!lesson) return res.status(404).json({ error: "lesson not found" });
  res.json(toDetail(lesson));
});

app.post("/api/lessons/:id/steps/:stepId/validate", async (req, res) => {
  const { lesson, step } = findStep(req.params.id, req.params.stepId);
  if (!lesson || !step) return res.status(404).json({ error: "step not found" });
  if (step.kind !== "task") return res.status(400).json({ error: "not a task step" });
  try {
    const result = await step.check();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ pass: false, message: `Validator error: ${err?.message ?? err}` });
  }
});

app.post("/api/lessons/:id/steps/:stepId/answer", (req, res) => {
  const { lesson, step } = findStep(req.params.id, req.params.stepId);
  if (!lesson || !step) return res.status(404).json({ error: "step not found" });
  if (step.kind !== "quiz") return res.status(400).json({ error: "not a quiz step" });
  const selectedIndex = req.body?.selectedIndex;
  if (typeof selectedIndex !== "number") return res.status(400).json({ error: "selectedIndex required" });
  const pass = selectedIndex === step.correctIndex;
  res.json({ pass, message: step.explanation });
});

/**
 * Grades a whole exam in one request. Correct answers and explanations only
 * ever leave the server here, in response to a submission — the lesson payload
 * itself has them stripped out.
 */
app.post("/api/lessons/:id/steps/:stepId/exam", (req, res) => {
  const { lesson, step } = findStep(req.params.id, req.params.stepId);
  if (!lesson || !step) return res.status(404).json({ error: "step not found" });
  if (step.kind !== "exam") return res.status(400).json({ error: "not an exam step" });

  const answers = req.body?.answers;
  if (!answers || typeof answers !== "object") return res.status(400).json({ error: "answers required" });

  const results = step.questions.map((q) => {
    const given = answers[q.id];
    return {
      id: q.id,
      prompt: q.prompt,
      selectedIndex: typeof given === "number" ? given : null,
      correctIndex: q.correctIndex,
      correct: given === q.correctIndex,
      explanation: q.explanation,
      lesson: q.lesson,
    };
  });

  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const needed = Math.ceil(total * step.passMark);
  res.json({ pass: correct >= needed, correct, total, needed, results });
});

app.post("/api/lessons/:id/steps/:stepId/apply", async (req, res) => {
  const { lesson, step } = findStep(req.params.id, req.params.stepId);
  if (!lesson || !step) return res.status(404).json({ error: "step not found" });
  if (step.kind !== "manifest") return res.status(400).json({ error: "not a manifest step" });
  const yaml = req.body?.yaml;
  if (typeof yaml !== "string" || !yaml.trim()) return res.status(400).json({ error: "yaml required" });

  const applied = await applyManifest(yaml);
  if (applied.code !== 0) {
    return res.json({ pass: false, message: applied.stderr.trim() || "kubectl apply failed.", applyOutput: applied.stderr });
  }
  try {
    const result = await step.check();
    res.json({ ...result, applyOutput: applied.stdout });
  } catch (err: any) {
    res.status(500).json({ pass: false, message: `Validator error: ${err?.message ?? err}`, applyOutput: applied.stdout });
  }
});

// Free-form scratch apply — not tied to any lesson step, no validation attached.
// Lets a learner experiment with arbitrary manifests (Deployments, Services, etc.)
// at any time, always scoped to the training namespace.
app.post("/api/manifest/apply", async (req, res) => {
  const yaml = req.body?.yaml;
  if (typeof yaml !== "string" || !yaml.trim()) return res.status(400).json({ error: "yaml required" });
  const applied = await applyManifest(yaml);
  res.json({ pass: applied.code === 0, stdout: applied.stdout, stderr: applied.stderr });
});

app.post("/api/reset", async (_req, res) => {
  try {
    await resetNamespace();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err?.message ?? String(err) });
  }
});

const httpServer = createServer(app);
const wss = new WebSocketServer({
  server: httpServer,
  path: "/pty",
  // This socket is a shell. A browser always sends Origin, so any page trying
  // to open it from elsewhere is turned away here.
  verifyClient: ({ origin }: { origin: string }) => !origin || ALLOWED_ORIGINS.has(origin),
});
wss.on("connection", (ws) => attachPty(ws));

Promise.all([ensureNamespace(), ensureKubeContext()]).finally(() => {
  httpServer.listen(PORT, HOST, () => {
    console.log(
      `learnkubernetes server listening on ${HOST}:${PORT} (context=${KUBE_CONTEXT}, namespace=${NAMESPACE})`,
    );
  });
});
