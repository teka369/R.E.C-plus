#!/usr/bin/env bash
# Despliegue local/VPS: build + pm2 restart para R.E.C-plus
# Uso:
#   npm run deploy:backend
#   npm run deploy:frontend
#   npm run deploy:all
#   npm run deploy:backend:pull   # git pull antes
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET="${1:-}"
PULL=false

if [[ "$TARGET" == "--pull" ]]; then
  PULL=true
  TARGET="${2:-all}"
elif [[ "${2:-}" == "--pull" ]]; then
  PULL=true
fi

if [[ -z "$TARGET" || ( "$TARGET" != "backend" && "$TARGET" != "frontend" && "$TARGET" != "all" ) ]]; then
  echo "Uso: $0 [backend|frontend|all] [--pull]"
  echo ""
  echo "  backend   — npm run build en r.e.c-backend + pm2 restart recedu-backend"
  echo "  frontend  — npm run build en r.e.c-frontend + pm2 restart recedu-frontend"
  echo "  all       — backend y luego frontend"
  echo "  --pull    — git pull en la raíz del repo antes del resto"
  exit 1
fi

if [[ "$PULL" == true ]]; then
  echo ">>> git pull (raíz del repo)"
  git pull
fi

deploy_backend() {
  echo ">>> Backend: build"
  cd "$ROOT/r.e.c-backend"
  npm run build
  echo ">>> Backend: pm2 restart recedu-backend"
  pm2 restart recedu-backend
}

deploy_frontend() {
  echo ">>> Frontend: build"
  cd "$ROOT/r.e.c-frontend"
  npm run build
  echo ">>> Frontend: pm2 restart recedu-frontend"
  pm2 restart recedu-frontend
}

case "$TARGET" in
  backend)  deploy_backend ;;
  frontend) deploy_frontend ;;
  all)
    deploy_backend
    deploy_frontend
    ;;
esac

echo ">>> Listo."
