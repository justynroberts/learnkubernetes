import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { ExamResult, ExamStepDetail } from "../types";
import { api } from "../lib/api";

/**
 * The final exam: one question on screen at a time, no feedback until you
 * submit the lot. Deliberately unlike QuizCard, which grades each answer
 * instantly — the point here is a score across the whole course.
 */

interface Props {
  lessonId: string;
  step: ExamStepDetail;
  done: boolean;
  onDone: (pass: boolean) => void;
}

export function ExamCard({ lessonId, step, done, onDone }: Props) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  const total = step.questions.length;
  const needed = Math.ceil(total * step.passMark);
  const question = step.questions[current];
  const answered = Object.keys(answers).length;
  const allAnswered = answered === total;
  const isLast = current === total - 1;

  function choose(index: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: index }));
    if (!isLast) {
      setTimeout(() => setCurrent((c) => Math.min(c + 1, total - 1)), 180);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await api.exam(lessonId, step.id, answers);
      setResult(res);
      onDone(res.pass);
    } finally {
      setSubmitting(false);
    }
  }

  function retake() {
    setResult(null);
    setAnswers({});
    setCurrent(0);
    setStarted(true);
  }

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-xl border transition-colors",
        done || result?.pass ? "border-emerald-500/40" : "border-pd-green/30",
      )}
      style={{ background: "var(--color-panel)" }}
    >
      <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="text-base">
            🎓
          </span>
          <div>
            <div className="text-xs font-semibold tracking-widest text-pd-green uppercase">Final exam</div>
            <div className="text-sm font-semibold text-slate-100">{step.title}</div>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {total} questions · {needed} to pass
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ---- results ---- */}
        {result ? (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className={clsx(
                  "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2",
                  result.pass
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/60 bg-amber-500/10 text-amber-300",
                )}
              >
                <span className="text-lg leading-none font-bold">{result.correct}</span>
                <span className="text-[10px] leading-tight opacity-70">of {result.total}</span>
              </motion.div>
              <div>
                <div
                  className={clsx(
                    "text-lg font-semibold",
                    result.pass ? "text-emerald-300" : "text-amber-300",
                  )}
                >
                  {result.pass ? "Graduated 🎉" : "Not quite yet"}
                </div>
                <div className="text-sm text-slate-400">
                  {result.pass
                    ? "You know your way around a Kubernetes cluster. Nicely done."
                    : `You needed ${result.needed}. Read the notes below and take it again — nothing is held against you.`}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {result.results.map((r, i) => (
                <div
                  key={r.id}
                  className={clsx(
                    "rounded-lg border px-3 py-2.5",
                    r.correct ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-rose-500/30 bg-rose-500/[0.05]",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={clsx("text-sm", r.correct ? "text-emerald-400" : "text-rose-400")}>
                      {r.correct ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-300">
                        <span className="text-slate-500">{i + 1}. </span>
                        {r.prompt}
                      </div>
                      {!r.correct && (
                        <div className="mt-1.5 text-sm text-slate-400">
                          <span className="text-slate-500">Answer: </span>
                          <span className="text-emerald-300">
                            {step.questions[i].options[r.correctIndex]}
                          </span>
                        </div>
                      )}
                      <div className="mt-1 text-[13px] leading-snug text-slate-500">{r.explanation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={retake}
              className="btn-pop mt-4 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-pd-green/50 hover:text-pd-green-light"
            >
              {result.pass ? "Take it again" : "Retake the exam"}
            </button>
          </motion.div>
        ) : !started ? (
          /* ---- start screen ---- */
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5">
            <p className="text-sm text-slate-400">{step.instructions}</p>
            <p className="mt-2 text-sm text-slate-500">
              One question at a time, no feedback until the end. Get {needed} of {total} right to graduate — retake
              it as often as you like.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStarted(true)}
              className="mt-4 rounded-lg bg-pd-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Start the exam →
            </motion.button>
          </motion.div>
        ) : (
          /* ---- one question at a time ---- */
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5">
            <div className="mb-4 flex items-center gap-1.5">
              {step.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(i)}
                  title={`Question ${i + 1}${answers[q.id] !== undefined ? " · answered" : ""}`}
                  className={clsx(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i === current
                      ? "bg-pd-green-light"
                      : answers[q.id] !== undefined
                        ? "bg-pd-green/40"
                        : "bg-slate-700",
                  )}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <div className="text-xs text-slate-500">
                  Question {current + 1} of {total}
                </div>
                <h3 className="mt-1 font-semibold text-slate-100">{question.prompt}</h3>

                <div className="mt-3 space-y-2">
                  {question.options.map((opt, i) => {
                    const picked = answers[question.id] === i;
                    return (
                      <motion.button
                        key={i}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => choose(i)}
                        className={clsx(
                          "block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          picked
                            ? "border-pd-green bg-pd-green/10 text-pd-green-light"
                            : "border-slate-700/70 text-slate-300 hover:border-pd-green/50 hover:bg-pd-green/5",
                        )}
                      >
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="text-sm text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500"
              >
                ← Back
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {answered}/{total} answered
                </span>
                {isLast || allAnswered ? (
                  <motion.button
                    whileHover={allAnswered ? { scale: 1.03 } : undefined}
                    whileTap={allAnswered ? { scale: 0.96 } : undefined}
                    onClick={submit}
                    disabled={!allAnswered || submitting}
                    className="rounded-lg bg-pd-green px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                    title={allAnswered ? "Submit for marking" : "Answer every question first"}
                  >
                    {submitting ? "Marking…" : "Submit exam"}
                  </motion.button>
                ) : (
                  <button
                    onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-pd-green/50 hover:text-pd-green-light"
                  >
                    Skip →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
