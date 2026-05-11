#!/usr/bin/env bash
# One-line installer for macOS / Linux. Run via:
#   curl -fsSL https://raw.githubusercontent.com/IamRamgarhia/seo/main/install.sh | bash
#
# What it does:
#   1. Clones (or pulls) the repo into ~/seo
#   2. Auto-detects a free local port (default 3000, falls through to 3001-3010
#      if 3000 is busy)
#   3. Builds + starts the Docker container with that port
#   4. Waits for /api/v1/health to confirm the app is actually up
#   5. Opens the browser to http://localhost:<PORT>
#   6. Drops a SEO-Tool-Welcome.txt on the user's Desktop with all the info
#   7. If Docker isn't available, falls back to native install (scripts/setup.sh)
#
# Idempotent. Safe to re-run for upgrades.

set -e

REPO="${SEO_REPO:-https://github.com/IamRamgarhia/seo.git}"
DIR="${SEO_INSTALL_DIR:-$HOME/seo}"
DEFAULT_PORT="${SEO_PORT:-3000}"
DESKTOP="$HOME/Desktop"

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'
say()  { printf "${GREEN}→${NC} %s\n" "$*"; }
info() { printf "${BLUE}i${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$*"; }
die()  { printf "${RED}✗${NC} %s\n" "$*" >&2; exit 1; }

# ---- 0. preflight -----------------------------------------------------------
say "SEO Tool installer"
command -v git >/dev/null 2>&1 || die "git not found. Install git from https://git-scm.com/downloads"

# ---- 1. clone / pull --------------------------------------------------------
if [ -d "$DIR/.git" ]; then
  say "Existing install at $DIR — pulling latest"
  git -C "$DIR" pull --ff-only >/dev/null 2>&1 || warn "git pull failed; continuing"
else
  say "Cloning into $DIR"
  git clone --depth 1 "$REPO" "$DIR" >/dev/null 2>&1
fi
cd "$DIR"

# ---- 2. find a free port ----------------------------------------------------
port_in_use() {
  local p="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -i :"$p" -sTCP:LISTEN >/dev/null 2>&1
  elif command -v ss >/dev/null 2>&1; then
    ss -lnt "( sport = :$p )" 2>/dev/null | grep -q LISTEN
  elif command -v netstat >/dev/null 2>&1; then
    netstat -an 2>/dev/null | grep -q "[\.:]$p .*LISTEN"
  else
    return 1
  fi
}

PORT="$DEFAULT_PORT"
if port_in_use "$PORT"; then
  warn "Port $PORT is occupied — finding a free one"
  for try in 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 8080 8081 4000 5000; do
    if ! port_in_use "$try"; then
      PORT="$try"
      break
    fi
  done
fi
say "Using port $PORT"

# ---- 3. Docker or native? ---------------------------------------------------
HAS_DOCKER=0
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  HAS_DOCKER=1
fi

if [ "$HAS_DOCKER" = "1" ]; then
  say "Docker detected — using Docker install"
  if ! docker compose version >/dev/null 2>&1; then
    die "Docker is installed but 'docker compose' (v2) is missing. Update Docker Desktop."
  fi

  export SEO_HOST_PORT="$PORT"
  say "Building image (first run takes 3-5 minutes; later runs are seconds)"
  docker compose up -d --build

  say "Waiting for the app to come up…"
  UP=0
  for i in $(seq 1 60); do
    if curl -fsS -o /dev/null "http://localhost:$PORT/api/v1/health" 2>/dev/null; then
      UP=1
      break
    fi
    sleep 2
    printf "."
  done
  echo

  if [ "$UP" != "1" ]; then
    warn "App didn't respond on health check after 2 minutes."
    warn "Check logs: cd $DIR && docker compose logs -f"
    warn "Then open http://localhost:$PORT manually."
  else
    say "App is up at http://localhost:$PORT"
  fi
