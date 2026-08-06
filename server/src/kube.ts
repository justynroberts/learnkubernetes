import { execFile } from "node:child_process";

export const KUBE_CONTEXT = process.env.KUBE_CONTEXT ?? "rancher-desktop";
export const NAMESPACE = process.env.TRAINING_NAMESPACE ?? "k8s-academy";

export interface KubectlResult {
  stdout: string;
  stderr: string;
  code: number;
}

/** Runs kubectl with an explicit arg array (no shell) against the training context. */
export function kubectl(args: string[], opts: { timeoutMs?: number } = {}): Promise<KubectlResult> {
  return new Promise((resolve) => {
    execFile(
      "kubectl",
      ["--context", KUBE_CONTEXT, ...args],
      { timeout: opts.timeoutMs ?? 8000 },
      (error, stdout, stderr) => {
        const code = error && "code" in error && typeof error.code === "number" ? error.code : error ? 1 : 0;
        resolve({ stdout: stdout.toString(), stderr: stderr.toString(), code });
      },
    );
  });
}

/** Runs `kubectl get <kind> <name> -o json` and returns the parsed object, or null if not found. */
export async function getResourceJson<T = any>(
  kind: string,
  name: string,
  namespace: string = NAMESPACE,
): Promise<T | null> {
  const { stdout, code } = await kubectl(["get", kind, name, "-n", namespace, "-o", "json"]);
  if (code !== 0) return null;
  try {
    return JSON.parse(stdout) as T;
  } catch {
    return null;
  }
}

/** Runs `kubectl get <kind> -o json` (list) and returns the `.items` array, or []. */
export async function listResourcesJson<T = any>(
  kind: string,
  namespace: string = NAMESPACE,
): Promise<T[]> {
  const { stdout, code } = await kubectl(["get", kind, "-n", namespace, "-o", "json"]);
  if (code !== 0) return [];
  try {
    return (JSON.parse(stdout).items ?? []) as T[];
  } catch {
    return [];
  }
}

/** Runs `kubectl get <kind> -A -o json` (cluster-wide) and returns the `.items` array, or []. */
export async function listAllNamespacesJson<T = any>(kind: string): Promise<T[]> {
  const { stdout, code } = await kubectl(["get", kind, "-A", "-o", "json"]);
  if (code !== 0) return [];
  try {
    return (JSON.parse(stdout).items ?? []) as T[];
  } catch {
    return [];
  }
}

export async function namespaceExists(name: string = NAMESPACE): Promise<boolean> {
  const { code } = await kubectl(["get", "namespace", name]);
  return code === 0;
}

export async function ensureNamespace(name: string = NAMESPACE): Promise<void> {
  if (!(await namespaceExists(name))) {
    await kubectl(["create", "namespace", name]);
  }
}

/**
 * Points the shared kubeconfig's current context/namespace at the training
 * cluster once, up front — rather than injecting `kubectl config` keystrokes
 * into each new terminal session, which races with the user's shell startup
 * (rc files, prompt banners, etc).
 */
export async function ensureKubeContext(): Promise<void> {
  await kubectl(["config", "use-context", KUBE_CONTEXT]);
  await kubectl(["config", "set-context", "--current", "--namespace", NAMESPACE]);
}

export async function clusterReachable(): Promise<boolean> {
  const { code } = await kubectl(["get", "--raw", "/livez"]);
  return code === 0;
}

export async function currentNodeInfo(): Promise<{ name: string; version: string }[]> {
  const items = await kubectl(["get", "nodes", "-o", "json"]);
  if (items.code !== 0) return [];
  try {
    const parsed = JSON.parse(items.stdout);
    return (parsed.items ?? []).map((n: any) => ({
      name: n.metadata?.name,
      version: n.status?.nodeInfo?.kubeletVersion,
    }));
  } catch {
    return [];
  }
}

/** Deletes and recreates the training namespace, wiping all lesson resources. */
export async function resetNamespace(name: string = NAMESPACE): Promise<void> {
  await kubectl(["delete", "namespace", name, "--ignore-not-found", "--wait=true", "--timeout=60s"]);
  await kubectl(["create", "namespace", name]);
}
