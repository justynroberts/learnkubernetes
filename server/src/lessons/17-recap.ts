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
cluster, plus one genuine production workload. This last check looks back across
everything you built to confirm it's all still standing.
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
  ],
};
