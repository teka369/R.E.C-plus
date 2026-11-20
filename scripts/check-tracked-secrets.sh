#!/usr/bin/env bash
# Falla si el índice de Git vuelve a trackear secretos o uploads de usuarios.
# No imprime valores. Solo rutas y el nombre de la regla.
set -eu

root="$(git rev-parse --show-toplevel)"
cd "$root"

fail=0
list="$(mktemp)"
git ls-files > "$list"

is_allowed_env() {
  case "$1" in
    *.example|.env.example|.env.*.example|.env.coolify.example|*/.env.coolify.example) return 0 ;;
    *) return 1 ;;
  esac
}

while IFS= read -r path; do
  [ -z "$path" ] && continue
  base="$(basename "$path")"
  case "$base" in
    .env|.env.local|.env.test|.env.production|.env.development|.env.docker)
      echo "BLOCK tracked env file: $path"
      fail=1
      ;;
    .env.*)
      if ! is_allowed_env "$path"; then
        echo "BLOCK tracked env file: $path"
        fail=1
      fi
      ;;
  esac
  case "$path" in
    r.e.c-backend/uploads/*|*/uploads/study-materials/*)
      echo "BLOCK tracked user upload: $path"
      fail=1
      ;;
  esac
done < "$list"

while IFS= read -r path; do
  [ -z "$path" ] && continue
  case "$path" in
    *.png|*.jpg|*.jpeg|*.gif|*.webp|*.pdf|*.lock|*.tsbuildinfo|*.example) continue ;;
    docs/audits/*|docs/implementation/*) continue ;;
  esac
  if git grep -I -n -E 'postgres(ql)?://[^[:space:]]+:[^[:space:]@]+@' -- "$path" 2>/dev/null \
    | grep -v -E 'CHANGE_ME|YOUR_|EXAMPLE|postgres:postgres@|\$\{' >/dev/null; then
    echo "BLOCK connection string with password: $path"
    fail=1
  fi
  if git grep -I -n -E 're_[A-Za-z0-9]{20,}' -- "$path" >/dev/null 2>&1; then
    echo "BLOCK possible Resend key: $path"
    fail=1
  fi
done < "$list"

rm -f "$list"

if [ "$fail" -ne 0 ]; then
  echo "secret/upload guard failed"
  exit 1
fi

echo "secret/upload guard ok"
