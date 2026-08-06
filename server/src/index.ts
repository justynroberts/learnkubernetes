import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { LESSONS, findLesson, findStep, toSummary, toDetail } from "./lessons/index.js";
import { attachPty } from "./pty.js";
import { clusterReachable, currentNodeInfo, ensureNamespace, ensureKubeContext, resetNamespace, NAMESPACE, KUBE_CONTEXT } from "./kube.js";

const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(cors());
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
  try {
    const result = await step.check();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ pass: false, message: `Validator error: ${err?.message ?? err}` });
  }
});

app.post("/api/reset", async (_req, res) => {
  await resetNamespace();
  res.json({ ok: true });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/pty" });
wss.on("connection", (ws) => attachPty(ws));

Promise.all([ensureNamespace(), ensureKubeContext()]).finally(() => {
  httpServer.listen(PORT, () => {
    console.log(`learnkubernetes server listening on :${PORT} (context=${KUBE_CONTEXT}, namespace=${NAMESPACE})`);
  });
});
