/** Region of the cluster diagram a lesson is about — mirrors the server's ClusterFocus. */
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

export interface LessonSummary {
  id: string;
  order: number;
  title: string;
  concept: string;
}

export interface TaskStepDetail {
  kind: "task";
  id: string;
  title: string;
  instructions: string;
  command?: string;
  hint?: string;
}

export interface QuizStepDetail {
  kind: "quiz";
  id: string;
  title: string;
  instructions: string;
  options: string[];
}

export interface ManifestStepDetail {
  kind: "manifest";
  id: string;
  title: string;
  instructions: string;
  template: string;
  hint?: string;
}

export interface ExamQuestionDetail {
  id: string;
  prompt: string;
  options: string[];
}

export interface ExamStepDetail {
  kind: "exam";
  id: string;
  title: string;
  instructions: string;
  passMark: number;
  questions: ExamQuestionDetail[];
}

export interface ExamResult {
  pass: boolean;
  correct: number;
  total: number;
  needed: number;
  results: {
    id: string;
    prompt: string;
    selectedIndex: number | null;
    correctIndex: number;
    correct: boolean;
    explanation: string;
    lesson: number;
  }[];
}

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

export interface CheckResult {
  pass: boolean;
  message: string;
  applyOutput?: string;
}

export interface ClusterStatus {
  reachable: boolean;
  context: string;
  namespace: string;
  nodes: { name: string; version: string }[];
}
