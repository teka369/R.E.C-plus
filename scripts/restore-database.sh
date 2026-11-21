#!/usr/bin/env bash
# Restauracion de PostgreSQL para R.E.C-plus.
# Requiere confirmacion explicita del nombre de la base de destino.
# Uso:
#   ./scripts/restore-database.sh --file /ruta/backup.dump --target-db recedu_restore_test --confirm recedu_restore_test
# Opcional: --host, --port, --user, --password (o variables PG*).
set -euo pipefail

FILE=""
TARGET_DB=""
CONFIRM=""
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) FILE="$2"; shift 2 ;;
    --target-db) TARGET_DB="$2"; shift 2 ;;
    --confirm) CONFIRM="$2"; shift 2 ;;
    --host) PGHOST="$2"; shift 2 ;;
    --port) PGPORT="$2"; shift 2 ;;
    --user) PGUSER="$2"; shift 2 ;;
    --password) PGPASSWORD="$2"; shift 2 ;;
    *) echo "Opcion desconocida: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$FILE" || -z "$TARGET_DB" ]]; then
  echo "Se requiere --file y --target-db." >&2
  exit 2
fi
if [[ ! -f "$FILE" ]]; then
  echo "El archivo de backup no existe: $FILE" >&2
  exit 2
fi
if ! [[ "$TARGET_DB" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "Nombre de base de destino invalido: $TARGET_DB" >&2
  exit 2
fi
if [[ "$CONFIRM" != "$TARGET_DB" ]]; then
  echo "Confirmacion incorrecta. Pase --confirm $TARGET_DB para continuar." >&2
  exit 2
fi

# Evitar restaurar en una base con nombre que sugiera produccion sin confirmacion adicional.
case "$TARGET_DB" in
  *prod*|*production*|*main*)
    echo "Nombre de base de destino sospechoso ($TARGET_DB). Renombre la base de prueba o confirme manualmente." >&2
    exit 2
    ;;
esac

command -v pg_restore >/dev/null 2>&1 || { echo "pg_restore no esta instalado." >&2; exit 2; }

# Verificar checksum si existe.
CHECKSUM_FILE="$FILE.sha256"
if [[ -f "$CHECKSUM_FILE" ]]; then
  ( cd "$(dirname "$FILE")" && sha256sum -c "$(basename "$CHECKSUM_FILE")" ) >/dev/null
fi

export PGPASSWORD

# Crear la base si no existe (conectando a 'postgres').
if ! psql --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname=postgres \
  -tAc "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB'" | grep -q 1; then
  psql --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname=postgres \
    -c "CREATE DATABASE \"$TARGET_DB\"" >/dev/null
fi

# Restaurar. --clean elimina objetos previos en la base de destino.
pg_restore --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
  --dbname="$TARGET_DB" --clean --if-exists --no-owner --no-privileges \
  "$FILE"

echo "Restauracion completada en la base: $TARGET_DB@$PGHOST:$PGPORT"
echo "Verifique los datos antes de usar la base."
