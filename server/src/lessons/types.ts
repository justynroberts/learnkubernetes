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
  | "ingress"
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

export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Lesson number where this is taught, so a wrong answer can point somewhere. */
  lesson: number;
}

/**
 * A set of questions answered together and graded in one go, rather than the
 * one-question-at-a-time QuizStep. Used for the final exam, where the point is
 * a score across the whole course rather than instant feedback per question.
 */
export interface ExamStep {
  kind: "exam";
  id: string;
  title: string;
  instructions: string;
  /** Fraction of questions that must be right to pass, 0–1. */
  passMark: number;
  questions: ExamQuestion[];
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

export type Step = TaskStep | QuizStep | ManifestStep | ExamStep;

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
export type ExamQuestionDetail = Omit<ExamQuestion, "correctIndex" | "explanation" | "lesson">;
export type ExamStepDetail = Omit<ExamStep, "questions"> & { questions: ExamQuestionDetail[] };
export type StepDetail = TaskStepDetail | QuizStepDetail | ManifestStepDetail | ExamStepDetail;

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
      if (step.kind === "exam") {
        return {
          ...step,
          questions: step.questions.map(({ correctIndex, explanation, lesson, ...q }) => q),
        };
      }
      const { check, ...rest } = step;
      return rest;
    }),
  };
}
