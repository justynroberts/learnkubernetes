import clsx from "clsx";
import type { ManifestStepDetail } from "../types";

interface Props {
  index: number;
  step: ManifestStepDetail;
  done: boolean;
  onOpenEditor: () => void;
}

export function ManifestCard({ index, step, done, onOpenEditor }: Props) {
  const preview = step.template.split("\n").slice(0, 4).join("\n");

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

          <button
            onClick={onOpenEditor}
            className="mt-3 block w-full overflow-hidden rounded-lg border border-slate-700/70 bg-[#0d1017] text-left transition-colors hover:border-pd-green/50"
          >
            <pre className="overflow-hidden px-3 py-2 font-mono text-[12px] leading-relaxed text-slate-500">
              {preview}
              {"\n…"}
            </pre>
            <div className="border-t border-slate-800 bg-pd-green/5 px-3 py-2 text-xs font-medium text-pd-green-light">
              {done ? "Applied — open to view or edit →" : "Open in YAML Editor →"}
            </div>
          </button>

          {step.hint && !done && <p className="mt-2 text-sm text-slate-500">💡 {step.hint}</p>}
        </div>
      </div>
    </div>
  );
}
