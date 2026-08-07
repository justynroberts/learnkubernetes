import type { Lesson } from "./types.js";
import { NAMESPACE, kubectl, namespaceExists } from "../kube.js";

export const namespaces: Lesson = {
  id: "namespaces",
  order: 2,
  title: "Namespaces",
  concept: "Namespaces",
  intro: `
A **Namespace** is a way to divide one cluster into multiple virtual clusters. Teams
and projects usually get their own namespace so their resource names don't collide
and so access can be scoped.

For the rest of this course you'll work inside a namespace called **\`${NAMESPACE}\`**,
which keeps every exercise cleanly separated from anything else on your cluster.
`,
  steps: [
    {
      kind: "task",
      id: "create-namespace",
      title: `Create the "${NAMESPACE}" namespace`,
      instructions: `Create a namespace for this course to live in.`,
      command: `kubectl create namespace ${NAMESPACE}`,
      hint: "If it already exists, that's fine — you can move on.",
      check: async () => {
        const exists = await namespaceExists(NAMESPACE);
        if (!exists) {
          return { pass: false, message: `Namespace "${NAMESPACE}" doesn't exist yet.` };
        }
        return { pass: true, message: `Namespace "${NAMESPACE}" exists.` };
      },
    },
    {
      kind: "task",
      id: "set-default-namespace",
      title: "Make it your default",
      instructions: `Typing \`-n ${NAMESPACE}\` on every command gets old fast. Point your current
\`kubectl\` context at the new namespace by default.`,
      command: `kubectl config set-context --current --namespace=${NAMESPACE}`,
      hint: "This changes kubectl's context, not the cluster itself.",
      check: async () => {
        const { stdout, code } = await kubectl(["config", "view", "--minify", "-o", "jsonpath={..namespace}"]);
        if (code !== 0) return { pass: false, message: "Couldn't read your kubectl config." };
        if (stdout.trim() !== NAMESPACE) {
          return { pass: false, message: `Current context's default namespace is "${stdout.trim() || "(none)"}", not "${NAMESPACE}".` };
        }
        return { pass: true, message: `Default namespace is now "${NAMESPACE}".` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-namespaces",
      title: "Quick check",
      instructions: "What is the main purpose of a Kubernetes Namespace?",
      options: [
        "To divide one cluster into virtual clusters, scoping resource names and access",
        "To increase the CPU or memory allocated to a Pod",
        "To store container images",
        "To open a network port on a Pod",
      ],
      correctIndex: 0,
      explanation:
        "Namespaces scope resource names and access within a shared cluster — they don't affect compute resources, images, or networking directly.",
    },
  ],
};
