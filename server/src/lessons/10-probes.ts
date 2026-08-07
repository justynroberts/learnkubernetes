import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

const PATCH = JSON.stringify({
  spec: {
    template: {
      spec: {
        containers: [
          {
            name: "nginx",
            livenessProbe: { httpGet: { path: "/", port: 80 }, initialDelaySeconds: 5 },
            readinessProbe: { httpGet: { path: "/", port: 80 }, initialDelaySeconds: 2 },
          },
        ],
      },
    },
  },
});

export const probes: Lesson = {
  id: "probes",
  order: 10,
  title: "Health Probes",
  concept: "Liveness & readiness probes",
  intro: `
Kubernetes can't know if your app is actually healthy just because the process is
running. **Liveness probes** tell it "restart me if this fails" (recovers from a
hung process). **Readiness probes** tell it "don't send me traffic until this
passes" (protects against sending requests before startup finishes). Both are just
periodic checks — HTTP calls, TCP connects, or exec commands — that you define.
`,
  steps: [
    {
      kind: "task",
      id: "add-probes",
      title: "Add liveness & readiness probes",
      instructions: `Patch the \`web\` Deployment to add an HTTP liveness probe and readiness probe that
both check \`/\` on port 80.`,
      command: `kubectl patch deployment web -n ${NAMESPACE} --type=strategic -p '${PATCH}'`,
      hint: "The container is named `nginx` even though the Deployment is named `web` — kubectl derives container names from the image.",
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        const container = dep?.spec?.template?.spec?.containers?.[0];
        if (!container?.livenessProbe) {
          return { pass: false, message: `Deployment "web" has no livenessProbe configured yet.` };
        }
        if (!container?.readinessProbe) {
          return { pass: false, message: `Deployment "web" has no readinessProbe configured yet.` };
        }
        return { pass: true, message: `web's containers now have both liveness and readiness probes.` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-probes",
      title: "Quick check",
      instructions: "What's the difference between a liveness probe and a readiness probe?",
      options: [
        "They're identical, just named differently",
        "Liveness failing restarts the container; readiness failing just removes it from Service traffic without restarting",
        "Readiness probes only apply to Jobs, not Deployments",
        "Liveness probes only check CPU usage",
      ],
      correctIndex: 1,
      explanation:
        "Liveness answers \"should this be restarted?\". Readiness answers \"should this receive traffic right now?\". A slow-starting but otherwise healthy container should fail readiness, not liveness.",
    },
  ],
};
