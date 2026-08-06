import clsx from "clsx";
import type { ClusterStatus } from "../types";

interface Props {
  status: ClusterStatus | null;
  percent: number;
  onReset: () => void;
}

export function Header({ status, percent, onReset }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-panel px-5" style={{ background: "var(--color-panel)" }}>
      <div className="flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 32 32" className="text-blue-400">
          <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="5" fill="currentColor" />
        </svg>
        <span className="font-semibold text-slate-100">kubectl academy</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              status?.reachable ? "animate-pulse bg-emerald-400" : "bg-rose-500",
            )}
          />
          {status?.reachable ? (
            <span>
              connected · <span className="text-slate-300">{status.context}</span> ·{" "}
              {status.nodes.length} node{status.nodes.length === 1 ? "" : "s"}
            </span>
          ) : (
            <span>cluster unreachable</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="w-10 text-xs text-slate-400">{percent}%</span>
        </div>

        <button
          onClick={onReset}
          className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:border-rose-500/50 hover:text-rose-300"
          title="Delete and recreate the k8s-academy namespace, and clear local progress"
        >
          Reset course
        </button>
      </div>
    </header>
  );
}
