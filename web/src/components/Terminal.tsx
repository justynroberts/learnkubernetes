import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export interface TerminalHandle {
  runCommand: (command: string) => void;
}

function connectSocket(): WebSocket {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return new WebSocket(`${proto}://${window.location.host}/pty`);
}

export const Terminal = forwardRef<TerminalHandle>(function Terminal(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const termRef = useRef<XTerm | null>(null);

  useImperativeHandle(ref, () => ({
    runCommand: (command: string) => {
      const ws = socketRef.current;
      const term = termRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !term) return;
      term.focus();
      ws.send(JSON.stringify({ type: "data", data: command + "\r" }));
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    // Guards against React StrictMode's dev-mode double-invoke of effects:
    // if this instance is torn down before its async setup (fonts, layout,
    // socket) settles, every callback below must no-op instead of touching a
    // disposed xterm instance (which throws deep inside its renderer).
    let disposed = false;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: 13,
      theme: {
        background: "#0b0e14",
        foreground: "#d1d5db",
        cursor: "#06ac38",
        selectionBackground: "#334155",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    termRef.current = term;

    const ws = connectSocket();
    socketRef.current = ws;

    // Defer the first fit a frame so the container has a measured layout —
    // fitting synchronously right after `open()` can hand the renderer
    // zero-sized dimensions.
    requestAnimationFrame(() => {
      if (!disposed) fit.fit();
    });

    ws.onmessage = (ev) => {
      if (disposed) return;
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "data") term.write(msg.data);
      } catch {
        // ignore
      }
    };

    term.onData((data) => {
      if (!disposed && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "data", data }));
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (disposed) return;
      fit.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
});
