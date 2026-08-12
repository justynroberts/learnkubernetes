export interface CheckResult {
  pass: boolean;
  message: string;
}

/**
 * Which part of the cluster diagram a lesson is about. The frontend draws one
 * fixed picture of a cluster and lights up the region named here, so a learner
 * always knows *where* the thing they're creating actually lives.
 */
export type ClusterFocus =
  | "all"
  | "control-plane"
  | "namespace"
  | "pod"
  | "labels"
  | "deployment"
  | "replicas"
  | "service"
  | "config"
  | "secret"
  | "probes"
  | "rollout"
  | "volume"
  | "job"
  | "troubleshoot"
  | "external";

export interface TaskStep {
  kind: "task";
  id: string;
  title: string;
  /** Markdown instructions shown to the learner. */
  instructions: string;
  /** A ready-to-copy command snippet shown alongside the instructions. */
  command?: string;
  hint?: string;
  check: () => Promise<CheckResult>;
}

export interface QuizStep {
  kind: "quiz";
  id: string;
  title: string;
  /** The question prompt, markdown. */
  instructions: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ManifestStep {
  kind: "manifest";
  id: string;
  title: string;
  instructions: string;
  /** Default YAML shown in the editor — fully replaceable (e.g. paste one from elsewhere). */
  template: string;
  hint?: string;
  check: () => Promise<CheckResult>;
}

export type Step = TaskStep | QuizStep | ManifestStep;

export interface Lesson {
  id: string;
  order: number;
  title: string;
  concept: string;
  /** Region of the cluster diagram to highlight while this lesson is open. */
  focus: ClusterFocus;
  /** Markdown explaining the concept before the hands-on steps. */
  intro: string;
  steps: Step[];
}

/** Shape sent to the frontend: functions stripped out. */
export interface LessonSummary {
  id: string;
  order: number;
  title: string;
  concept: string;
}

export type TaskStepDetail = Omit<TaskStep, "check">;
export type QuizStepDetail = Omit<QuizStep, "correctIndex" | "explanation">;
export type ManifestStepDetail = Omit<ManifestStep, "check">;
export type StepDetail = TaskStepDetail | QuizStepDetail | ManifestStepDetail;

export interface LessonDetail {
  id: string;
  order: number;
  title: string;
  concept: string;
  focus: ClusterFocus;
  intro: string;
  steps: StepDetail[];
}

export function toSummary(l: Lesson): LessonSummary {
  return { id: l.id, order: l.order, title: l.title, concept: l.concept };
}

export function toDetail(l: Lesson): LessonDetail {
  return {
    id: l.id,
    order: l.order,
    title: l.title,
    concept: l.concept,
    focus: l.focus,
    intro: l.intro,
    steps: l.steps.map((step): StepDetail => {
      if (step.kind === "quiz") {
        const { correctIndex, explanation, ...rest } = step;
        return rest;
      }
      const { check, ...rest } = step;
      return rest;
    }),
  };
}
