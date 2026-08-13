import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson, listResourcesJson, namespaceExists } from "../kube.js";

export const recap: Lesson = {
  id: "recap",
  order: 17,
  title: "Graduation",
  concept: "Putting it all together",
  focus: "all",
  intro: `
You've touched Namespaces, Pods, Deployments, Services, ConfigMaps, Secrets, health
probes, Volumes, Jobs, CronJobs, troubleshooting, and deployed a real Runbook
Automation runner — the core vocabulary you'll see in almost any real Kubernetes
cluster, plus one genuine production workload.

Two things left. First a check across your cluster to confirm everything you built is
still standing, then the final exam: ten questions drawn from the whole course. You
need eight right to graduate, and you can retake it as many times as you like.
`,
  steps: [
    {
      kind: "task",
      id: "final-check",
      title: "Final cluster check",
      instructions: `No new command this time — just hit **Validate** to confirm everything you built
during this course is still healthy on your cluster.`,
      check: async () => {
        const checks: { label: string; ok: boolean }[] = [];

        checks.push({ label: "namespace", ok: await namespaceExists(NAMESPACE) });

        const dep = await getResourceJson<any>("deployment", "web");
        checks.push({ label: "web Deployment", ok: !!dep && (dep.status?.readyReplicas ?? 0) > 0 });

        const svc = await getResourceJson<any>("service", "web-svc");
        checks.push({ label: "web-svc Service", ok: !!svc });

        const cm = await getResourceJson<any>("configmap", "web-config");
        checks.push({ label: "web-config ConfigMap", ok: !!cm });

        const secret = await getResourceJson<any>("secret", "web-secret");
        checks.push({ label: "web-secret Secret", ok: !!secret });

        const cron = await getResourceJson<any>("cronjob", "hello-cron");
        checks.push({ label: "hello-cron CronJob", ok: !!cron });

        const runnerSecret = await getResourceJson<any>("secret", "runner-credentials");
        checks.push({ label: "runner-credentials Secret", ok: !!runnerSecret });

        const deps = await listResourcesJson<any>("deployments");
        const runnerDep = deps.find((d) =>
          (d.spec?.template?.spec?.containers ?? []).some(
            (c: any) => typeof c.image === "string" && c.image.toLowerCase().includes("runner"),
          ),
        );
        checks.push({ label: "runner Deployment", ok: !!runnerDep && (runnerDep.status?.readyReplicas ?? 0) > 0 });

        const failed = checks.filter((c) => !c.ok).map((c) => c.label);
        if (failed.length > 0) {
          return { pass: false, message: `Still missing: ${failed.join(", ")}. Revisit those lessons.` };
        }
        return {
          pass: true,
          message: `Everything checks out — ${checks.length}/${checks.length} resources healthy. You did it!`,
        };
      },
    },
    {
      kind: "exam",
      id: "final-exam",
      title: "Final exam",
      instructions:
        "Ten questions covering the whole course. Nothing here needs a command run — it's all recall and reasoning.",
      passMark: 0.8,
      questions: [
        {
          id: "q-service",
          prompt:
            "Your Pods keep getting replaced and picking up new IPs. Which object gives whatever Pods currently exist one stable address to be reached on?",
          options: ["A Service", "A ConfigMap", "A Namespace", "A ReplicaSet"],
          correctIndex: 0,
          explanation:
            "A Service is a stable virtual IP and DNS name that load-balances across whichever Pods currently match its selector, no matter how often they're replaced.",
        },
        {
          id: "q-replicaset",
          prompt: "You apply a Deployment. Which object directly creates and watches over its Pods?",
          options: [
            "The Deployment itself",
            "A ReplicaSet the Deployment manages",
            "The kubelet",
            "The scheduler",
          ],
          correctIndex: 1,
          explanation:
            "A Deployment manages ReplicaSets, and a ReplicaSet manages the Pods. That extra layer is what lets a rolling update run two versions side by side.",
        },
        {
          id: "q-readiness",
          prompt: "A container's readiness probe starts failing. What does Kubernetes do?",
          options: [
            "Restarts the container immediately",
            "Deletes the Pod and schedules a replacement",
            "Stops sending it Service traffic, but leaves it running",
            "Nothing — readiness probes are only for monitoring",
          ],
          correctIndex: 2,
          explanation:
            "Readiness controls traffic: a failing readiness probe pulls the Pod out of its Service's endpoints but leaves it alone. It's the liveness probe that restarts a container.",
        },
        {
          id: "q-namespace",
          prompt: "What does putting two Pods in the same Namespace guarantee about them?",
          options: [
            "They run on the same node",
            "They share a filesystem",
            "Nothing about placement — it's a naming and access boundary",
            "They can only talk to each other",
          ],
          correctIndex: 2,
          explanation:
            "A Namespace is a logical partition in the API, not a physical one. Its Pods can be scattered across every node, and by default it doesn't restrict network traffic either.",
        },
        {
          id: "q-emptydir",
          prompt: "A Pod has an `emptyDir` volume with data in it. You delete the Pod. What happens to the data?",
          options: [
            "It survives — that's the point of a volume",
            "It's deleted along with the Pod",
            "It's automatically backed up to the node's disk",
            "It moves to the replacement Pod",
          ],
          correctIndex: 1,
          explanation:
            "An emptyDir outlives container restarts, but not the Pod itself. Surviving Pod deletion needs a PersistentVolume.",
        },
        {
          id: "q-secret",
          prompt: "How are Secret values stored by default?",
          options: [
            "Encrypted with a key only the API server holds",
            "Base64-encoded, which is encoding rather than encryption",
            "Hashed, so nothing can read them back",
            "In plain text, exactly like a ConfigMap",
          ],
          correctIndex: 1,
          explanation:
            "Base64 is trivially reversible. Real protection comes from cluster-level encryption at rest and RBAC — the Secret type mainly signals 'handle this differently'.",
        },
        {
          id: "q-rollback",
          prompt: "What makes `kubectl rollout undo` possible after a bad Deployment update?",
          options: [
            "Kubernetes snapshots the container filesystem before updating",
            "The previous ReplicaSet is kept, so its Pod spec can be brought back",
            "The image registry keeps the old image",
            "Nothing — you have to re-apply the old YAML by hand",
          ],
          correctIndex: 1,
          explanation:
            "Each revision keeps its ReplicaSet around, scaled to zero. Rolling back just scales the old one up and the new one down.",
        },
        {
          id: "q-scheduler",
          prompt:
            "You scale a Deployment from 2 replicas to 4. Which component decides which node the two new Pods run on?",
          options: ["kubectl", "The scheduler", "The kubelet on each node", "etcd"],
          correctIndex: 1,
          explanation:
            "The controller creates the Pod objects, the scheduler assigns each to a node, and that node's kubelet starts the containers. On a single-node cluster the scheduler's decision is easy.",
        },
        {
          id: "q-troubleshoot",
          prompt: "A Pod is stuck in `ImagePullBackOff`. Which command tells you why first?",
          options: [
            "kubectl logs <pod> — read what the container printed",
            "kubectl describe pod <pod> — read the Events at the bottom",
            "kubectl get pods -o wide — check which node it's on",
            "kubectl delete pod <pod> — force a retry",
          ],
          correctIndex: 1,
          explanation:
            "There are no logs yet, because the container never started. describe shows the Events, which name the exact registry error.",
        },
        {
          id: "q-job",
          prompt: "Which workload would you use for a one-off database migration?",
          options: [
            "A Deployment, scaled to 1",
            "A Job",
            "A Service",
            "A DaemonSet",
          ],
          correctIndex: 1,
          explanation:
            "A Job runs its Pod to completion and tracks success. A Deployment would restart the migration forever, because it's built to keep something running.",
        },
      ],
    },
  ],
};
