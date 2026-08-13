import clsx from "clsx";
import { motion } from "framer-motion";
import type { LessonSummary } from "../types";

interface Props {
  lessons: LessonSummary[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  progressFor: (lessonId: string, total: number) => { done: number; total: number; complete: boolean };
  stepCounts: Record<string, number>;
  /** Collapsed to a numbered rail, so the lesson itself gets the screen. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  lessons,
  activeId,
  onSelect,
  progressFor,
  stepCounts,
  collapsed,
  onToggleCollapsed,
}: Props) {
  return (
    <nav
      data-tour="sidebar"
      className="flex h-full flex-col overflow-hidden border-r border-slate-800"
      style={{ background: "var(--color-panel)" }}
    >
      <div
        className={clsx(
          "flex shrink-0 items-center border-b border-slate-800/70 px-2 py-2",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <span className="pl-2 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
            Lessons
          </span>
        )}
        <button
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand the lesson list" : "Collapse the lesson list"}
          title={collapsed ? "Expand the lesson list" : "Collapse the lesson list to focus"}
          className="btn-pop flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 hover:text-pd-green-light"
        >
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden
          >
            <polyline
              points="7.5,2.5 4,6 7.5,9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {lessons.map((lesson) => {
          const total = stepCounts[lesson.id] ?? 0;
          const { done, complete } = progressFor(lesson.id, total);
          const active = lesson.id === activeId;
          return (
            <motion.button
              key={lesson.id}
              onClick={() => onSelect(lesson.id)}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
              title={collapsed ? `${lesson.order}. ${lesson.title}` : undefined}
              className={clsx(
                "relative flex w-full items-center gap-3 py-2.5 text-left text-sm transition-colors",
                collapsed ? "justify-center px-0" : "px-4",
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
              {!collapsed && (
                <>
                  <span className="relative min-w-0 flex-1 truncate">{lesson.title}</span>
                  {total > 0 && !complete && (
                    <span className="relative shrink-0 text-[11px] text-slate-600">
                      {done}/{total}
                    </span>
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
