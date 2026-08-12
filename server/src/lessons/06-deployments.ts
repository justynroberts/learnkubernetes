import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

export const deployments: Lesson = {
  id: "deployments",
  order: 6,
  title: "Deployments",
  concept: "Deployments",
  focus: "deployment",
  intro: `
Managing individual Pods by hand doesn't scale — if one crashes, nothing brings it
back. A **Deployment** describes the *desired state* of a set of identical Pods
(which image, how many replicas) and continuously works to make reality match it,
via an intermediate object called a **ReplicaSet**. This is the standard way to run
stateless applications.

You *can* create one with a single imperative command (\`kubectl create
deployment ...\`), but real-world Kubernetes work is almost always done by writing
and applying a **YAML manifest** instead — it's reviewable, diffable, and goes in
version control. This course uses that workflow from here on.
`,
  steps: [
    {
      kind: "manifest",
      id: "create-deployment",
      title: "Create a Deployment",
      instructions: `Write a Deployment manifest called \`web\`, running nginx with 2 replicas, and
apply it.`,
      hint: "The container's name matters — later lessons refer to it by name (\"nginx\") when patching probes and rolling out image updates.",
      template: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:alpine
`,
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        if (!dep) return { pass: false, message: `Deployment "web" not found in namespace "${NAMESPACE}".` };
        const ready = dep.status?.readyReplicas ?? 0;
        const desired = dep.spec?.replicas ?? 0;
        if (desired < 2) {
          return { pass: false, message: `Deployment "web" has ${desired} desired replica(s); expected at least 2.` };
        }
        if (ready < desired) {
          return { pass: false, message: `Deployment "web" wants ${desired} replicas but only ${ready} are ready. Give it a moment.` };
        }
        return { pass: true, message: `Deployment "web" is running ${ready}/${desired} replicas.` };
      },
    },
    {
      kind: "task",
      id: "watch-rollout",
      title: "Watch it roll out",
      instructions: `Watch the rollout finish in real time — this command blocks until every replica
is available.`,
      command: `kubectl rollout status deployment/web -n ${NAMESPACE}`,
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        const cond = (dep?.status?.conditions ?? []).find((c: any) => c.type === "Available");
        if (!cond || cond.status !== "True") {
          return { pass: false, message: `Deployment "web" isn't reporting Available=True yet.` };
        }
        return { pass: true, message: `Deployment "web" is fully available.` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-deployments",
      title: "Quick check",
      instructions: "What actually creates and manages the individual Pods for a Deployment?",
      options: [
        "The Deployment object directly",
        "An intermediate object called a ReplicaSet",
        "The Kubernetes scheduler, with no other object involved",
        "A DaemonSet",
      ],
      correctIndex: 1,
      explanation:
        "A Deployment manages ReplicaSets, and each ReplicaSet manages a set of identical Pods. This layering is what makes rolling updates possible — old and new ReplicaSets can briefly coexist during a rollout.",
    },
  ],
};
