/**
 * Which region of the cluster diagram each lesson focus lights up, and the
 * one-line "you are here" that goes with it. Kept out of the component file so
 * both the diagram and the sticky map bar can import it without tripping fast
 * refresh.
 */
import type { ClusterFocus } from "../types";

export type Region =
  | "kubectl"
  | "control-plane"
  | "api"
  | "scheduler"
  | "controllers"
  | "etcd"
  | "node-local"
  | "nodes-remote"
  | "kubelet"
  | "namespace"
  | "pods"
  | "labels"
  | "config"
  | "secret"
  | "volume"
  | "service"
  | "ingress"
  | "probes"
  | "job"
  | "external";

export const FOCUS: Record<ClusterFocus, { regions: Region[]; caption: string }> = {
  all: {
    regions: [],
    caption: "Hover any component for what it is and what it does — or pick a piece below.",
  },
  "control-plane": {
    regions: ["kubectl", "control-plane", "api", "scheduler", "controllers", "etcd"],
    caption: "kubectl → the API server. Every command in this course enters the cluster here.",
  },
  namespace: {
    regions: ["namespace"],
    caption: "A logical partition of the cluster — it spans every node rather than sitting on one.",
  },
  pod: {
    regions: ["pods", "node-local"],
    caption: "A Pod: one or more containers, running together on a single node.",
  },
  labels: {
    regions: ["labels", "pods"],
    caption: "Key/value tags on Pods — how Services and controllers find the Pods they care about.",
  },
  deployment: {
    regions: ["controllers", "pods"],
    caption: "A controller in the control plane, continuously asking for Pods on the nodes.",
  },
  replicas: {
    regions: ["controllers", "pods"],
    caption: "More replicas means more Pods, spread across available nodes — all onto node 1 here.",
  },
  service: {
    regions: ["service", "ingress", "pods"],
    caption:
      "Where your application is actually reachable. Users arrive here — not through the API server, which is for controlling the cluster.",
  },
  config: {
    regions: ["config", "pods"],
    caption: "A ConfigMap, injected into the Pod's containers as environment variables or files.",
  },
  secret: {
    regions: ["secret", "pods"],
    caption: "A Secret — same shape as a ConfigMap, handled differently because the values are sensitive.",
  },
  probes: {
    regions: ["kubelet", "probes", "pods"],
    caption: "The node's kubelet polling your container, restarting it or pulling it out of a Service.",
  },
  rollout: {
    regions: ["controllers", "pods"],
    caption: "The Deployment controller swapping Pods a few at a time, old spec out, new spec in.",
  },
  volume: {
    regions: ["volume", "pods"],
    caption: "Storage defined at the Pod level and mounted into its containers.",
  },
  job: {
    regions: ["job", "controllers"],
    caption: "A Pod scheduled onto a node like any other — it just runs once and stops.",
  },
  troubleshoot: {
    regions: ["kubectl", "api", "pods"],
    caption: "get, describe and logs are all reads back through the API server about a Pod.",
  },
  external: {
    regions: ["external", "pods"],
    caption: "A Pod inside your cluster dialling out to a service that lives outside it.",
  },
};

/** The one-line "you are here" for a lesson, reused by the sticky map bar. */
export function focusCaption(focus: ClusterFocus): string {
  return (FOCUS[focus] ?? FOCUS.all).caption;
}

/** Clickable tour of the map, shown on the Core Concepts lesson. */
export const LEGEND: { focus: ClusterFocus; label: string }[] = [
  { focus: "control-plane", label: "Control plane" },
  { focus: "pod", label: "Pods" },
  { focus: "namespace", label: "Namespace" },
  { focus: "deployment", label: "Controllers" },
  { focus: "labels", label: "Labels" },
  { focus: "service", label: "Services" },
  { focus: "config", label: "Config" },
  { focus: "volume", label: "Volumes" },
  { focus: "probes", label: "Probes" },
  { focus: "external", label: "Outside world" },
];

/**
 * The glossary terms behind each region of the map. Hovering a component on
 * the Core Concepts diagram shows these, so the picture and the glossary can't
 * drift apart into two separate descriptions of the same thing.
 */
export const REGION_TERMS: Record<Region, string[]> = {
  kubectl: ["kubectl"],
  "control-plane": ["Control plane"],
  api: ["API server"],
  scheduler: ["Scheduler"],
  controllers: ["Controller", "Deployment"],
  etcd: ["etcd"],
  "node-local": ["Node"],
  "nodes-remote": ["Node"],
  kubelet: ["kubelet", "Container runtime"],
  namespace: ["Namespace"],
  pods: ["Pod", "Container"],
  labels: ["Label", "Selector"],
  config: ["ConfigMap"],
  secret: ["Secret"],
  volume: ["Volume", "emptyDir"],
  service: ["Service", "Endpoints"],
  ingress: ["Ingress", "Service"],
  probes: ["Liveness probe", "Readiness probe"],
  job: ["Job", "CronJob"],
  external: ["Runner"],
};
