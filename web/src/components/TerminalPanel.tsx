import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Terminal, type TerminalHandle } from "./Terminal";

const HEADER_HEIGHT = 28;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 720;
const DEFAULT_HEIGHT = 340;

interface Props {
  terminalRef: React.RefObject<TerminalHandle | null>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function TerminalPanel({ terminalRef, collapsed, onToggleCollapsed }: Props) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const draggingRef = useRef(false);

  const onDragMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current) return;
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, window.innerHeight - e.clientY));
    setHeight(next);
  }, []);

  const onDragEnd = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  }, [onDragMove]);

  const onDragStart = useCallback(() => {
    if (collapsed) return;
    draggingRef.current = true;
    document.body.style.cursor = "row-resize";
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  }, [collapsed, onDragMove, onDragEnd]);

  useEffect(() => () => onDragEnd(), [onDragEnd]);

  return (
    <motion.div
      className="relative shrink-0 border-t border-slate-800 bg-[#0b0e14]"
      animate={{ height: collapsed ? HEADER_HEIGHT : height }}
      transition={{ type: "tween", duration: 0.22, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      {!collapsed && (
        <div
          onMouseDown={onDragStart}
          className="absolute inset-x-0 top-0 z-10 h-1.5 cursor-row-resize hover:bg-pd-green/30"
          title="Drag to resize"
        />
      )}

      <div className="flex h-7 items-center justify-between border-b border-slate-800 px-3">
        <button
          onClick={onToggleCollapsed}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          terminal · your local shell, real cluster
          <span className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>

      <div style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}>
        <Terminal ref={terminalRef} />
      </div>
    </motion.div>
  );
}
