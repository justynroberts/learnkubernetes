import type { Lesson } from "./types.js";
import { NAMESPACE, RUNNER_IMAGE, getResourceJson, listResourcesJson } from "../kube.js";

function hasRunnerImage(container: any): boolean {
  return typeof container?.image === "string" && container.image.toLowerCase().includes("runner");
}

async function findRunnerDeployment() {
  const deps = await listResourcesJson<any>("deployments");
  return deps.find((d) => (d.spec?.template?.spec?.containers ?? []).some(hasRunnerImage));
}

async function findRunnerPod() {
  const pods = await listResourcesJson<any>("pods");
  return pods.find((p) => (p.spec?.containers ?? []).some(hasRunnerImage));
}

export const runbookAutomation: Lesson = {
  id: "runbook-automation",
  order: 16,
  title: "Deploy a Runbook Automation Runner",
  concept: "A real production workload",
  focus: "external",
  intro: `
Time for the real thing. **PagerDuty Runbook Automation** (built on Rundeck) lets you
execute automation jobs against your infrastructure. A **Runner** is a lightweight
agent you deploy inside your own network that connects outward to your Runbook
Automation instance, so it can reach systems the control plane itself can't — exactly
the kind of workload that gets deployed to Kubernetes in the real world.

This lesson deploys an actual Runner, using everything from this course: a
**Secret** for its credentials and a **Deployment** to run it. The final check
confirms it's genuinely **Running and Ready** — not just that the YAML looks right.

You'll need your own Runbook Automation instance for this one. In it, go to
**Runner Management** and create a new Runner — it will give you a **Server URL**,
a **Client ID**, and a **Token**. If you don't manage Runbook Automation yourself,
ask whoever does to create a runner and share those three values with you.

> **Apple Silicon note:** as of this course's last update, the Runner image is
> published for \`linux/amd64\` only, so it won't run as-is on Rancher Desktop's
> \`arm64\` node on M-series Macs (you'll see \`ErrImagePull\`/"no matching
> manifest"). Arm64 builds are expected soon — once available, just edit the
> \`image:\` line in the manifest editor below to point at the new tag.
`,
  steps: [
    {
      kind: "task",
      id: "runner-secret",
      title: "Store your runner credentials",
      instructions: `Create a Secret holding the Server URL, Client ID, and Token from your Runner
Management page. Replace the placeholder values with your real ones.`,
      command: `kubectl create secret generic runner-credentials \\
  --from-literal=RUNNER_RUNDECK_SERVER_URL=<your-server-url> \\
  --from-literal=RUNNER_RUNDECK_CLIENT_ID=<your-client-id> \\
  --from-literal=RUNNER_RUNDECK_SERVER_TOKEN=<your-token> \\
  -n ${NAMESPACE}`,
      hint: "No Runbook Automation access? Ask whoever manages it at your org to create a runner and share the three values.",
      check: async () => {
        const secret = await getResourceJson<any>("secret", "runner-credentials");
        if (!secret) return { pass: false, message: `Secret "runner-credentials" not found.` };
        const keys = Object.keys(secret.data ?? {});
        const required = ["RUNNER_RUNDECK_SERVER_URL", "RUNNER_RUNDECK_CLIENT_ID", "RUNNER_RUNDECK_SERVER_TOKEN"];
        const missing = required.filter((k) => !keys.includes(k));
        if (missing.length > 0) {
          return { pass: false, message: `runner-credentials is missing: ${missing.join(", ")}.` };
        }
        return { pass: true, message: `runner-credentials has all required keys.` };
      },
    },
    {
      kind: "manifest",
      id: "deploy-runner",
      title: "Deploy the Runner",
      instructions: `Edit the Deployment manifest below to wire in your Secret, add a \`nodeSelector\`
for your architecture, or anything else you need — or replace it entirely with a
manifest copied straight from your Runbook Automation instance. Click **Apply**
when it's ready.`,
      hint: "Pasting a manifest from Runbook Automation? It's fine if it embeds credentials directly instead of using the Secret — this step just checks that a runner container exists.",
      template: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: runner
  labels:
    app: runner
spec:
  replicas: 1
  selector:
    matchLabels:
      app: runner
  template:
    metadata:
      labels:
        app: runner
    spec:
      containers:
        - name: runner
          image: ${RUNNER_IMAGE}
          envFrom:
            - secretRef:
                name: runner-credentials
`,
      check: async () => {
        const dep = await findRunnerDeployment();
        if (!dep) {
          return { pass: false, message: `No Deployment found yet with a container image containing "runner".` };
        }
        return { pass: true, message: `Found Deployment "${dep.metadata?.name}" running the Runner image.` };
      },
    },
    {
      kind: "task",
      id: "confirm-connected",
      title: "Confirm it's actually running",
      instructions: `The moment of truth — is it really connected? If this fails with a crash loop,
your credentials are probably wrong; check the Pod's logs (name it in the terminal:
\`kubectl logs <pod-name> -n ${NAMESPACE}\`) to see the real error, same as you did
in Troubleshooting.`,
      command: `kubectl get pods -n ${NAMESPACE}`,
      hint: `A restart count that keeps climbing means it's crash-looping, almost always a bad Server URL, Client ID, or Token.`,
      check: async () => {
        const pod = await findRunnerPod();
        if (!pod) {
          return { pass: false, message: `No Pod found yet with a container image containing "runner".` };
        }
        const cs = pod.status?.containerStatuses?.[0];
        const restarts = cs?.restartCount ?? 0;
        const waitingReason = cs?.state?.waiting?.reason;
        if (pod.status?.phase !== "Running" || !cs?.ready) {
          if (waitingReason === "ErrImagePull" || waitingReason === "ImagePullBackOff") {
            return {
              pass: false,
              message: `runner can't pull its image (${waitingReason}). If you're on Apple Silicon, this image may only be published for linux/amd64 — see the note above.`,
            };
          }
          if (restarts >= 2) {
            return {
              pass: false,
              message: `runner is crash-looping (${restarts} restarts) — this usually means bad credentials. Check its logs with \`kubectl logs ${pod.metadata?.name} -n ${NAMESPACE}\`.`,
            };
          }
          return { pass: false, message: `runner Pod "${pod.metadata?.name}" is "${pod.status?.phase}", not Running/Ready yet. Give it a moment.` };
        }
        return { pass: true, message: `Your Runbook Automation runner is Running and Ready. It's live.` };
      },
    },
  ],
};
