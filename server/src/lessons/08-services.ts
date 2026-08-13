import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

export const services: Lesson = {
  id: "services",
  order: 8,
  title: "Services",
  concept: "Services",
  focus: "service",
  intro: `
Pods are ephemeral — they get replaced and get new IPs constantly. A **Service**
gives a stable virtual IP and DNS name that load-balances traffic across whichever
Pods currently match its selector. It's the glue between "a changing set of Pods"
and "something else that needs to reliably reach them".

One catch, which the next lesson fixes: the default Service type, **ClusterIP**, is
only reachable from *inside* the cluster. It's how one component talks to another,
not how your users reach your app from a browser.
`,
  steps: [
    {
      kind: "manifest",
      id: "expose-deployment",
      title: "Expose the Deployment",
      instructions: `Write a ClusterIP Service manifest named \`web-svc\` that load-balances across the
\`web\` Deployment's Pods on port 80, and apply it.`,
      hint: "The selector needs to match the Deployment's Pod labels — app: web — or the Service won't find any Pods.",
      template: `apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
`,
      check: async () => {
        const svc = await getResourceJson<any>("service", "web-svc");
        if (!svc) return { pass: false, message: `Service "web-svc" not found in namespace "${NAMESPACE}".` };
        const hasPort = (svc.spec?.ports ?? []).some((p: any) => p.port === 80);
        if (!hasPort) return { pass: false, message: `Service "web-svc" doesn't expose port 80.` };
        if (svc.spec?.selector?.app !== "web") {
          return { pass: false, message: `Service "web-svc" selector doesn't target app=web.` };
        }
        return { pass: true, message: `Service "web-svc" (${svc.spec.clusterIP}) routes port 80 to app=web Pods.` };
      },
    },
    {
      kind: "task",
      id: "resolve-service",
      title: "Confirm it has endpoints",
      instructions: `A Service is only useful if it actually has Pods behind it. List its endpoints to
confirm real Pod IPs are backing it.`,
      command: `kubectl get endpoints web-svc -n ${NAMESPACE}`,
      check: async () => {
        const ep = await getResourceJson<any>("endpoints", "web-svc");
        const addrCount = (ep?.subsets ?? []).reduce((n: number, s: any) => n + (s.addresses?.length ?? 0), 0);
        if (addrCount === 0) {
          return { pass: false, message: `Service "web-svc" has no endpoints yet — its Pods may still be starting.` };
        }
        return { pass: true, message: `web-svc has ${addrCount} Pod endpoint(s) behind it.` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-services",
      title: "Quick check",
      instructions: "A ClusterIP Service's virtual IP stays stable even as...",
      options: [
        "The cluster is rebooted",
        "Its backing Pods are replaced with new ones",
        "You change its port number",
        "None of the above — ClusterIPs change constantly",
      ],
      correctIndex: 1,
      explanation:
        "That stability is the whole point of a Service — Pods churn constantly, but whatever's talking to the Service doesn't need to know or care.",
    },
  ],
};
