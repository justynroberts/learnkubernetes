import type { Lesson } from "./types.js";
import { intro } from "./01-intro.js";
import { namespaces } from "./02-namespaces.js";
import { pods } from "./03-pods.js";
import { labels } from "./04-labels.js";
import { deployments } from "./05-deployments.js";
import { scaling } from "./06-scaling.js";
import { services } from "./07-services.js";
import { configmaps } from "./08-configmaps.js";
import { secrets } from "./09-secrets.js";
import { probes } from "./10-probes.js";
import { rollouts } from "./11-rollouts.js";
import { volumes } from "./12-volumes.js";
import { jobs } from "./13-jobs.js";
import { troubleshooting } from "./14-troubleshooting.js";
import { runbookAutomation } from "./15-runbook-automation.js";
import { recap } from "./16-recap.js";

export const LESSONS: Lesson[] = [
  intro,
  namespaces,
  pods,
  labels,
  deployments,
  scaling,
  services,
  configmaps,
  secrets,
  probes,
  rollouts,
  volumes,
  jobs,
  troubleshooting,
  runbookAutomation,
  recap,
].sort((a, b) => a.order - b.order);

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function findStep(lessonId: string, stepId: string) {
  const lesson = findLesson(lessonId);
  const step = lesson?.steps.find((s) => s.id === stepId);
  return { lesson, step };
}

export * from "./types.js";
