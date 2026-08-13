import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson, listResourcesBySelector } from "../kube.js";

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
      title: "Confirm it found your Pods",
      instructions: `A Service is only useful if it actually has Pods behind it. Kubernetes keeps that
list in an **EndpointSlice** — one per Service, holding the IPs of every Pod
currently matching its selector. An empty one nearly always means the selector
doesn't match your Pods' labels.`,
      command: `kubectl get endpointslices -n ${NAMESPACE} -l kubernetes.io/service-name=web-svc`,
      hint: "Older guides use `kubectl get endpoints`, which still works but is deprecated from Kubernetes 1.33 onward — EndpointSlice is the replacement.",
      check: async () => {
        const slices = await listResourcesBySelector<any>(
          "endpointslices",
          "kubernetes.io/service-name=web-svc",
        );
        const addrCount = slices.reduce(
          (n: number, slice: any) =>
            n +
            (slice.endpoints ?? []).filter((e: any) => e.conditions?.ready !== false).reduce(
              (m: number, e: any) => m + (e.addresses?.length ?? 0),
              0,
            ),
          0,
        );
        if (addrCount === 0) {
          return {
            pass: false,
            message: `Service "web-svc" has no Pod addresses behind it yet — its Pods may still be starting, or its selector may not match their labels.`,
          };
        }
        return { pass: true, message: `web-svc has ${addrCount} Pod address(es) behind it.` };
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
