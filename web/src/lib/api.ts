import type { CheckResult, ClusterStatus, LessonDetail, LessonSummary } from "../types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  status: () => fetch("/api/status").then((r) => json<ClusterStatus>(r)),
  lessons: () => fetch("/api/lessons").then((r) => json<LessonSummary[]>(r)),
  lesson: (id: string) => fetch(`/api/lessons/${id}`).then((r) => json<LessonDetail>(r)),
  validate: (lessonId: string, stepId: string) =>
    fetch(`/api/lessons/${lessonId}/steps/${stepId}/validate`, { method: "POST" }).then((r) =>
      json<CheckResult>(r),
    ),
  answer: (lessonId: string, stepId: string, selectedIndex: number) =>
    fetch(`/api/lessons/${lessonId}/steps/${stepId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedIndex }),
    }).then((r) => json<CheckResult>(r)),
  reset: () => fetch("/api/reset", { method: "POST" }).then((r) => json<{ ok: boolean }>(r)),
};
