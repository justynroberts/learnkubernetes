import type { Lesson } from "./types.js";
import { clusterReachable, currentNodeInfo, listAllNamespacesJson } from "../kube.js";

export const intro: Lesson = {
  id: "intro",
  order: 1,
  title: "Welcome to the Cluster",
  concept: "Cluster architecture",
  focus: "control-plane",
  intro: `
Kubernetes runs your applications across a **cluster** of machines called **nodes**.
One or more nodes act as the **control plane** (the brain: API server, scheduler,
controllers, etcd) and the rest are **workers** that actually run your containers.

Every command you type goes through the **API server** — it is the front door to
everything in Kubernetes. \`kubectl\` is just an HTTP client for that API.

You're connected to a real, local cluster running via **Rancher Desktop** (k3s).
Everything you do in this course happens on that live cluster — nothing here is
simulated.
`,
  steps: [
    {
      kind: "task",
      id: "check-connection",
      title: "Talk to the API server",
      instructions: `Run the command below in the terminal panel to confirm \`kubectl\` can reach your
cluster's API server and list its nodes.`,
      command: "kubectl get nodes",
      hint: "If this fails, make sure Rancher Desktop is running.",
      check: async () => {
        const reachable = await clusterReachable();
        if (!reachable) {
          return { pass: false, message: "Can't reach the cluster API server yet. Is Rancher Desktop running?" };
        }
        const nodes = await currentNodeInfo();
        if (nodes.length === 0) {
          return { pass: false, message: "Connected to the API server, but no nodes were found." };
        }
        return {
          pass: true,
          message: `Connected! Found ${nodes.length} node(s): ${nodes.map((n) => n.name).join(", ")}.`,
        };
      },
    },
    {
      kind: "task",
      id: "system-pods",
      title: "Peek at the system Pods",
      instructions: `Kubernetes itself runs as a set of Pods inside the \`kube-system\` namespace — things
like DNS and networking. List every Pod, in every namespace, to see them.`,
      command: "kubectl get pods -A",
      hint: "The `-A` flag means \"all namespaces\".",
      check: async () => {
        const pods = await listAllNamespacesJson("pods");
        const system = pods.filter((p: any) => p.metadata?.namespace === "kube-system");
        if (system.length === 0) {
          return { pass: false, message: "No kube-system Pods found — the cluster may still be starting." };
        }
        return { pass: true, message: `Found ${system.length} Pod(s) keeping the cluster alive in kube-system.` };
      },
    },
  ],
};
