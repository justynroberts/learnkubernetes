import type { Lesson } from "./types.js";
import { NAMESPACE, kubectl } from "../kube.js";

/** Roles come from the well-known `node-role.kubernetes.io/<role>` label prefix. */
function rolesOf(node: any): string[] {
  return Object.keys(node?.metadata?.labels ?? {})
    .filter((k) => k.startsWith("node-role.kubernetes.io/"))
    .map((k) => k.slice("node-role.kubernetes.io/".length))
    .filter(Boolean);
}

export const coreConcepts: Lesson = {
  id: "core-concepts",
  order: 2,
  title: "Core Concepts",
  concept: "The map",
  focus: "all",
  intro: `
Before creating anything, it's worth having a picture in your head of *where*
things live. Use the map above — every lesson from here on highlights the part of
it you're working in.

A **cluster** is the whole box. It has two halves:

- The **control plane** is the brain. The **API server** is its front door — every
  \`kubectl\` command is just an HTTPS call to it. The **scheduler** decides which
  node each new Pod lands on, **controllers** continuously compare desired state to
  actual state and fix the difference, and **etcd** is the database where all of
  that desired state is written down.
- **Nodes** are the machines that actually run your containers. On each one, a
  **kubelet** takes its assigned Pods from the API server and tells the container
  runtime to start them.

Inside that, the objects you'll spend your time on:

- A **Pod** is the smallest unit you can run — one or more containers sharing a
  network address, always on a single node.
- **Controllers** like **Deployments** and **Jobs** don't run anything themselves.
  They live in the control plane's state and *ask* for Pods, which the scheduler
  then places on nodes.
- A **Namespace** is a logical partition of the cluster, not a place. Its Pods can
  be scattered across every node — the boundary is for naming, scoping and access,
  not physical location. Yours is \`${NAMESPACE}\`.
- A **Service** is also virtual: a stable IP and DNS name that load-balances to
  whichever Pods currently match its label selector, wherever they happen to be
  running.

### Your cluster is a cluster of one

A production cluster spreads work across many nodes — that's the point of it. The
diagram shows three so the "which node?" question stays visible, but only the first
one is real here. Rancher Desktop gives you a **single-node k3s cluster**, and that
one node is *both* the control plane and the worker. Every Pod you create in this
course has exactly one place it can go, so scheduling is invisible for now. The
faded nodes are what the same picture looks like in production.
`,
  steps: [
    {
      kind: "task",
      id: "inspect-nodes",
      title: "See your one node — and its two jobs",
      instructions: `List your nodes with the extra columns. Look at the \`ROLES\` column: on a normal
production cluster you'd see separate control-plane and worker nodes, and here
you'll see one node wearing both hats.`,
      command: "kubectl get nodes -o wide",
      hint: "Roles come from labels on the Node object — try `kubectl get node -o jsonpath='{.items[0].metadata.labels}'` to see them raw.",
      check: async () => {
        const { stdout, code } = await kubectl(["get", "nodes", "-o", "json"]);
        if (code !== 0) return { pass: false, message: "Couldn't list nodes — is Rancher Desktop running?" };
        let nodes: any[] = [];
        try {
          nodes = JSON.parse(stdout).items ?? [];
        } catch {
          return { pass: false, message: "Couldn't parse the node list." };
        }
        if (nodes.length === 0) return { pass: false, message: "No nodes found on this cluster." };

        const described = nodes.map((n) => {
          const roles = rolesOf(n);
          return `${n.metadata?.name} (${roles.length ? roles.join(" + ") : "no role label"})`;
        });
        const controlPlane = nodes.filter((n) =>
          rolesOf(n).some((r) => r === "control-plane" || r === "master"),
        );

        if (nodes.length === 1) {
          const both = controlPlane.length === 1;
          return {
            pass: true,
            message: both
              ? `One node: ${described[0]}. It's the control plane *and* the only worker — every Pod you create lands here.`
              : `One node: ${described[0]}. Everything you create in this course runs on it.`,
          };
        }
        return {
          pass: true,
          message: `${nodes.length} nodes: ${described.join(", ")}. The scheduler picks between them for every Pod.`,
        };
      },
    },
    {
      kind: "quiz",
      id: "quiz-namespace-placement",
      title: "Quick check",
      instructions:
        "Two Pods are in the same Namespace on a 3-node cluster. What does that tell you about where they're running?",
      options: [
        "They're on the same node — a Namespace is a slice of one machine",
        "Nothing — a Namespace is a logical grouping, so they could be on any nodes",
        "They're spread across different nodes, one per node",
        "They're on the control plane node",
      ],
      correctIndex: 1,
      explanation:
        "A Namespace is a naming and access boundary in the API, not a physical one. Pods in one Namespace can be scattered across every node in the cluster, and Pods from different Namespaces happily share a node.",
    },
    {
      kind: "quiz",
      id: "quiz-who-places-pods",
      title: "Quick check",
      instructions:
        "You apply a Deployment asking for 3 replicas. Which component decides which node each Pod runs on?",
      options: [
        "kubectl, before it sends the request",
        "The kubelet on whichever node has capacity",
        "The scheduler, in the control plane",
        "etcd",
      ],
      correctIndex: 2,
      explanation:
        "kubectl just POSTs your desired state to the API server, which records it in etcd. A controller creates the Pod objects, the scheduler assigns each one to a node, and only then does that node's kubelet start the containers. On your single-node cluster the scheduler's choice is easy — there's one candidate.",
    },
  ],
};
