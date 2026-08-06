import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson, kubectl } from "../kube.js";

export const rollouts: Lesson = {
  id: "rollouts",
  order: 11,
  title: "Rolling Updates & Rollbacks",
  concept: "Rolling updates and rollbacks",
  intro: `
Deployments update Pods gradually — a **rolling update** replaces old Pods with new
ones a few at a time, so your app stays available throughout. Every revision is
recorded, so if the new version turns out to be broken you can **roll back** to the
previous one just as easily.
`,
  steps: [
    {
      id: "update-image",
      title: "Roll out a new image version",
      instructions: `Update the \`web\` Deployment's container image to \`nginx:1.27-alpine\`. Watch
\`kubectl get pods -n ${NAMESPACE} -w\` in another terminal tab if you want to see
Pods rotate in real time.`,
      command: `kubectl set image deployment/web nginx=nginx:1.27-alpine -n ${NAMESPACE}`,
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        const container = dep?.spec?.template?.spec?.containers?.[0];
        if (container?.image !== "nginx:1.27-alpine") {
          return { pass: false, message: `Deployment "web" is still running image "${container?.image}".` };
        }
        const ready = dep?.status?.readyReplicas ?? 0;
        const desired = dep?.spec?.replicas ?? 0;
        if (ready < desired) {
          return { pass: false, message: `Image updated, but rollout still in progress (${ready}/${desired} ready).` };
        }
        return { pass: true, message: `web is now running nginx:1.27-alpine, fully rolled out.` };
      },
    },
    {
      id: "check-history",
      title: "Review rollout history",
      instructions: `Every rollout is a numbered revision. List the Deployment's history.`,
      command: `kubectl rollout history deployment/web -n ${NAMESPACE}`,
      check: async () => {
        const { stdout, code } = await kubectl(["rollout", "history", "deployment/web", "-n", NAMESPACE]);
        const revisionLines = stdout
          .split("\n")
          .filter((l) => /^\d+\s/.test(l.trim()));
        if (code !== 0 || revisionLines.length < 2) {
          return { pass: false, message: "Expected at least 2 revisions in the rollout history so far." };
        }
        return { pass: true, message: `Deployment "web" has ${revisionLines.length} recorded revisions.` };
      },
    },
    {
      id: "rollback",
      title: "Roll it back",
      instructions: `Undo the last rollout, returning \`web\` to the previous image.`,
      command: `kubectl rollout undo deployment/web -n ${NAMESPACE}`,
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        const container = dep?.spec?.template?.spec?.containers?.[0];
        if (container?.image === "nginx:1.27-alpine") {
          return { pass: false, message: `Still running nginx:1.27-alpine — the rollback hasn't taken effect yet.` };
        }
        return { pass: true, message: `Rolled back — web is running "${container?.image}" again.` };
      },
    },
  ],
};
