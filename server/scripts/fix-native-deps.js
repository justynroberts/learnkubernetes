// node-pty ships prebuilt native binaries under prebuilds/<platform>-<arch>/.
// npm has been observed to strip the executable bit off `spawn-helper` when
// installing from some registries/caches, which makes the embedded terminal
// crash the whole server the first time anyone opens it (posix_spawnp
// failed). This makes that failure mode impossible instead of undiscoverable.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prebuildsDir = path.join(__dirname, "..", "node_modules", "node-pty", "prebuilds");

if (!fs.existsSync(prebuildsDir)) process.exit(0);

for (const platformArch of fs.readdirSync(prebuildsDir)) {
  const helperPath = path.join(prebuildsDir, platformArch, "spawn-helper");
  if (fs.existsSync(helperPath)) {
    fs.chmodSync(helperPath, 0o755);
  }
}
