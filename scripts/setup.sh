#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# ARGON-V Monorepo Setup
# - Cross-platform: macOS/Linux (Windows via Git Bash/WSL)
# - Idempotent: safe to run multiple times
# - Non-destructive: never overwrites existing .env.local
# -----------------------------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/apps/server"

ENV_TEMPLATE="$SERVER_DIR/.env.template"
ENV_FILE="$SERVER_DIR/.env.local"

info()  { printf "\033[1;34m[i]\033[0m %s\n" "$*"; }
ok()    { printf "\033[1;32m[✓]\033[0m %s\n" "$*"; }
warn()  { printf "\033[1;33m[!]\033[0m %s\n" "$*"; }
fail()  { printf "\033[1;31m[x]\033[0m %s\n" "$*"; exit 1; }

need_cmd() { command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"; }

pick_pm() {
  if [ -f "$ROOT_DIR/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then echo "pnpm"; return; fi
  if [ -f "$ROOT_DIR/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then echo "yarn"; return; fi
  if [ -f "$ROOT_DIR/package-lock.json" ]; then echo "npm"; return; fi
  if command -v pnpm >/dev/null 2>&1; then echo "pnpm"; return; fi
  if command -v yarn >/dev/null 2>&1; then echo "yarn"; return; fi
  echo "npm"
}

install_deps() {
  if [ -f "$ROOT_DIR/package.json" ]; then
    local pm
    pm="$(pick_pm)"
    info "Installing dependencies from repo root using: $pm"
    case "$pm" in
      pnpm) (cd "$ROOT_DIR" && pnpm install) ;;
      yarn) (cd "$ROOT_DIR" && yarn install) ;;
      npm)  (cd "$ROOT_DIR" && npm install) ;;
      *) fail "Unsupported package manager: $pm" ;;
    esac
    ok "Dependencies installed (root)"
    return
  fi

  info "No root package.json found; installing dependencies per-app"

  if [ -f "$SERVER_DIR/package.json" ]; then
    info "Installing server deps in: $SERVER_DIR"
    (cd "$SERVER_DIR" && npm install)
    ok "Dependencies installed (server)"
  else
    fail "Missing $SERVER_DIR/package.json"
  fi
}

ensure_env_file() {
  if [ -f "$ENV_FILE" ]; then
    ok "Found existing env file: $ENV_FILE"
    return
  fi

  if [ ! -f "$ENV_TEMPLATE" ]; then
    fail "Missing env template: $ENV_TEMPLATE"
  fi

  info "Creating env file from template:"
  info "  $ENV_TEMPLATE -> $ENV_FILE"
  cp "$ENV_TEMPLATE" "$ENV_FILE"
  ok "Created $ENV_FILE (edit it if you left any required values blank)"
}

# Loads KEY=VALUE from apps/server/.env.local for this script process.
# NOTE: Keep .env.local simple (no bash expressions). This is for local setup only.
load_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    warn "Env file missing: $ENV_FILE (skipping load)"
    return
  fi

  set -a
  # shellcheck disable=SC1090
  source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' || true)
  set +a
}

main() {
  info "ARGON-V setup starting..."
  info "Repo root:  $ROOT_DIR"
  info "Server dir: $SERVER_DIR"

  need_cmd node
  need_cmd npm

  info "Node: $(node -v)"
  info "npm:  $(npm -v)"

  ensure_env_file
  load_env_file
  install_deps

  echo ""
  ok "Setup complete."
  echo ""
  echo "Next steps:"
  echo "  1) Start the server:"
  echo "     cd apps/server && npm run dev"
  echo ""
  echo "  2) Test init endpoint:"
  echo "     curl -s -X POST http://localhost:3001/api/attestation/init \\"
  echo "       -H 'Content-Type: application/json' \\"
  echo "       -d '{\"courseId\":1}'"
  echo ""
}

main "$@"