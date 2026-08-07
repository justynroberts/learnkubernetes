import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { CheckResult, QuizStepDetail } from "../types";
import { api } from "../lib/api";

interface Props {
  lessonId: string;
  step: QuizStepDetail;
  done: boolean;
  onDone: (pass: boolean) => void;
}

export function QuizCard({ lessonId, step, done, onDone }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function submit(i: number) {
    if (result?.pass) return;
    setSelected(i);
    setSubmitting(true);
    try {
      const res = await api.answer(lessonId, step.id, i);
      setResult(res);
      onDone(res.pass);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={clsx(
        "rounded-xl border p-5 transition-colors",
        done ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-slate-700/60",
      )}
      style={{ background: done ? undefined : "var(--color-panel)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            done ? "bg-emerald-500 text-slate-900" : "bg-pd-green/20 text-pd-green",
          )}
        >
          {done ? "✓" : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs font-semibold tracking-widest text-pd-green uppercase">Quiz</div>
          <h3 className="font-semibold text-slate-100">{step.instructions}</h3>

          <div className="mt-3 space-y-2">
            {step.options.map((opt, i) => {
              const isSelected = selected === i;
              const showCorrectness = result !== null && isSelected;
              return (
                <motion.button
                  key={i}
                  whileHover={!submitting && !result?.pass ? { x: 3 } : undefined}
                  whileTap={!submitting && !result?.pass ? { scale: 0.98 } : undefined}
                  disabled={submitting || result?.pass}
                  onClick={() => submit(i)}
                  className={clsx(
                    "block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default",
                    showCorrectness && result?.pass && "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
                    showCorrectness && !result?.pass && "border-rose-500/50 bg-rose-500/10 text-rose-300",
                    !showCorrectness && "border-slate-700/70 text-slate-300 hover:border-pd-green/50 hover:bg-pd-green/5",
                  )}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {result && (
              <motion.p
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={result.pass ? { type: "spring", stiffness: 400, damping: 15 } : { duration: 0.2 }}
                className={clsx(
                  "mt-3 rounded-md px-3 py-2 text-sm",
                  result.pass ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300",
                )}
              >
                {result.pass ? "✅ Correct — " : "❌ Not quite — "}
                {result.message}
              </motion.p>
            )}
          </AnimatePresence>

          {!result?.pass && result && (
            <button
              onClick={() => {
                setSelected(null);
                setResult(null);
              }}
              className="mt-2 text-sm text-slate-500 hover:text-slate-300"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
