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

export type StepDetail = TaskStepDetail | QuizStepDetail;

export interface LessonDetail {
  id: string;
  order: number;
  title: string;
  concept: string;
  intro: string;
  steps: StepDetail[];
}

export interface CheckResult {
  pass: boolean;
  message: string;
}

export interface ClusterStatus {
  reachable: boolean;
  context: string;
  namespace: string;
  nodes: { name: string; version: string }[];
}
