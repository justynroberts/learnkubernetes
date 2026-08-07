import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import CodeMirror from "@uiw/react-codemirror";
import { yaml as yamlLang } from "@codemirror/lang-yaml";
import { githubDark } from "@uiw/codemirror-theme-github";
import { MANIFEST_KINDS, MANIFEST_TEMPLATES } from "../lib/manifestTemplates";
import { api } from "../lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ManifestEditorPanel({ open, onClose }: Props) {
  const [kind, setKind] = useState<string>("Deployment");
  const [yaml, setYaml] = useState(MANIFEST_TEMPLATES.Deployment);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ pass: boolean; stdout: string; stderr: string } | null>(null);

  function loadTemplate(k: string) {
    setKind(k);
    setYaml(MANIFEST_TEMPLATES[k]);
    setResult(null);
  }

  async function apply() {
    setApplying(true);
    try {
      const res = await api.applyRaw(yaml);
      setResult(res);
    } catch {
      setResult({ pass: false, stdout: "", stderr: "Couldn't reach the training server." });
    } finally {
      setApplying(false);
    }
  }

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
            data-tour="manifest-editor"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-[560px] max-w-[90vw] flex-col border-l border-slate-800"
            style={{ background: "var(--color-panel)" }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 px-4">
              <div>
                <div className="font-semibold text-slate-100">YAML Editor</div>
                <div className="text-xs text-slate-500">Apply any manifest to your k8s-academy namespace</div>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-slate-800 px-4 py-3">
              {MANIFEST_KINDS.map((k) => (
                <motion.button
                  key={k}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => loadTemplate(k)}
                  className={clsx(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    kind === k
                      ? "border-pd-green/60 bg-pd-green/15 text-pd-green-light"
                      : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200",
                  )}
                >
                  {k}
                </motion.button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-4">
              <div className="h-full overflow-hidden rounded-lg border border-slate-700/70 focus-within:border-pd-green/60">
                <CodeMirror
                  value={yaml}
                  onChange={setYaml}
                  theme={githubDark}
                  extensions={[yamlLang()]}
                  height="100%"
                  style={{ height: "100%", fontSize: 13, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                  basicSetup={{ foldGutter: true, highlightActiveLine: true }}
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-800 p-4">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={apply}
                disabled={applying}
                className="w-full rounded-lg bg-pd-green px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {applying ? "Applying…" : "Apply to cluster"}
              </motion.button>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div
                      className={clsx(
                        "mb-2 rounded-md px-3 py-2 text-sm",
                        result.pass ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300",
                      )}
                    >
                      {result.pass ? "✅ Applied successfully." : "❌ kubectl apply failed."}
                    </div>
                    <pre className="max-h-32 overflow-auto rounded-md bg-[#0d1017] px-3 py-2 font-mono text-[12px] text-slate-400">
                      {result.pass ? result.stdout : result.stderr}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
