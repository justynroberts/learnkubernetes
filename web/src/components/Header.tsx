import clsx from "clsx";
import type { ClusterStatus } from "../types";

interface Props {
  status: ClusterStatus | null;
  percent: number;
  terminalCollapsed: boolean;
  onToggleTerminal: () => void;
  manifestEditorOpen: boolean;
  onToggleManifestEditor: () => void;
  glossaryOpen: boolean;
  onToggleGlossary: () => void;
  onOpenTour: () => void;
  onReset: () => void;
}

export function Header({
  status,
  percent,
  terminalCollapsed,
  onToggleTerminal,
  manifestEditorOpen,
  onToggleManifestEditor,
  glossaryOpen,
  onToggleGlossary,
  onOpenTour,
  onReset,
}: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-panel px-5" style={{ background: "var(--color-panel)" }}>
      <div data-tour="brand" className="flex items-center gap-2.5">
        <svg width="24" height="24" viewBox="0 0 32 32" className="float-slow text-pd-green">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
          <polyline
            points="6,17 11,17 13,11 17,22 20,17 26,17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-semibold text-slate-100">
          PagerDuty <span className="font-normal text-slate-400">Kubernetes Academy</span>
        </span>
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
              className="progress-shimmer h-full rounded-full bg-gradient-to-r from-pd-green to-emerald-400 transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="w-10 text-xs text-slate-400">{percent}%</span>
        </div>

        <button
          data-tour="terminal-toggle"
          onClick={onToggleTerminal}
          className={clsx(
            "btn-pop flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
            terminalCollapsed
              ? "border-slate-700 text-slate-400 hover:border-pd-green/50 hover:text-pd-green-light"
              : "border-pd-green/50 bg-pd-green/10 text-pd-green-light",
          )}
          title="Toggle the embedded terminal"
        >
          <span aria-hidden>{"⌨"}</span> Terminal
        </button>

        <button
          data-tour="manifest-editor-toggle"
          onClick={onToggleManifestEditor}
          className={clsx(
            "btn-pop flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
            !manifestEditorOpen
              ? "border-slate-700 text-slate-400 hover:border-pd-green/50 hover:text-pd-green-light"
              : "border-pd-green/50 bg-pd-green/10 text-pd-green-light",
          )}
          title="Open the YAML editor to create or edit any manifest"
        >
          <span aria-hidden>{"{ }"}</span> YAML Editor
        </button>

        <button
          data-tour="glossary-toggle"
          onClick={onToggleGlossary}
          className={clsx(
            "btn-pop flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
            !glossaryOpen
              ? "border-slate-700 text-slate-400 hover:border-pd-green/50 hover:text-pd-green-light"
              : "border-pd-green/50 bg-pd-green/10 text-pd-green-light",
          )}
          title="Look up any Kubernetes term used in the course"
        >
          <span aria-hidden>📖</span> Glossary
        </button>

        <button
          data-tour="help"
          onClick={onOpenTour}
          className="btn-pop flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-xs text-slate-400 hover:border-pd-green/50 hover:text-pd-green-light"
          title="Replay the guided tour"
        >
          ?
        </button>

        <button
          data-tour="reset"
          onClick={onReset}
          className="btn-pop rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:border-rose-500/50 hover:text-rose-300"
          title="Delete and recreate the k8s-academy namespace, and clear local progress"
        >
          Reset course
        </button>
      </div>
    </header>
  );
}
