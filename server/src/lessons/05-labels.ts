import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson, listResourcesJson } from "../kube.js";

export const labels: Lesson = {
  id: "labels",
  order: 5,
  title: "Labels & Selectors",
  concept: "Labels and selectors",
  focus: "labels",
  intro: `
**Labels** are key/value tags you attach to objects. **Selectors** let other objects
(Services, Deployments, ReplicaSets...) find the Pods they care about by matching
labels — this is how Kubernetes wires things together instead of using fixed names
or IPs.
`,
  steps: [
    {
      kind: "task",
      id: "label-pod",
      title: "Label the Pod",
      instructions: `Attach a \`tier=frontend\` label to \`nginx-pod\` from the previous lesson.`,
      command: `kubectl label pod nginx-pod tier=frontend -n ${NAMESPACE}`,
      hint: "If you already added this label and want to change it, add `--overwrite`.",
      check: async () => {
        const pod = await getResourceJson<any>("pod", "nginx-pod");
        if (!pod) return { pass: false, message: `Pod "nginx-pod" not found. Complete the Pods lesson first.` };
        if (pod.metadata?.labels?.tier !== "frontend") {
          return { pass: false, message: `Pod "nginx-pod" doesn't have the label tier=frontend yet.` };
        }
        return { pass: true, message: `nginx-pod is labeled tier=frontend.` };
      },
    },
    {
      kind: "task",
      id: "select-by-label",
      title: "Find it by selector",
      instructions: `Use a label selector to list only Pods tagged \`tier=frontend\`, instead of
listing every Pod and eyeballing it.`,
      command: `kubectl get pods -l tier=frontend -n ${NAMESPACE}`,
      hint: "Selectors scale to hundreds of Pods the same way they work for one.",
      check: async () => {
        const pods = await listResourcesJson<any>("pods");
        const matches = pods.filter((p: any) => p.metadata?.labels?.tier === "frontend");
        if (matches.length === 0) {
          return { pass: false, message: "No Pods with label tier=frontend found yet." };
        }
        return { pass: true, message: `${matches.length} Pod(s) match tier=frontend.` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-labels",
      title: "Quick check",
      instructions: "What connects a Service (or Deployment) to the right set of Pods?",
      options: [
        "The Pod's IP address, hardcoded into the Service",
        "A label selector that matches labels on the Pods",
        "The Pod's container name",
        "Whichever node the Pod happens to run on",
      ],
      correctIndex: 1,
      explanation:
        "Services, Deployments, and ReplicaSets never hardcode Pod identities — they use label selectors, so the matching Pod set can change freely underneath them.",
    },
  ],
};
