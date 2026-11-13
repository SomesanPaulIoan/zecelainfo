#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

wait_for_docker() {
  local max_attempts=60
  local attempt=1

  until docker info >/dev/null 2>&1; do
    if [ "$attempt" -eq 1 ]; then
      echo "Docker daemon nu ruleaza. Incerc sa pornesc Docker Desktop..."
      if command -v open >/dev/null 2>&1; then
        open -a Docker >/dev/null 2>&1 || true
      fi
      echo "Astept pornirea Docker..."
    fi

    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Docker nu a pornit la timp. Porneste Docker Desktop si ruleaza din nou scriptul."
      exit 1
    fi

    sleep 2
    attempt=$((attempt + 1))
  done
}

wait_for_docker

echo "Pornesc infrastructura (Postgres, Redis, Judge)..."
docker compose up -d

cleanup() {
  echo
  echo "Oprire servere locale..."
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "Pornesc backend..."
npm run dev --prefix backend &
BACKEND_PID=$!

echo "Pornesc frontend..."
( cd frontend && npm run dev ) &
FRONTEND_PID=$!

echo
echo "Aplicatia este in curs de pornire."
echo "- Backend:  http://localhost:4000"
echo "- Frontend: http://localhost:3000"
echo "Apasa Ctrl+C pentru a opri backend/frontend."
echo

# Bash 3.2 (default on macOS) nu suporta `wait -n`.
# Asteptam pana cand unul dintre procese se opreste.
while true; do
  if ! kill -0 "$BACKEND_PID" >/dev/null 2>&1 || ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Unul dintre servere s-a oprit. Verifica logurile de mai sus."
exit 1
