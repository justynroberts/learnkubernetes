import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import CodeMirror from "@uiw/react-codemirror";
import { yaml as yamlLang } from "@codemirror/lang-yaml";
import { githubDark } from "@uiw/codemirror-theme-github";
import type { CheckResult, ManifestStepDetail } from "../types";
import { api } from "../lib/api";

interface Props {
  lessonId: string;
  index: number;
  step: ManifestStepDetail;
  done: boolean;
  onDone: (pass: boolean) => void;
}

export function ManifestCard({ lessonId, index, step, done, onDone }: Props) {
  const [yaml, setYaml] = useState(step.template);
  const [showHint, setShowHint] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function apply() {
    setApplying(true);
    try {
      const res = await api.apply(lessonId, step.id, yaml);
      setResult(res);
      onDone(res.pass);
    } catch {
      setResult({ pass: false, message: "Couldn't reach the training server." });
    } finally {
      setApplying(false);
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
            done ? "bg-emerald-500 text-slate-900" : "bg-slate-700 text-slate-300",
          )}
        >
          {done ? "✓" : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-100">{step.title}</h3>
          <p className="prose-lesson mt-1 text-sm">{step.instructions}</p>

          <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/70 focus-within:border-pd-green/60">
            <CodeMirror
              value={yaml}
              onChange={setYaml}
              theme={githubDark}
              extensions={[yamlLang()]}
              height="280px"
              basicSetup={{ foldGutter: true, highlightActiveLine: true }}
              style={{ fontSize: 13, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={apply}
              disabled={applying}
              className="rounded-lg bg-pd-green px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {applying ? "Applying…" : "Apply"}
            </motion.button>
            <button
              onClick={() => setYaml(step.template)}
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Reset to template
            </button>
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
            {result?.applyOutput && (
              <motion.pre
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 max-h-32 overflow-auto rounded-md bg-[#0d1017] px-3 py-2 font-mono text-[12px] text-slate-400"
              >
                {result.applyOutput}
              </motion.pre>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && (
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
    </div>
  );
}
