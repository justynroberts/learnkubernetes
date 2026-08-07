import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

export interface TourStep {
  selector: string;
  title: string;
  body: string;
}

interface Props {
  steps: TourStep[];
  onFinish: () => void;
}

const TOOLTIP_WIDTH = 300;

export function Tour({ steps, onFinish }: Props) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[i];

  useEffect(() => {
    function update() {
      const el = document.querySelector(step.selector);
      setRect(el ? el.getBoundingClientRect() : null);
    }
    update();
    window.addEventListener("resize", update);
    const raf = requestAnimationFrame(update);
    return () => {
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, [step.selector]);

  const isLast = i === steps.length - 1;
  const pad = 8;

  let tooltipStyle: { top: number; left: number } = { top: 80, left: 80 };
  let highlightStyle: { top: number; left: number; width: number; height: number } | null = null;

  if (rect) {
    highlightStyle = {
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    };

    const left = Math.max(16, Math.min(rect.left, window.innerWidth - TOOLTIP_WIDTH - 16));
    if (rect.height > 200) {
      // Tall element (e.g. the sidebar) — place the tooltip beside it.
      tooltipStyle = {
        top: Math.max(16, Math.min(rect.top + 24, window.innerHeight - 200)),
        left: Math.min(rect.right + 16, window.innerWidth - TOOLTIP_WIDTH - 16),
      };
    } else {
      const spaceBelow = window.innerHeight - rect.bottom;
      tooltipStyle = {
        top: spaceBelow > 200 ? rect.bottom + 14 : rect.top - 14 - 160,
        left,
      };
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      {highlightStyle && (
        <motion.div
          initial={false}
          animate={{ ...highlightStyle, opacity: 1 }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          className="pointer-events-none absolute rounded-lg ring-2 ring-pd-green"
          style={{ boxShadow: "0 0 0 9999px rgba(5, 8, 6, 0.78)" }}
        />
      )}

      <motion.div
        initial={false}
        animate={{ ...tooltipStyle, opacity: 1 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
        className="absolute rounded-xl border border-pd-green/40 p-4 shadow-2xl"
        style={{ width: TOOLTIP_WIDTH, background: "var(--color-panel-2)" }}
      >
        <div className="mb-1 text-xs font-semibold tracking-widest text-pd-green uppercase">
          {i + 1} / {steps.length}
        </div>
        <h4 className="mb-1.5 font-semibold text-slate-100">{step.title}</h4>
        <p className="text-sm text-slate-400">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={onFinish} className="text-xs text-slate-500 hover:text-slate-300">
            Skip
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button
                onClick={() => setI((n) => n - 1)}
                className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onFinish() : setI((n) => n + 1))}
              className="rounded-md bg-pd-green px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
