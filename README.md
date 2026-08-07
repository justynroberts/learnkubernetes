# PagerDuty Kubernetes Academy

An interactive, hands-on Kubernetes course that runs against your **real local
cluster** (Rancher Desktop). Every lesson's "Validate" button actually queries your
cluster's live state — nothing is faked. Most lessons also include a quiz question
to check conceptual understanding, not just command recall.

## What's inside

- `server/` — Express API + validation engine. Runs `kubectl` against the
  `rancher-desktop` context to check whether each lesson step's task is actually
  done, and hosts a WebSocket bridge (`node-pty`) that gives the browser a real
  terminal.
- `web/` — React + Vite + Tailwind frontend: lesson sidebar with progress, markdown
  lesson content, step-by-step tasks and quizzes, an embedded terminal.

16 lessons: cluster basics, Namespaces, Pods, Labels & Selectors, Deployments,
Scaling, Services, ConfigMaps, Secrets, Health Probes, Rolling Updates & Rollbacks,
Volumes, Jobs & CronJobs, Troubleshooting, a capstone that deploys a real **PagerDuty
Runbook Automation** runner, and a final recap/graduation.

The capstone (lesson 15) requires access to a PagerDuty Runbook Automation instance
to generate a Runner's Server URL / Client ID / Token (Runner Management page).
Validation checks that the deployed runner Pod is actually `Running` and `Ready`,
not just that the manifest looks right. Note: the current Runner image is published
for `linux/amd64` only — on Apple Silicon Macs, Rancher Desktop's `arm64` node can't
run it as-is (the lesson explains this if you hit it).

## Prerequisites

- Rancher Desktop running with Kubernetes enabled (this targets the
  `rancher-desktop` kubeconfig context specifically).
- Node.js 20+.

## Running it

```bash
npm install --prefix server
npm install --prefix web
npm run dev
```

This starts the API/terminal server on `:4000` and the frontend on `:5173`. Open
`http://localhost:5173`.

All lesson exercises live in a dedicated `k8s-academy` namespace, created
automatically on first run, so this never touches anything else on your cluster.
The "Reset course" button in the header deletes and recreates that namespace and
clears your local progress, if you want to start over.

## How validation works

Each lesson step ships with a small server-side check (`server/src/lessons/*.ts`)
that runs real `kubectl get`/`describe`-style queries against the `k8s-academy`
namespace and inspects the JSON response — e.g. "does the `web` Deployment have
`readyReplicas == 4`?". There's no simulated state; if you complete the step by hand
in your own terminal instead of the embedded one, validation still passes.
