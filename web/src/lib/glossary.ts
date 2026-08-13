/**
 * Reference material for the glossary panel. Purely explanatory — nothing here
 * is validated against a cluster, so it lives with the frontend rather than in
 * the lesson modules.
 *
 * `lesson` is the lesson number that teaches the term, so the panel can point
 * a reader at the hands-on version of the definition they just looked up.
 */

export interface GlossaryEntry {
  term: string;
  /** One line: what it is, in plain words. */
  what: string;
  /** A short paragraph of the detail that actually matters in practice. */
  detail: string;
  /** A representative command, where there's an obvious one. */
  command?: string;
  lesson?: number;
}

export interface GlossaryGroup {
  id: string;
  title: string;
  blurb: string;
  entries: GlossaryEntry[];
}

export const GLOSSARY: GlossaryGroup[] = [
  {
    id: "cluster",
    title: "The cluster itself",
    blurb: "The machines, and the software that decides what runs on them.",
    entries: [
      {
        term: "Cluster",
        what: "A set of machines running Kubernetes as one pool of compute.",
        detail:
          "Everything else in this glossary lives inside a cluster. You talk to it as a single system — you ask for what you want, and it decides which machine actually runs it. Your local Rancher Desktop cluster is a real one; it just happens to have a single machine in it.",
        command: "kubectl cluster-info",
        lesson: 1,
      },
      {
        term: "Node",
        what: "One machine in the cluster — physical, virtual, or in your case a small Linux VM.",
        detail:
          "Nodes are where containers actually run. Production clusters have many, so work can spread out and survive a machine dying. Rancher Desktop gives you exactly one, and it does double duty as both control plane and worker.",
        command: "kubectl get nodes -o wide",
        lesson: 2,
      },
      {
        term: "Control plane",
        what: "The brain of the cluster: the components that make decisions.",
        detail:
          "Made up of the API server, scheduler, controller manager and etcd. It doesn't run your application containers itself — on a big cluster it sits on dedicated nodes. On single-node k3s it shares the one node with your workloads.",
        lesson: 2,
      },
      {
        term: "API server",
        what: "The front door. Every request into Kubernetes goes through it.",
        detail:
          "kubectl is just an HTTPS client for this API, and so is every controller and every kubelet. If something can't reach the API server, nothing works — which is why the very first lesson checks you can.",
        command: "kubectl get --raw /livez",
        lesson: 1,
      },
      {
        term: "Scheduler",
        what: "Decides which node each new Pod should run on.",
        detail:
          "It looks at what the Pod needs (CPU, memory, node selectors, affinity rules) and what each node has free, then writes its decision back to the API server. On a one-node cluster the decision is easy, but the step still happens.",
        lesson: 2,
      },
      {
        term: "Controller",
        what: "A loop that compares what you asked for against what exists, and fixes the difference.",
        detail:
          "This is the core idea of Kubernetes. You declare a desired state — 4 replicas of this image — and a controller works continuously to make reality match. Deployments, ReplicaSets, Jobs and CronJobs are all controllers.",
        lesson: 2,
      },
      {
        term: "etcd",
        what: "The database where the cluster's desired state is stored.",
        detail:
          "Every object you create is a record in etcd. It's the single source of truth: lose it and you lose the cluster's memory of what should be running. You'll rarely touch it directly.",
        lesson: 2,
      },
      {
        term: "kubelet",
        what: "The agent on each node that actually starts and watches containers.",
        detail:
          "It asks the API server which Pods have been assigned to its node, tells the container runtime to start them, and reports their status back. It's also what runs your liveness and readiness probes.",
        lesson: 2,
      },
      {
        term: "Container runtime",
        what: "The software that runs containers on a node — containerd, in your case.",
        detail:
          "The kubelet doesn't run containers itself; it delegates to a runtime through a standard interface. This is why Kubernetes isn't tied to Docker specifically.",
        lesson: 2,
      },
      {
        term: "kubectl",
        what: "The command-line tool for talking to a cluster.",
        detail:
          "Reads your kubeconfig file to know which cluster to talk to and as whom. Every command in this course is a kubectl command; there's nothing it does that you couldn't do with raw HTTP calls to the API server.",
        command: "kubectl config current-context",
        lesson: 1,
      },
      {
        term: "Namespace",
        what: "A logical partition of the cluster, used for naming and access control.",
        detail:
          "Not a place. Pods in one namespace can be scattered across every node, and two namespaces happily share a machine. What it does give you is a scope: names must be unique within a namespace, and permissions and quotas are usually set per namespace. This course works in k8s-academy.",
        command: "kubectl get namespaces",
        lesson: 3,
      },
    ],
  },
  {
    id: "workloads",
    title: "Workloads",
    blurb: "The objects that describe something you want running.",
    entries: [
      {
        term: "Pod",
        what: "The smallest thing Kubernetes will run: one or more containers, together.",
        detail:
          "Containers in a Pod share a network address and can share storage, and they're always scheduled onto the same node as a unit. Most Pods hold exactly one container. You rarely create Pods directly in production — something else usually creates them for you.",
        command: "kubectl get pods",
        lesson: 4,
      },
      {
        term: "nginx",
        what: "The web server this course runs as its example application.",
        detail:
          "Pronounced \"engine-x\", it's a widely used open-source web server: start it, point traffic at it, and it serves web pages. It's used throughout these lessons because it starts in about a second and shows an obvious \"Welcome to nginx!\" page when you reach it, which makes it easy to tell whether your Service and Ingress are actually working.",
        lesson: 4,
      },
      {
        term: "Container",
        what: "A packaged process: your application plus everything it needs to run.",
        detail:
          "Defined inside a Pod spec by an image name, plus optional environment variables, volume mounts, resource limits and probes. Restarting a container doesn't move the Pod — it restarts the process in place.",
        lesson: 4,
      },
      {
        term: "Deployment",
        what: "Describes a set of identical Pods and keeps that many running.",
        detail:
          "The standard way to run a stateless application. You state the image and the replica count; the Deployment creates a ReplicaSet to hold the Pods, replaces any that die, and handles rolling out new versions gradually.",
        command: "kubectl get deployments",
        lesson: 6,
      },
      {
        term: "ReplicaSet",
        what: "The object directly responsible for keeping N copies of a Pod alive.",
        detail:
          "You almost never create one by hand — a Deployment creates one per revision. That layering is what makes rolling updates and rollbacks work: the old ReplicaSet sticks around, scaled to zero, ready to be scaled back up.",
        command: "kubectl get replicasets",
        lesson: 6,
      },
      {
        term: "Replica",
        what: "One running copy of a Pod within a Deployment.",
        detail:
          "Scaling means changing the number of replicas — one number in one field. The controller then adds or removes Pods until reality matches, and the scheduler places any new ones.",
        command: "kubectl scale deployment/web --replicas=4",
        lesson: 7,
      },
      {
        term: "Job",
        what: "Runs a Pod until it finishes successfully, then stops.",
        detail:
          "For batch work: a migration, a backup, a one-off script. Unlike a Deployment, completion is success rather than failure. A Job tracks how many completions it needs and retries on failure.",
        command: "kubectl get jobs",
        lesson: 15,
      },
      {
        term: "CronJob",
        what: "A Job that runs on a repeating schedule.",
        detail:
          "Uses standard Unix cron syntax. It creates a new Job at each scheduled time, and keeps a short history of recent runs so you can see what happened.",
        command: "kubectl get cronjobs",
        lesson: 15,
      },
      {
        term: "DaemonSet",
        what: "Runs one copy of a Pod on every node.",
        detail:
          "Used for per-machine agents: log collectors, monitoring, networking. Not covered hands-on in this course, but you'll see them in any real cluster — including the ones k3s runs for you.",
        command: "kubectl get daemonsets -A",
      },
      {
        term: "StatefulSet",
        what: "Like a Deployment, but for Pods that need stable identities and storage.",
        detail:
          "Each Pod gets a predictable name and keeps its own persistent volume across restarts. Databases and other stateful systems use these. Beyond this course's scope, but worth knowing the name.",
        command: "kubectl get statefulsets",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking & discovery",
    blurb: "How things find and reach each other.",
    entries: [
      {
        term: "Service",
        what: "A stable address in front of a changing set of Pods.",
        detail:
          "Pods are replaced constantly and get new IPs each time, so nothing should talk to a Pod IP directly. A Service gives you one virtual IP and DNS name, and load-balances across whichever Pods currently match its selector — on any node.",
        command: "kubectl get services",
        lesson: 8,
      },
      {
        term: "ClusterIP",
        what: "The default Service type: reachable only from inside the cluster.",
        detail:
          "Perfect for one component talking to another. The other types build on it — NodePort opens a port on every node, and LoadBalancer asks your cloud provider for an external address.",
        lesson: 8,
      },
      {
        term: "Endpoints",
        what: "The actual list of Pod IPs currently behind a Service.",
        detail:
          "The best way to check whether a Service is doing anything. An empty endpoints list almost always means the Service's selector doesn't match your Pods' labels — a typo, usually.",
        command: "kubectl get endpoints web-svc",
        lesson: 8,
      },
      {
        term: "Label",
        what: "A key/value tag attached to an object.",
        detail:
          "Labels are how Kubernetes objects refer to each other. They're arbitrary — app=web, tier=frontend, env=prod — and you can attach as many as you like, then filter on them.",
        command: "kubectl get pods --show-labels",
        lesson: 5,
      },
      {
        term: "Selector",
        what: "A query that picks objects by their labels.",
        detail:
          "A Service selects the Pods it sends traffic to; a Deployment selects the Pods it owns. This is why Kubernetes uses loose label matching rather than fixed names — Pods can come and go without anything being rewired.",
        command: "kubectl get pods -l app=web",
        lesson: 5,
      },
      {
        term: "Ingress",
        what: "The public front door: routes traffic from outside the cluster to a Service inside it.",
        detail:
          "Handles hostnames, paths and TLS in one place instead of exposing each Service separately. An Ingress is only a rule: an ingress controller has to read it and act on it — Rancher Desktop runs one called Traefik, on port 80 of your machine. This is the path your users take to reach your application, quite separate from kubectl, which talks to the API server to control the cluster.",
        command: "kubectl get ingress",
        lesson: 9,
      },
    ],
  },
  {
    id: "config",
    title: "Configuration & storage",
    blurb: "Getting settings, secrets and disk into a container.",
    entries: [
      {
        term: "ConfigMap",
        what: "Non-sensitive configuration stored outside the container image.",
        detail:
          "Key/value pairs you can inject as environment variables or mount as files. The point is that changing a setting shouldn't mean rebuilding and redeploying an image.",
        command: "kubectl get configmaps",
        lesson: 10,
      },
      {
        term: "Secret",
        what: "The same idea as a ConfigMap, for values that shouldn't be casually readable.",
        detail:
          "Passwords, tokens, keys. Values are base64-encoded, which is encoding and not encryption — real protection comes from encryption at rest and RBAC. Using the Secret type signals intent and keeps values out of most log output.",
        command: "kubectl get secrets",
        lesson: 11,
      },
      {
        term: "Volume",
        what: "Storage attached to a Pod and mounted into its containers.",
        detail:
          "A container's own filesystem is wiped when it restarts. A volume survives that. An emptyDir — the simplest kind — still disappears when the whole Pod is deleted.",
        lesson: 14,
      },
      {
        term: "emptyDir",
        what: "A scratch volume that lives and dies with the Pod.",
        detail:
          "Created empty when the Pod starts on a node, shared between that Pod's containers, deleted when the Pod is removed. Good for caches and scratch space, useless for anything you need to keep.",
        lesson: 14,
      },
      {
        term: "PersistentVolume / PersistentVolumeClaim",
        what: "Storage that outlives the Pod using it.",
        detail:
          "A PersistentVolumeClaim is a request for storage of a given size; the cluster binds it to a real PersistentVolume backed by a disk. This is what databases use. Beyond this course, but it's the answer to 'how do I keep the data?'.",
        command: "kubectl get pvc",
      },
    ],
  },
  {
    id: "operations",
    title: "Keeping it running",
    blurb: "Health, updates, and working out what went wrong.",
    entries: [
      {
        term: "Liveness probe",
        what: "A periodic check that answers: is this container still working?",
        detail:
          "If it fails repeatedly, the kubelet restarts the container. It's the cure for a process that's technically alive but wedged — a deadlock, an exhausted thread pool.",
        lesson: 12,
      },
      {
        term: "Readiness probe",
        what: "A periodic check that answers: can this container take traffic yet?",
        detail:
          "Failing readiness pulls the Pod out of its Service's endpoints but leaves it running. This is what stops requests hitting an app that's still warming up, and what drains traffic from an overloaded one.",
        lesson: 12,
      },
      {
        term: "Rolling update",
        what: "Replacing Pods with a new version gradually, so the app stays up.",
        detail:
          "The Deployment scales up a new ReplicaSet while scaling down the old one, a few Pods at a time, waiting for new Pods to become ready before continuing.",
        command: "kubectl rollout status deployment/web",
        lesson: 13,
      },
      {
        term: "Rollback",
        what: "Going back to the previous working version of a Deployment.",
        detail:
          "Each revision keeps its ReplicaSet, so rolling back is just scaling the old one up again. This is why a bad deploy is a minute's problem rather than an afternoon's.",
        command: "kubectl rollout undo deployment/web",
        lesson: 13,
      },
      {
        term: "Events",
        what: "The cluster's running commentary on what it tried to do and how it went.",
        detail:
          "Scheduling decisions, image pulls, probe failures, restarts. Shown at the bottom of kubectl describe, and usually where the real answer is when something won't start.",
        command: "kubectl describe pod <name>",
        lesson: 16,
      },
      {
        term: "CrashLoopBackOff",
        what: "The container keeps starting and immediately dying.",
        detail:
          "Kubernetes restarts it with an increasing delay between attempts — the 'backoff'. The status tells you the container starts; the logs tell you why it stops. Read the logs.",
        command: "kubectl logs <name> --previous",
        lesson: 16,
      },
      {
        term: "ImagePullBackOff",
        what: "The node couldn't download the container image.",
        detail:
          "A typo in the image name, a private registry with no credentials, or an image built for a different CPU architecture. There are no logs to read, because the container never started — describe the Pod and read the Events.",
        command: "kubectl describe pod <name>",
        lesson: 16,
      },
      {
        term: "Manifest",
        what: "A YAML file describing an object you want to exist.",
        detail:
          "The normal way to work with Kubernetes: write it down, review it, commit it, apply it. Every manifest has apiVersion, kind, metadata and usually spec. Applying the same manifest twice is harmless — the cluster converges on what it says.",
        command: "kubectl apply -f file.yaml",
        lesson: 6,
      },
      {
        term: "Runner",
        what: "A PagerDuty Runbook Automation agent that runs inside your network.",
        detail:
          "It dials out to your Runbook Automation instance rather than accepting inbound connections, so it can execute automation against systems the SaaS side can't reach directly. The course capstone deploys a real one using a Secret and a Deployment.",
        lesson: 17,
      },
    ],
  },
];

/** Look up entries by exact term name, preserving the order asked for. */
export function glossaryEntries(terms: string[]): GlossaryEntry[] {
  const all = GLOSSARY.flatMap((g) => g.entries);
  return terms.map((t) => all.find((e) => e.term === t)).filter((e): e is GlossaryEntry => !!e);
}
