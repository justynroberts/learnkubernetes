import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

export const pods: Lesson = {
  id: "pods",
  order: 3,
  title: "Pods",
  concept: "Pods",
  intro: `
A **Pod** is the smallest deployable unit in Kubernetes — one or more containers that
share a network address and storage, always scheduled together on the same node.
You almost never manage a lone Pod directly in production (that's what Deployments
are for, coming up next), but understanding Pods is the foundation for everything else.
`,
  steps: [
    {
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
  ],
};
