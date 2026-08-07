import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { CheckResult, TaskStepDetail } from "../types";
import { api } from "../lib/api";

interface Props {
  lessonId: string;
  index: number;
  step: TaskStepDetail;
  done: boolean;
  onDone: (pass: boolean) => void;
  onRunInTerminal: (command: string) => void;
}

export function StepCard({ lessonId, index, step, done, onDone, onRunInTerminal }: Props) {
  const [showHint, setShowHint] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(done ? { pass: true, message: "" } : null);
  const [copied, setCopied] = useState(false);

  async function validate() {
    setValidating(true);
    try {
      const res = await api.validate(lessonId, step.id);
      setResult(res);
      onDone(res.pass);
    } catch {
      setResult({ pass: false, message: "Couldn't reach the training server." });
    } finally {
      setValidating(false);
    }
  }

  function copy() {
    if (!step.command) return;
    navigator.clipboard.writeText(step.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={clsx(
        "rounded-xl border p-5 transition-colors",
        done ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-slate-700/60 bg-panel",
      )}
      style={{ background: done ? undefined : "var(--color-panel)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            done ? "bg-emerald-500 text-slate-900" : "bg-slate-700 text-slate-300",
          )}
        >
          {done ? "✓" : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-100">{step.title}</h3>
          <p className="prose-lesson mt-1 text-sm">{step.instructions}</p>

          {step.command && (
            <div className="mt-3 flex items-stretch overflow-hidden rounded-lg border border-slate-700/70 bg-[#0d1017]">
              <code className="flex-1 overflow-x-auto px-3 py-2 font-mono text-[13px] text-pd-green-light whitespace-pre">
                {step.command}
              </code>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => onRunInTerminal(step.command!)}
                className="border-l border-slate-700/70 px-3 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                title="Send to terminal"
              >
                Run ▶
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={copy}
                className="border-l border-slate-700/70 px-3 text-xs font-medium text-slate-400 hover:bg-slate-700/30"
                title="Copy"
              >
                {copied ? "Copied" : "Copy"}
              </motion.button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={validate}
              disabled={validating}
              className="rounded-lg bg-pd-green px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {validating ? "Checking…" : "Validate"}
            </motion.button>
            {step.hint && (
              <button
                onClick={() => setShowHint((v) => !v)}
                className="text-sm text-slate-500 hover:text-slate-300"
              >
                {showHint ? "Hide hint" : "Need a hint?"}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showHint && step.hint && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
              >
                💡 {step.hint}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && result.message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={clsx(
                  "mt-3 rounded-md px-3 py-2 text-sm",
                  result.pass ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300",
                )}
              >
                {result.pass ? "✅ " : "❌ "}
                {result.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
