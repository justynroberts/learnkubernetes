# PagerDuty Kubernetes Academy (101 - Basics)

Learn Kubernetes by actually using it. This is a 17-lesson course that runs in your
browser and works against a real Kubernetes cluster on your own machine — when a
lesson says "create a Deployment", you create a real one, and the **Validate** button
checks your real cluster to see whether it worked. Nothing is simulated.

You don't need any Kubernetes experience to start.

## Getting started

Two free programs to install, once, and then the course itself.

**1. Rancher Desktop** — this is what gives you a Kubernetes cluster on your laptop.

Download it from [rancherdesktop.io](https://rancherdesktop.io), install it, and open
it. Go to **Preferences → Kubernetes** and make sure **Enable Kubernetes** is ticked.
Then wait for its status indicator to turn green — the first startup takes a few
minutes while it downloads things. Leave it running in the background whenever you're
doing the course.

**2. Node.js** — download the "LTS" version from [nodejs.org](https://nodejs.org).
Any version 20 or newer is fine.

**3. This course.** Open Terminal and run:

```bash
git clone https://github.com/justynroberts/learnkubernetes.git
cd learnkubernetes
./start.sh
```

That's the whole thing. `start.sh` checks everything is set up, installs what it needs
the first time (this takes a minute or two), starts the course, and opens it in your
browser at **http://localhost:5173**.

Leave that Terminal window open while you're using the course — it's running the app.
Press **Ctrl+C** in it when you want to stop.

Next time you want to pick up where you left off: start Rancher Desktop, then run
`./start.sh` from the `learnkubernetes` folder again. Your progress is saved.

### If something goes wrong

`start.sh` checks the common problems before it starts and tells you in plain English
what to fix — Rancher Desktop not running, Kubernetes not switched on, Node.js
missing or too old. Fix what it mentions and run `./start.sh` again. Re-running it is
always safe; it skips anything already done.

If it says a port is already in use, the course is probably already running — just
open http://localhost:5173.

On Windows, run all of this inside WSL. On macOS and Linux it works as-is.

## What the course does to your computer

Everything you create during the lessons goes into its own separate area of the
cluster (a namespace called `k8s-academy`), so it can't disturb anything else you
might have running. The **Reset course** button in the top-right deletes all of it and
clears your progress, if you want a clean start.

## What you'll learn

17 lessons, each with hands-on steps and a quiz:

Cluster basics · Core Concepts · Namespaces · Pods · Labels & Selectors · Deployments
· Scaling · Services · ConfigMaps · Secrets · Health Probes · Rolling Updates &
Rollbacks · Volumes · Jobs & CronJobs · Troubleshooting · a real-world capstone · a
recap

Every lesson opens with a diagram of a cluster, with the piece you're about to work on
lit up, so you can always see where the thing you're creating actually lives. It's
drawn from your own cluster — your real node name, and faded extra nodes to show what
a production cluster looks like compared to the single-node one on your laptop. Lesson
2 walks through the whole diagram.

Exercises appear one at a time — the next one unlocks when you finish the one before
it, so a lesson is never a wall of text. The course ends with a ten-question final
exam; get eight right to graduate, and retake it as often as you like.

Forgotten what something means? The **Glossary** button at the top defines every
component used in the course in plain words, and links to the lesson that covers it.
You can open it in the middle of an exercise.

There's also a built-in terminal, which you open with the **Terminal** button at the
top. It's a real terminal on your machine, so you can either click **Run** on a
lesson's command to send it there, or type commands yourself. Working in your own separate terminal instead works too —
validation looks at the cluster, not at what you typed.

### About the capstone (lesson 16)

The final project deploys a genuine **PagerDuty Runbook Automation** runner, using
everything from the course. To do it you'll need access to a Runbook Automation
instance, so you can create a runner and get its Server URL, Client ID and Token from
the Runner Management page. If you don't manage one yourself, ask whoever does.

Heads-up for Apple Silicon Macs (M1 and later): the runner image is currently built
for Intel only, so it won't start on your `arm64` cluster. The lesson explains this if
you hit it, and you can point it at a newer image once one is published.

---

## For developers

Two workspaces, run together by the root `npm run dev` (which is what `start.sh`
calls):

- `server/` — Express API and the validation engine. Runs `kubectl` against the
  `rancher-desktop` context to check whether each step's task was actually done, and
  hosts a WebSocket bridge (`node-pty`) backing the in-browser terminal. Listens on
  `:4000`.
- `web/` — React + Vite + Tailwind frontend. Listens on `:5173` and proxies `/api`
  and `/pty` to the server.

To skip the preflight checks: `npm install --prefix server && npm install --prefix web
&& npm run dev`.

**Lessons** are TypeScript modules in `server/src/lessons/*.ts`, one per lesson,
registered in `index.ts`. Each has an `intro`, a `focus` naming the region of the
cluster diagram to highlight, and a list of steps — `task` (run a command), `quiz`,
`manifest` (edit YAML in the drawer and apply it), or `exam` (a set of questions
graded together, used for the final). Quiz and exam answers, explanations and
validator functions are all stripped server-side before a lesson reaches the browser.

Every exam question names the lesson that teaches it, and the results link there, so
a wrong answer always has somewhere to go and read. Nothing is asked that the course
doesn't state.

**Validation** is a small `check()` per step that runs real `kubectl get`-style
queries against the `k8s-academy` namespace and inspects the JSON — e.g. "does the
`web` Deployment have `readyReplicas == 4`?". There is no simulated state anywhere.

**Configuration** via environment variables: `KUBE_CONTEXT`, `TRAINING_NAMESPACE` and
`RUNNER_IMAGE` (all in `server/src/kube.ts`), plus `PORT` in `server/src/index.ts`.
