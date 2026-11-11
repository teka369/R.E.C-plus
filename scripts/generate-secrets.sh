#!/usr/bin/env bash
# Genera secretos fuertes y los imprime. No escribe archivos.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$root/scripts/generate-secrets.mjs"
