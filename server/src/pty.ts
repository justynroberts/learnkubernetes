import type { WebSocket } from "ws";
import * as pty from "node-pty";
import { NAMESPACE } from "./kube.js";

const shell = process.platform === "win32" ? "powershell.exe" : process.env.SHELL || "/bin/zsh";

export function attachPty(ws: WebSocket) {
  // The kubeconfig's current-context/namespace is pointed at the training
  // cluster once at server startup (see kube.ts#ensureKubeContext), so bare
  // `kubectl` commands here just work without racing the shell's own startup.
  const term = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 100,
    rows: 30,
    cwd: process.env.HOME,
    env: {
      ...process.env,
      TRAINING_NAMESPACE: NAMESPACE,
    },
  });

  term.onData((data) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "data", data }));
  });

  term.onExit(() => {
    if (ws.readyState === ws.OPEN) ws.close();
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "data") term.write(msg.data);
      else if (msg.type === "resize") term.resize(msg.cols, msg.rows);
    } catch {
      // ignore malformed frames
    }
  });

  ws.on("close", () => term.kill());
}
