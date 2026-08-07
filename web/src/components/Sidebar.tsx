import clsx from "clsx";
import type { LessonSummary } from "../types";

interface Props {
  lessons: LessonSummary[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  progressFor: (lessonId: string, total: number) => { done: number; total: number; complete: boolean };
  stepCounts: Record<string, number>;
}

export function Sidebar({ lessons, activeId, onSelect, progressFor, stepCounts }: Props) {
  return (
    <nav data-tour="sidebar" className="h-full overflow-y-auto border-r border-slate-800 bg-panel/60 py-3" style={{ background: "var(--color-panel)" }}>
      {lessons.map((lesson) => {
        const total = stepCounts[lesson.id] ?? 0;
        const { done, complete } = progressFor(lesson.id, total);
        const active = lesson.id === activeId;
        return (
          <button
            key={lesson.id}
            onClick={() => onSelect(lesson.id)}
            className={clsx(
              "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
              active ? "bg-pd-green/10 text-pd-green-light" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
            )}
          >
            <span
              className={clsx(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                complete
                  ? "bg-emerald-500 text-slate-900"
                  : active
                    ? "bg-pd-green/20 text-pd-green-light"
                    : "bg-slate-800 text-slate-500",
              )}
            >
              {complete ? "✓" : lesson.order}
            </span>
            <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
            {total > 0 && !complete && (
              <span className="shrink-0 text-[11px] text-slate-600">
                {done}/{total}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
