import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson, listResourcesJson } from "../kube.js";

export const scaling: Lesson = {
  id: "scaling",
  order: 6,
  title: "Scaling",
  concept: "Scaling",
  intro: `
Need to handle more traffic? Change one number. The Deployment's controller adds or
removes Pods until the running count matches the desired count — no manual
scheduling required.
`,
  steps: [
    {
      kind: "task",
      id: "scale-up",
      title: "Scale to 4 replicas",
      instructions: `Scale the \`web\` Deployment up to 4 replicas.`,
      command: `kubectl scale deployment/web --replicas=4 -n ${NAMESPACE}`,
      hint: "Complete the Deployments lesson first if `web` doesn't exist yet.",
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        if (!dep) return { pass: false, message: `Deployment "web" not found.` };
        const desired = dep.spec?.replicas ?? 0;
        const ready = dep.status?.readyReplicas ?? 0;
        if (desired !== 4) {
          return { pass: false, message: `Deployment "web" is set to ${desired} replicas; expected 4.` };
        }
        if (ready !== 4) {
          return { pass: false, message: `Deployment "web" wants 4 replicas but only ${ready} are ready.` };
        }
        return { pass: true, message: `Deployment "web" scaled to 4/4 ready replicas.` };
      },
    },
    {
      kind: "task",
      id: "verify-pods",
      title: "Count the Pods",
      instructions: `Confirm there are really 4 Pods backing the Deployment.`,
      command: `kubectl get pods -l app=web -n ${NAMESPACE}`,
      check: async () => {
        const pods = await listResourcesJson<any>("pods");
        const matches = pods.filter((p: any) => p.metadata?.labels?.app === "web" && p.status?.phase === "Running");
        if (matches.length < 4) {
          return { pass: false, message: `Only ${matches.length} Pod(s) with label app=web are Running; expected 4.` };
        }
        return { pass: true, message: `${matches.length} Pods with app=web are Running.` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-scaling",
      title: "Quick check",
      instructions: "When you scale a Deployment from 2 replicas up to 4, what happens to the original 2 Pods?",
      options: [
        "They're deleted and all 4 are recreated fresh",
        "They keep running unchanged, and 2 new Pods are added",
        "They're merged into one larger Pod",
        "Nothing changes until the next rollout",
      ],
      correctIndex: 1,
      explanation:
        "Scaling only changes the replica count — Kubernetes reconciles by adding or removing Pods to match, without touching Pods that are already correct.",
    },
  ],
};
