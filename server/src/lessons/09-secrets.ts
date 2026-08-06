import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

export const secrets: Lesson = {
  id: "secrets",
  order: 9,
  title: "Secrets",
  concept: "Secrets",
  intro: `
**Secrets** are almost identical to ConfigMaps in shape, but intended for sensitive
data — passwords, tokens, keys. Kubernetes stores their values base64-encoded and
avoids printing them in plain text by default. (Note: base64 is *encoding*, not
encryption — real secret security depends on cluster-level encryption-at-rest and
RBAC, but the API contract of "handle this differently from config" is what matters
here.)
`,
  steps: [
    {
      id: "create-secret",
      title: "Create a Secret",
      instructions: `Create a Secret named \`web-secret\` with an \`API_KEY\` value.`,
      command: `kubectl create secret generic web-secret --from-literal=API_KEY=super-secret-value -n ${NAMESPACE}`,
      check: async () => {
        const secret = await getResourceJson<any>("secret", "web-secret");
        if (!secret) return { pass: false, message: `Secret "web-secret" not found.` };
        if (!secret.data?.API_KEY) return { pass: false, message: `Secret "web-secret" has no API_KEY key.` };
        return { pass: true, message: `Secret "web-secret" holds an API_KEY (base64-encoded, as expected).` };
      },
    },
    {
      id: "consume-secret",
      title: "Wire it into the Deployment",
      instructions: `Inject the Secret's keys as environment variables into the \`web\` Deployment,
same as you did for the ConfigMap.`,
      command: `kubectl set env deployment/web --from=secret/web-secret -n ${NAMESPACE}`,
      check: async () => {
        const dep = await getResourceJson<any>("deployment", "web");
        const container = dep?.spec?.template?.spec?.containers?.[0];
        const wired = (container?.env ?? []).some((e: any) => e.valueFrom?.secretKeyRef?.name === "web-secret");
        if (!wired) {
          return { pass: false, message: `Deployment "web" isn't pulling env vars from web-secret yet.` };
        }
        return { pass: true, message: `web's containers now source env vars from web-secret.` };
      },
    },
  ],
};
