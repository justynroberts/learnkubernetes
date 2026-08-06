import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson, namespaceExists } from "../kube.js";

export const recap: Lesson = {
  id: "recap",
  order: 15,
  title: "Graduation",
  concept: "Putting it all together",
  intro: `
You've touched Namespaces, Pods, Deployments, Services, ConfigMaps, Secrets, health
probes, Volumes, Jobs, CronJobs, and troubleshooting — the core vocabulary you'll
see in almost any real Kubernetes cluster. This last check looks back across
everything you built to confirm it's all still standing.
`,
  steps: [
    {
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
