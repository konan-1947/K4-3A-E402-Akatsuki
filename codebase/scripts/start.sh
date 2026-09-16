#!/usr/bin/env bash

# Start the StudyPulse frontend and backend together.
# Optional overrides: BE_PORT=8081 FE_PORT=3001 ./codebase/scripts/start.sh
set -Eeuo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
codebase_dir=$(cd -- "$script_dir/.." && pwd)
backend_dir="$codebase_dir/be"
frontend_dir="$codebase_dir/fe"
be_port="${BE_PORT:-8080}"
fe_port="${FE_PORT:-3000}"
be_pid=""
fe_pid=""

cleanup() {
  local status=$?
  trap - EXIT INT TERM

  for pid in "$be_pid" "$fe_pid"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait "$be_pid" 2>/dev/null || true
  wait "$fe_pid" 2>/dev/null || true
  exit "$status"
}
trap cleanup EXIT INT TERM

[[ -x "$backend_dir/mvnw" ]] || { echo "Không thấy Maven Wrapper: $backend_dir/mvnw" >&2; exit 1; }
[[ -f "$frontend_dir/package.json" ]] || { echo "Không thấy frontend: $frontend_dir/package.json" >&2; exit 1; }
command -v npm >/dev/null || { echo "Cần cài Node.js/npm trước khi chạy." >&2; exit 1; }

if [[ ! -d "$frontend_dir/node_modules" ]]; then
  echo "Đang cài dependencies frontend..."
  (cd "$frontend_dir" && npm ci)
fi

echo "Starting backend:  http://localhost:$be_port"
(cd "$backend_dir" && ./mvnw spring-boot:run "-Dspring-boot.run.arguments=--server.port=$be_port") &
be_pid=$!

echo "Starting frontend: http://localhost:$fe_port"
(cd "$frontend_dir" && npm run dev -- --port "$fe_port") &
fe_pid=$!

echo "StudyPulse is starting. Press Ctrl+C to stop both services."
set +e
wait -n "$be_pid" "$fe_pid"
status=$?
set -e
exit "$status"
