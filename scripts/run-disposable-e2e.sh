#!/usr/bin/env bash
# E2E desechable: Nest e2e, seed y Playwright contra una base recedu_e2e local.
# No usa secretos de producción. Exige E2E_DATABASE=1 y host loopback.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

export E2E_DATABASE="${E2E_DATABASE:-1}"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL es obligatorio y debe apuntar a recedu_e2e en loopback."
  exit 1
fi
export DATABASE_DIRECT_URL="${DATABASE_DIRECT_URL:-$DATABASE_URL}"
export JWT_SECRET="${JWT_SECRET:-ci-jwt-secret-at-least-32-characters-long}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-ci-refresh-secret-at-least-32-chars}"
export JWT_ISSUER="${JWT_ISSUER:-recedu-ci}"
export JWT_AUDIENCE="${JWT_AUDIENCE:-recedu-ci}"
export PORT="${PORT:-4000}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://127.0.0.1:3000}"
export INTERNAL_API_URL="${INTERNAL_API_URL:-http://127.0.0.1:${PORT}}"
export E2E_BASE_URL="${E2E_BASE_URL:-http://127.0.0.1:3000}"
export E2E_FIXTURE="${E2E_FIXTURE:-$root/r.e.c-backend/test/e2e/.generated/fixture.json}"

cd "$root/r.e.c-backend"
npx prisma generate
npx prisma migrate deploy
NODE_ENV=test npm run test:e2e
npm run seed:e2e
npm run build

log="${TMPDIR:-/tmp}/recedu-e2e-backend.log"
NODE_ENV=test node dist/main.js > "$log" 2>&1 &
pid=$!
cleanup() {
  kill "$pid" 2>/dev/null || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${PORT}/health/ready" >/dev/null; then
    ready=1
    break
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "El backend E2E terminó antes de estar listo."
    cat "$log"
    exit 1
  fi
  sleep 2
done
if [ "$ready" -ne 1 ]; then
  echo "El backend E2E no respondió en /health/ready."
  cat "$log"
  exit 1
fi

cd "$root/r.e.c-frontend"
npm run test:e2e
