import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson, listResourcesJson } from "../kube.js";

const RUNNER_IMAGE = "rundeckpro/runner:5.18-RBA-20251119-90ca10b-59d3aa7";

export const runbookAutomation: Lesson = {
  id: "runbook-automation",
  order: 15,
  title: "Deploy a Runbook Automation Runner",
  concept: "A real production workload",
  intro: `
Time for the real thing. **PagerDuty Runbook Automation** (built on Rundeck) lets you
execute automation jobs against your infrastructure. A **Runner** is a lightweight
agent you deploy inside your own network that connects outward to your Runbook
Automation instance, so it can reach systems the control plane itself can't — exactly
the kind of workload that gets deployed to Kubernetes in the real world.

This lesson deploys an actual Runner, using everything from this course: a
**Secret** for its credentials, a **Deployment** to run it, and env vars sourced
from that Secret. The final check confirms it's genuinely **Running and Ready** —
not just that the YAML looks right.

You'll need your own Runbook Automation instance for this one. In it, go to
**Runner Management** and create a new Runner — it will give you a **Server URL**,
a **Client ID**, and a **Token**. If you don't manage Runbook Automation yourself,
ask whoever does to create a runner and share those three values with you.

> **Apple Silicon note:** the current Runner image is only published for
> \`linux/amd64\`. Rancher Desktop's default node on M-series Macs is \`arm64\`, so
> the Deployment below may sit in \`ErrImagePull\`/\`ImagePullBackOff\` with "no
> matching manifest" — that's this image, not your setup. Check with whoever
> manages your Runbook Automation instance for an arm64-compatible tag, or run
> this lesson against an amd64 host.
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
      kind: "task",
      id: "deploy-runner",
      title: "Deploy the Runner",
      instructions: `Create a Deployment running the Runner image, then wire in the credentials Secret
as environment variables — the same \`set env --from\` pattern from the Secrets
lesson.`,
      command: `kubectl create deployment runner --image=${RUNNER_IMAGE} -n ${NAMESPACE}
kubectl set env deployment/runner --from=secret/runner-credentials -n ${NAMESPACE}`,
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "runner");
        if (!dep) return { pass: false, message: `Deployment "runner" not found.` };
        const container = dep.spec?.template?.spec?.containers?.[0];
        const wired = (container?.env ?? []).some((e: any) => e.valueFrom?.secretKeyRef?.name === "runner-credentials");
        if (!wired) {
          return { pass: false, message: `Deployment "runner" isn't pulling env vars from runner-credentials yet.` };
        }
        return { pass: true, message: `runner Deployment is wired to runner-credentials.` };
      },
    },
    {
      kind: "task",
      id: "confirm-connected",
      title: "Confirm it's actually running",
      instructions: `The moment of truth — is it really connected? If this fails with a crash loop,
your credentials are probably wrong; check with \`kubectl logs deployment/runner -n
${NAMESPACE}\` to see the real error, same as you did in Troubleshooting.`,
      command: `kubectl get pods -l app=runner -n ${NAMESPACE}`,
      hint: `A restart count that keeps climbing means it's crash-looping, almost always a bad Server URL, Client ID, or Token.`,
      check: async () => {
        const pods = await listResourcesJson<any>("pods");
        const runnerPods = pods.filter((p: any) => p.metadata?.labels?.app === "runner");
        if (runnerPods.length === 0) {
          return { pass: false, message: `No Pods found for the runner Deployment yet.` };
        }
        const pod = runnerPods[0];
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
              message: `runner is crash-looping (${restarts} restarts) — this usually means bad credentials. Check \`kubectl logs deployment/runner -n ${NAMESPACE}\`.`,
            };
          }
          return { pass: false, message: `runner Pod is "${pod.status?.phase}", not Running/Ready yet. Give it a moment.` };
        }
        return { pass: true, message: `Your Runbook Automation runner is Running and Ready. It's live.` };
      },
    },
  ],
};
