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

port_is_busy() {
  ss -ltnH "( sport = :$1 )" 2>/dev/null | grep -q .
}

ensure_port_is_available() {
  local port="$1"
  local service="$2"
  local containers=""
  local pids=""
  local answer=""

  if ! port_is_busy "$port"; then
    return
  fi

  echo "Cổng $port cho $service đang được sử dụng."
  if command -v docker >/dev/null; then
    containers=$(docker ps --filter "publish=$port" --format '{{.ID}} {{.Names}}' 2>/dev/null || true)
  fi
  if [[ -n "$containers" ]]; then
    echo "Container đang chiếm cổng:"
    echo "$containers"
  else
    pids=$(fuser -n tcp "$port" 2>/dev/null | sed -E 's/.*: *//' || true)
    [[ -n "$pids" ]] && echo "PID đang chiếm cổng: $pids"
  fi

  read -r -p "Dừng tiến trình/container đang chiếm cổng $port? [y/N] " answer
  case "$answer" in
    y|Y)
      if [[ -n "$containers" ]]; then
        while read -r container_id _; do
          [[ -n "$container_id" ]] && docker stop "$container_id"
        done <<< "$containers"
      elif [[ -n "$pids" ]]; then
        kill $pids
      else
        echo "Không xác định được owner của cổng $port; không tự dừng tiến trình." >&2
        exit 1
      fi
      ;;
    *)
      echo "Không khởi động $service vì cổng $port vẫn đang bận."
      exit 1
      ;;
  esac

  for _ in {1..20}; do
    if ! port_is_busy "$port"; then
      return
    fi
    sleep 0.1
  done

  if port_is_busy "$port"; then
    echo "Cổng $port vẫn đang bận sau khi dừng tiến trình." >&2
    exit 1
  fi
}

ensure_port_is_available "$be_port" "backend"
ensure_port_is_available "$fe_port" "frontend"

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