else
  warn "Docker not detected — falling back to native install"
  info "Tip: Docker Desktop makes this much easier: https://www.docker.com/products/docker-desktop/"
  echo
  bash "$DIR/scripts/setup.sh"
  say "Starting dev server on port $PORT in background"
  if command -v pnpm >/dev/null 2>&1; then
    PORT="$PORT" nohup pnpm dev >"$DIR/dev-server.log" 2>&1 &
  else
    PORT="$PORT" nohup npm run dev >"$DIR/dev-server.log" 2>&1 &
  fi
  SERVER_PID=$!
  echo "$SERVER_PID" >"$DIR/.dev-server.pid"

  say "Waiting for the app to come up… (first build takes 30-60s)"
  UP=0
  for i in $(seq 1 60); do
    if curl -fsS -o /dev/null "http://localhost:$PORT/api/v1/health" 2>/dev/null; then
      UP=1
      break
    fi
    sleep 2
    printf "."
  done
  echo
  if [ "$UP" != "1" ]; then
    warn "App didn't respond yet. Check $DIR/dev-server.log for details."
  else
    say "App is up at http://localhost:$PORT"
  fi
fi

# ---- 4. write desktop welcome file ------------------------------------------
WELCOME="$DESKTOP/SEO-Tool-Welcome.txt"
if [ -d "$DESKTOP" ]; then
  {
    echo "======================================================"
    echo "   SEO TOOL — INSTALLED"
    echo "======================================================"
    echo ""
    echo "Open the app:        http://localhost:$PORT"
    echo "Install location:    $DIR"
    echo ""
    echo "----------------------- FIRST 5 MIN ------------------"
    echo "1. Open http://localhost:$PORT"
    echo "2. Add a client at /clients/new (paste any domain)"
    echo "3. Pick an AI provider at /settings:"
    echo "     - Local Ollama (free, private)  OR"
    echo "     - Anthropic / OpenAI / Groq / Gemini (paste API key)"
    echo "4. Run your first audit"
    echo "5. Tomorrow: the daily agent kicks in automatically"
    echo ""
    echo "----------------------- CONTROLS ---------------------"
    if [ "$HAS_DOCKER" = "1" ]; then
      echo "Stop:    cd $DIR && docker compose down"
      echo "Start:   cd $DIR && SEO_HOST_PORT=$PORT docker compose up -d"
      echo "Logs:    cd $DIR && docker compose logs -f"
      echo "Update:  cd $DIR && git pull && SEO_HOST_PORT=$PORT docker compose up -d --build"
    else
      echo "Stop:    kill \$(cat $DIR/.dev-server.pid)"
      echo "Start:   cd $DIR && PORT=$PORT pnpm dev"
      echo "Logs:    tail -f $DIR/dev-server.log"
      echo "Update:  cd $DIR && git pull && pnpm install"
    fi
    echo ""
    echo "----------------------- TROUBLESHOOT -----------------"
    echo "Blank page?       Server still building — wait 30-60s and refresh."
    echo "Want a password?  Set APP_PASSWORD=yourpassword in $DIR/.env.local"
    echo "                  then restart."
    echo "Port conflict?    SEO_PORT=4000 (any free port) before re-running"
    echo "                  the installer."
    echo ""
    echo "----------------------- DOCS -------------------------"
    echo "Repo:     https://github.com/IamRamgarhia/seo"
    echo "Hosting:  $DIR/docs/HOSTING.md"
    echo "README:   $DIR/README.md"
    echo ""
    echo "======================================================"
  } > "$WELCOME"
  say "Created $WELCOME"
fi

# ---- 5. auto-open browser ---------------------------------------------------
URL="http://localhost:$PORT"
if [ "$UP" = "1" ]; then
  if command -v open >/dev/null 2>&1; then
    open "$URL" 2>/dev/null || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" 2>/dev/null || true
  fi
fi

# ---- done -------------------------------------------------------------------
echo
printf "${GREEN}✓ SEO Tool ready.${NC}\n\n"
echo "Open:    $URL"
[ -f "$WELCOME" ] && echo "Guide:   $WELCOME"
echo
