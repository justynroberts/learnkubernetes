import type { Lesson } from "./types.js";
import { intro } from "./01-intro.js";
import { coreConcepts } from "./02-core-concepts.js";
import { namespaces } from "./03-namespaces.js";
import { pods } from "./04-pods.js";
import { labels } from "./05-labels.js";
import { deployments } from "./06-deployments.js";
import { scaling } from "./07-scaling.js";
import { services } from "./08-services.js";
import { ingress } from "./09-ingress.js";
import { configmaps } from "./10-configmaps.js";
import { secrets } from "./11-secrets.js";
import { probes } from "./12-probes.js";
import { rollouts } from "./13-rollouts.js";
import { volumes } from "./14-volumes.js";
import { jobs } from "./15-jobs.js";
import { troubleshooting } from "./16-troubleshooting.js";
import { runbookAutomation } from "./17-runbook-automation.js";
import { recap } from "./18-recap.js";

export const LESSONS: Lesson[] = [
  intro,
  coreConcepts,
  namespaces,
  pods,
  labels,
  deployments,
  scaling,
  services,
  ingress,
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
