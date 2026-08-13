import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "./../kube.js";

const APP_URL = "http://localhost";

/**
 * Fetches the app through the cluster's ingress controller. The training
 * server runs on the same machine as the cluster, so plain localhost is the
 * same address the learner types into their browser — this checks the real
 * thing rather than asking the API whether it thinks it should work.
 */
async function fetchApp(): Promise<{ status: number; body: string } | { error: string }> {
  try {
    const res = await fetch(APP_URL, { signal: AbortSignal.timeout(5000) });
    return { status: res.status, body: (await res.text()).slice(0, 4000) };
  } catch (err: any) {
    return { error: err?.message ?? String(err) };
  }
}

function backendService(ingress: any): string | undefined {
  const rule = ingress?.spec?.rules?.[0];
  return rule?.http?.paths?.[0]?.backend?.service?.name;
}

export const ingress: Lesson = {
  id: "ingress",
  order: 9,
  title: "Reach It From a Browser",
  concept: "Ingress",
  focus: "ingress",
  intro: `
Your \`web\` Deployment has been running nginx this whole time — a **web server**,
sitting there ready to serve a web page — and the Service in the last lesson gave it
a stable address. But that address is a **ClusterIP**: it only exists *inside* the
cluster. Nothing you can type into a browser reaches it yet.

An **Ingress** is the missing piece. It's the rule that says "traffic arriving at
this hostname and path goes to this Service". The thing that actually enforces that
rule is an **ingress controller** — a real program running in the cluster, watching
for Ingress objects and configuring itself to match. Rancher Desktop ships one
called **Traefik**, already running and listening on port 80 of your machine, which
is why this works with no extra setup.

So the full path, once you're done here, is:

> **your browser → localhost:80 → Traefik → the \`web-svc\` Service → one of your
> nginx Pods**

That's the same shape as production, where the hostname would be a real domain and
the traffic would arrive from the internet instead of from your own browser.
`,
  steps: [
    {
      kind: "manifest",
      id: "create-ingress",
      title: "Create an Ingress",
      instructions: `Write an Ingress named \`web-ingress\` that sends every request on \`/\` to the
\`web-svc\` Service on port 80, and apply it. Leaving the hostname out means it
matches any host — including plain \`localhost\`.`,
      hint: "The service name here must match the Service you made last lesson exactly — web-svc, port 80.",
      template: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  namespace: ${NAMESPACE}
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-svc
                port:
                  number: 80
`,
      check: async () => {
        const svc = await getResourceJson<any>("service", "web-svc");
        if (!svc) {
          return { pass: false, message: "There's no web-svc Service yet — finish the Services lesson first." };
        }
        const ing = await getResourceJson<any>("ingress", "web-ingress");
        if (!ing) return { pass: false, message: "No Ingress named web-ingress found in this namespace." };

        const backend = backendService(ing);
        if (backend !== "web-svc") {
          return {
            pass: false,
            message: `The Ingress points at "${backend ?? "nothing"}" rather than web-svc, so requests won't reach your Pods.`,
          };
        }
        return {
          pass: true,
          message: "Ingress created, routing / to web-svc. Next step: see it in your browser.",
        };
      },
    },
    {
      kind: "task",
      id: "open-in-browser",
      title: "Open your app",
      instructions: `Open **http://localhost** in a new browser tab. You should see nginx's
"Welcome to nginx!" page — that's a container in your cluster answering a real
request from your browser. Then hit Validate, which fetches the same URL to confirm
it works.`,
      command: "curl -s http://localhost | head -5",
      hint: "Give it a few seconds after creating the Ingress. If you see a 404, something else may already own port 80 on your machine.",
      check: async () => {
        const res = await fetchApp();
        if ("error" in res) {
          return {
            pass: false,
            message: `Couldn't reach ${APP_URL} (${res.error}). Is Rancher Desktop still running? Traefik listens on port 80 — check nothing else is using it.`,
          };
        }
        if (res.status === 404) {
          return {
            pass: false,
            message:
              "Got a 404 from port 80. The ingress controller answered but didn't route to your Service — give it a few more seconds, then re-check the Ingress backend name.",
          };
        }
        if (res.status !== 200) {
          return { pass: false, message: `Got HTTP ${res.status} from ${APP_URL} rather than 200.` };
        }
        if (!/nginx/i.test(res.body)) {
          return {
            pass: false,
            message: `Something answered on ${APP_URL}, but it doesn't look like your nginx Pod. Is another web server already using port 80?`,
          };
        }
        return {
          pass: true,
          message: "That's your Pod, served through Traefik and your Service, from your own browser. 🎉",
        };
      },
    },
    {
      kind: "quiz",
      id: "quiz-ingress",
      title: "Quick check",
      instructions: "You create an Ingress object on a cluster with no ingress controller installed. What happens?",
      options: [
        "Kubernetes installs one automatically",
        "Nothing — the object exists, but no traffic is routed",
        "The Ingress is rejected by the API server",
        "Traffic falls back to the Service's ClusterIP",
      ],
      correctIndex: 1,
      explanation:
        "An Ingress is only a rule. Something has to read it and act on it — that's the ingress controller. Without one the object sits there doing nothing, which is a classic source of confusion on a fresh cluster.",
    },
  ],
};
