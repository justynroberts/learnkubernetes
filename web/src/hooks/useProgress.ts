import { useCallback, useEffect, useState } from "react";

type Progress = Record<string, Record<string, boolean>>;

const STORAGE_KEY = "lk-progress-v1";

function load(): Progress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const markStep = useCallback((lessonId: string, stepId: string, done: boolean) => {
    setProgress((prev) => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], [stepId]: done },
    }));
  }, []);

  const isStepDone = useCallback(
    (lessonId: string, stepId: string) => !!progress[lessonId]?.[stepId],
    [progress],
  );

  const lessonProgress = useCallback(
    (lessonId: string, totalSteps: number) => {
      const done = Object.values(progress[lessonId] ?? {}).filter(Boolean).length;
      return { done, total: totalSteps, complete: totalSteps > 0 && done === totalSteps };
    },
    [progress],
  );

  const reset = useCallback(() => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { progress, markStep, isStepDone, lessonProgress, reset };
}
