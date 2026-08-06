export interface CheckResult {
  pass: boolean;
  message: string;
}

export interface Step {
  id: string;
  title: string;
  /** Markdown instructions shown to the learner. */
  instructions: string;
  /** A ready-to-copy command snippet shown alongside the instructions. */
  command?: string;
  hint?: string;
  check: () => Promise<CheckResult>;
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  concept: string;
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

export interface LessonDetail {
  id: string;
  order: number;
  title: string;
  concept: string;
  intro: string;
  steps: Omit<Step, "check">[];
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
    intro: l.intro,
    steps: l.steps.map(({ check, ...rest }) => rest),
  };
}
