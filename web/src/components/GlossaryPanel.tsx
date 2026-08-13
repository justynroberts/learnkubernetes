import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { GLOSSARY, type GlossaryEntry } from "../lib/glossary";

/**
 * A reference drawer, openable from any lesson — the point of a glossary is
 * that you reach for it mid-task, so it deliberately isn't a lesson you have
 * to navigate away to.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  /** Jump to the lesson that teaches a term. */
  onGoToLesson: (order: number) => void;
}

function matches(entry: GlossaryEntry, q: string): boolean {
  const hay = `${entry.term} ${entry.what} ${entry.detail} ${entry.command ?? ""}`.toLowerCase();
  return hay.includes(q);
}

export function GlossaryPanel({ open, onClose, onGoToLesson }: Props) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.map((g) => ({ ...g, entries: g.entries.filter((e) => matches(e, q)) })).filter(
      (g) => g.entries.length > 0,
    );
  }, [query]);

  const total = useMemo(() => GLOSSARY.reduce((n, g) => n + g.entries.length, 0), []);
  const shown = groups.reduce((n, g) => n + g.entries.length, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <motion.div
            data-tour="glossary"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-[520px] max-w-[92vw] flex-col border-l border-slate-800"
            style={{ background: "var(--color-panel)" }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 px-4">
              <div className="min-w-0">
                <div className="font-semibold text-slate-100">Glossary</div>
                <div className="truncate text-xs text-slate-500">
                  Every component in the course, in plain words
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close the glossary"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="shrink-0 border-b border-slate-800 px-4 py-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search — try “probe”, “selector”, “etcd”…"
                className="w-full rounded-lg border border-slate-700/70 bg-[#0d1017] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-pd-green/60 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  {query ? `${shown} of ${total} terms` : `${total} terms`}
                </span>
                {query && (
                  <button onClick={() => setQuery("")} className="hover:text-slate-400">
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {groups.length === 0 && (
                <p className="text-sm text-slate-500">
                  Nothing matches “{query}”. Try a shorter word.
                </p>
              )}

              {groups.map((group) => (
                <section key={group.id} className="mb-7 last:mb-2">
                  <h3 className="text-[11px] font-semibold tracking-widest text-pd-green uppercase">
                    {group.title}
                  </h3>
                  <p className="mt-0.5 mb-3 text-xs text-slate-600">{group.blurb}</p>

                  <div className="space-y-2.5">
                    {group.entries.map((entry) => (
                      <article
                        key={entry.term}
                        className="rounded-lg border border-slate-700/60 px-3.5 py-3"
                        style={{ background: "var(--color-panel-2)" }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="font-semibold text-slate-100">{entry.term}</h4>
                          {entry.lesson !== undefined && (
                            <button
                              onClick={() => {
                                onGoToLesson(entry.lesson!);
                                onClose();
                              }}
                              className="shrink-0 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-500 transition-colors hover:border-pd-green/50 hover:text-pd-green-light"
                              title={`Go to lesson ${entry.lesson}`}
                            >
                              Lesson {entry.lesson} →
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] leading-snug text-slate-300">{entry.what}</p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{entry.detail}</p>
                        {entry.command && (
                          <code
                            className={clsx(
                              "mt-2 block overflow-x-auto rounded-md border border-slate-800 bg-[#0d1017]",
                              "px-2.5 py-1.5 font-mono text-[12px] whitespace-pre text-pd-green-light",
                            )}
                          >
                            {entry.command}
                          </code>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
