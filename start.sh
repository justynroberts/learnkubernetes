#!/usr/bin/env bash
# One-command setup + launch for PagerDuty Kubernetes Academy (101 - Basics).
# Safe to re-run any time — skips steps that are already done.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

fail() {
  echo -e "${RED}✗ $1${RESET}" >&2
  exit 1
}

ok() {
  echo -e "${GREEN}✓ $1${RESET}"
}

echo "PagerDuty Kubernetes Academy (101 - Basics) — setup & launch"
echo "==========================================================="

# --- Prerequisites -----------------------------------------------------

command -v node >/dev/null 2>&1 || fail "Node.js isn't installed. Get it from https://nodejs.org (v20 or newer) and re-run this script."
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node.js v20+ is required (found v$(node -v)). Upgrade Node and re-run this script."
fi
ok "Node.js $(node -v) found"

command -v kubectl >/dev/null 2>&1 || fail "kubectl isn't on your PATH. Install Rancher Desktop (https://rancherdesktop.io), enable Kubernetes, and re-run this script."
ok "kubectl found"

if ! kubectl config get-contexts rancher-desktop >/dev/null 2>&1; then
  fail "No 'rancher-desktop' kubectl context found.
  Make sure Rancher Desktop is installed with Kubernetes enabled (Preferences → Kubernetes → Enable Kubernetes), then re-run this script."
fi
ok "rancher-desktop kubeconfig context found"

if ! kubectl --context rancher-desktop get --raw /livez >/dev/null 2>&1; then
  fail "Found the rancher-desktop context, but the cluster isn't responding.
  Open the Rancher Desktop app and wait for Kubernetes to finish starting (its status icon turns green), then re-run this script."
fi
ok "rancher-desktop cluster is reachable"

# --- Ports ---------------------------------------------------------------

for port in 4000 5173; do
  if lsof -ti:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "Port $port is already in use — is this app already running?
  If so, just open http://localhost:5173 in your browser.
  Otherwise, stop whatever is using port $port and re-run this script."
  fi
done
ok "ports 4000 and 5173 are free"

# --- Install ---------------------------------------------------------------

install_if_needed() {
  local dir="$1"
  if [ ! -d "$dir/node_modules" ]; then
    echo "Installing dependencies in $dir (first run only, may take a minute)..."
    npm install --prefix "$dir"
  fi
}

install_if_needed "."
install_if_needed "server"
install_if_needed "web"
ok "dependencies installed"

# --- Launch ---------------------------------------------------------------

echo ""
echo -e "${YELLOW}Starting the app — this window needs to stay open.${RESET}"
echo "Once it's ready, your browser will open automatically to http://localhost:5173"
echo "Press Ctrl+C here at any time to stop it."
echo ""

(
  for _ in $(seq 1 60); do
    if curl -sf http://localhost:5173 >/dev/null 2>&1; then
      open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null || true
      break
    fi
    sleep 1
  done
) &

exec npm run dev
