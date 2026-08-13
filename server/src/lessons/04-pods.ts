import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

export const pods: Lesson = {
  id: "pods",
  order: 4,
  title: "Pods",
  concept: "Pods",
  focus: "pod",
  intro: `
A **Pod** is the smallest deployable unit in Kubernetes — one or more containers that
share a network address and storage, always scheduled together on the same node.

You almost never manage a lone Pod directly in production, and the reason is worth
knowing: **a bare Pod has no self-healing.** Create one by hand and nothing is
watching it. If it crashes badly enough, or its node goes away, it simply stops
existing and nothing brings it back. What you normally do is ask a **controller** —
a Deployment, coming up shortly — for Pods, and let it recreate them as needed.

Understanding Pods is still the foundation for everything else, so we'll make one by
hand first.

The container we'll run is **nginx** (pronounced "engine-x") — a very widely used
open-source **web server**. A web server's job is to sit and wait for requests and
send web pages back. It's used throughout this course because it starts in about a
second, and because later on you'll be able to open it in your own browser and see
it answer.
`,
  steps: [
    {
      kind: "task",
      id: "run-pod",
      title: "Run a Pod",
      instructions: `Start a single Pod running an nginx web server.`,
      command: `kubectl run nginx-pod --image=nginx:alpine -n ${NAMESPACE}`,
      hint: "It can take a few seconds to pull the image and start running.",
      check: async () => {
        const pod = await getResourceJson<any>("pod", "nginx-pod");
        if (!pod) return { pass: false, message: `Pod "nginx-pod" not found in namespace "${NAMESPACE}".` };
        const phase = pod.status?.phase;
        if (phase !== "Running") {
          return { pass: false, message: `Pod "nginx-pod" exists but is in phase "${phase}". Give it a moment.` };
        }
        return { pass: true, message: `Pod "nginx-pod" is Running on node ${pod.spec?.nodeName}.` };
      },
    },
    {
      kind: "task",
      id: "inspect-pod",
      title: "Inspect it",
      instructions: `Get the full details of the Pod — its containers, events, IP address, and node.
Look for the **Status**, **IP**, and **Events** sections in the output.`,
      command: `kubectl describe pod nginx-pod -n ${NAMESPACE}`,
      hint: "Also try `kubectl logs nginx-pod -n " + NAMESPACE + "` to see its console output.",
      check: async () => {
        const pod = await getResourceJson<any>("pod", "nginx-pod");
        if (!pod?.status?.podIP) {
          return { pass: false, message: "Pod doesn't have an IP address assigned yet — it may still be starting." };
        }
        return { pass: true, message: `nginx-pod has been assigned IP ${pod.status.podIP}.` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-pods",
      title: "Quick check",
      instructions: "Why don't you usually manage Pods directly in production?",
      options: [
        "Pods are immutable and can never be updated",
        "If a Pod dies, nothing recreates it — that's the job of a controller like a Deployment",
        "Pods can only run one container each",
        "Pods require a separate license from Kubernetes",
      ],
      correctIndex: 1,
      explanation:
        "A bare Pod has no self-healing behavior. Controllers like Deployments watch and recreate Pods automatically when they disappear.",
    },
  ],
};
