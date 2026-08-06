import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

export const configmaps: Lesson = {
  id: "configmaps",
  order: 8,
  title: "ConfigMaps",
  concept: "ConfigMaps",
  intro: `
Hardcoding configuration into a container image is a bad idea — you'd need to
rebuild the image just to change a setting. A **ConfigMap** stores non-sensitive
configuration as key/value pairs outside the image, which you can then inject into
Pods as environment variables or mounted files.
`,
  steps: [
    {
      id: "create-configmap",
      title: "Create a ConfigMap",
      instructions: `Create a ConfigMap named \`web-config\` with a \`GREETING\` key.`,
      command: `kubectl create configmap web-config --from-literal=GREETING="Hello from a ConfigMap" -n ${NAMESPACE}`,
      check: async () => {
        const cm = await getResourceJson<any>("configmap", "web-config");
        if (!cm) return { pass: false, message: `ConfigMap "web-config" not found.` };
        if (!cm.data?.GREETING) return { pass: false, message: `ConfigMap "web-config" has no GREETING key.` };
        return { pass: true, message: `ConfigMap "web-config" has GREETING="${cm.data.GREETING}".` };
      },
    },
    {
      id: "consume-configmap",
      title: "Wire it into the Deployment",
      instructions: `Inject the ConfigMap's keys as environment variables into the \`web\` Deployment's
containers. Kubernetes will automatically roll the Pods to pick up the change.`,
      command: `kubectl set env deployment/web --from=configmap/web-config -n ${NAMESPACE}`,
      hint: "Note the `--from` flag comes right after `set env`, before the deployment name.",
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        const container = dep?.spec?.template?.spec?.containers?.[0];
        const wired = (container?.env ?? []).some((e: any) => e.valueFrom?.configMapKeyRef?.name === "web-config");
        if (!wired) {
          return { pass: false, message: `Deployment "web" isn't pulling env vars from web-config yet.` };
        }
        return { pass: true, message: `web's containers now source env vars from web-config.` };
      },
    },
  ],
};
