import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

function isBroken(pod: any): boolean {
  const cs = pod?.status?.containerStatuses?.[0];
  const reason = cs?.state?.waiting?.reason;
  return reason === "ErrImagePull" || reason === "ImagePullBackOff";
}

export const troubleshooting: Lesson = {
  id: "troubleshooting",
  order: 15,
  title: "Troubleshooting",
  concept: "Diagnosing broken workloads",
  focus: "troubleshoot",
  intro: `
Things break — a typo'd image name, a crashing process, a missing ConfigMap. The
three tools you reach for first are always the same: **\`kubectl get\`** to see
overall state, **\`kubectl describe\`** to read recent Events, and **\`kubectl
logs\`** to see what the container itself printed before it died. This lesson
deliberately creates a broken Pod so you can practice the diagnosis loop.
`,
  steps: [
    {
      kind: "task",
      id: "break-it",
      title: "Deploy a (deliberately) broken Pod",
      instructions: `Run a Pod with a typo'd image name — this will fail to pull.`,
      command: `kubectl run broken-pod --image=ngin:alpine -n ${NAMESPACE}`,
      hint: "Yes, that's a typo on purpose — \"ngin\" instead of \"nginx\".",
      check: async () => {
        const pod = await getResourceJson<any>("pod", "broken-pod");
        if (!pod) return { pass: false, message: `Pod "broken-pod" not found yet.` };
        if (!isBroken(pod)) {
          return { pass: false, message: `Pod "broken-pod" exists but isn't showing an image pull failure yet. Give it a few seconds.` };
        }
        return { pass: true, message: `Confirmed: broken-pod is failing to pull its image, as expected.` };
      },
    },
    {
      kind: "task",
      id: "diagnose",
      title: "Diagnose the failure",
      instructions: `Use \`describe\` to see the actual error in the Events section at the bottom of
the output — that's where the real reason lives, not in \`kubectl get\`.`,
      command: `kubectl describe pod broken-pod -n ${NAMESPACE}`,
      hint: "Look for a reason like ErrImagePull or ImagePullBackOff and a message naming the bad image.",
      check: async () => {
        const pod = await getResourceJson<any>("pod", "broken-pod");
        if (!isBroken(pod)) {
          return { pass: false, message: `broken-pod isn't currently in a failing state to diagnose.` };
        }
        const reason = pod.status.containerStatuses[0].state.waiting.reason;
        return { pass: true, message: `Diagnosis: ${reason} — the image "${pod.spec.containers[0].image}" doesn't exist.` };
      },
    },
    {
      kind: "task",
      id: "fix-it",
      title: "Fix it",
      instructions: `Now fix the typo by swapping in a valid image, without deleting and recreating the
Pod.`,
      command: `kubectl set image pod/broken-pod broken-pod=nginx:alpine -n ${NAMESPACE}`,
      check: async () => {
        const pod = await getResourceJson<any>("pod", "broken-pod");
        if (!pod) return { pass: false, message: `Pod "broken-pod" not found.` };
        if (pod.status?.phase !== "Running") {
          return { pass: false, message: `broken-pod is in phase "${pod.status?.phase}", not Running yet.` };
        }
        return { pass: true, message: `Fixed! broken-pod is Running with image "${pod.spec.containers[0].image}".` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-troubleshooting",
      title: "Quick check",
      instructions: "Where do you typically find the real reason a Pod failed to start (e.g. a bad image name)?",
      options: [
        "The `kubectl get pods` output",
        "The Events section at the bottom of `kubectl describe pod`",
        "`kubectl config view`",
        "The Deployment's YAML spec",
      ],
      correctIndex: 1,
      explanation:
        "`kubectl get` shows current state, but the *why* — pull errors, scheduling failures, probe failures — lives in the Events the kubelet and controllers emit, visible via `describe`.",
    },
  ],
};
