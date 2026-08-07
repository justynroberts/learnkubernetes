import clsx from "clsx";
import { motion } from "framer-motion";
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
          <motion.button
            key={lesson.id}
            onClick={() => onSelect(lesson.id)}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              "relative flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
              active ? "text-pd-green-light" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active-pill"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-pd-green/10"
              />
            )}
            <span
              className={clsx(
                "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                complete
                  ? "bg-emerald-500 text-slate-900"
                  : active
                    ? "bg-pd-green/20 text-pd-green-light"
                    : "bg-slate-800 text-slate-500",
              )}
            >
              {complete ? "✓" : lesson.order}
            </span>
            <span className="relative min-w-0 flex-1 truncate">{lesson.title}</span>
            {total > 0 && !complete && (
              <span className="relative shrink-0 text-[11px] text-slate-600">
                {done}/{total}
              </span>
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
