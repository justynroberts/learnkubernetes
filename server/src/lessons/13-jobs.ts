import type { Lesson } from "./types.js";
import { NAMESPACE, getResourceJson } from "../kube.js";

export const jobs: Lesson = {
  id: "jobs",
  order: 13,
  title: "Jobs & CronJobs",
  concept: "Jobs and CronJobs",
  intro: `
Not everything is a long-running server. A **Job** runs a Pod to completion —
perfect for a batch task, a migration, a one-off script — and tracks success rather
than restarting forever. A **CronJob** is a Job that runs on a repeating schedule,
using the same syntax as Unix cron.
`,
  steps: [
    {
      kind: "task",
      id: "run-job",
      title: "Run a Job to completion",
      instructions: `Create a Job that runs a single command and exits.`,
      command: `kubectl create job hello-job --image=busybox -n ${NAMESPACE} -- echo "hello from a Job"`,
      hint: "Jobs take a moment to pull the image, run, and report success.",
      check: async () => {
        const job = await getResourceJson<any>("job", "hello-job");
        if (!job) return { pass: false, message: `Job "hello-job" not found.` };
        if ((job.status?.succeeded ?? 0) < 1) {
          return { pass: false, message: `Job "hello-job" hasn't reported success yet. Give it a moment.` };
        }
        return { pass: true, message: `Job "hello-job" completed successfully.` };
      },
    },
    {
      kind: "task",
      id: "create-cronjob",
      title: "Schedule a CronJob",
      instructions: `Create a CronJob that runs the same kind of task every minute.`,
      command: `kubectl create cronjob hello-cron --image=busybox --schedule="*/1 * * * *" -n ${NAMESPACE} -- echo "hello from a CronJob"`,
      check: async () => {
        const cron = await getResourceJson<any>("cronjob", "hello-cron");
        if (!cron) return { pass: false, message: `CronJob "hello-cron" not found.` };
        if (!cron.spec?.schedule) return { pass: false, message: `CronJob "hello-cron" has no schedule set.` };
        return { pass: true, message: `CronJob "hello-cron" is scheduled: "${cron.spec.schedule}".` };
      },
    },
    {
      kind: "quiz",
      id: "quiz-jobs",
      title: "Quick check",
      instructions: "What's the key difference between a Job and a Deployment?",
      options: [
        "Jobs run to completion and track success; Deployments keep Pods running indefinitely",
        "Jobs can only ever run on a schedule",
        "Deployments cannot run more than one Pod",
        "There is no real difference between them",
      ],
      correctIndex: 0,
      explanation:
        "A Deployment's whole purpose is to keep N Pods running forever. A Job's purpose is the opposite — run until the task finishes, then stop.",
    },
  ],
};
