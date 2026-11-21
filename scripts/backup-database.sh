#!/usr/bin/env bash
# Respaldo de PostgreSQL para R.E.C-plus.
# Uso:
#   DATABASE_URL=postgresql://user:pass@host:port/db ./scripts/backup-database.sh [--dest DIR] [--retention DAYS]
# El archivo se escribe fuera del repositorio. La contrasena se toma de DATABASE_URL
# y se exporta como PGPASSWORD; no se pasa en la linea de comandos.
set -euo pipefail

DEST="${BACKUP_DIR:-/var/backups/recedu}"
RETENTION=14

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest) DEST="$2"; shift 2 ;;
    --retention) RETENTION="$2"; shift 2 ;;
    *) echo "Opcion desconocida: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL es obligatoria." >&2
  exit 2
fi

if ! [[ "$DATABASE_URL" =~ ^postgres(ql)?://([^:/]+):([^@]*)@([^:/]+):?([0-9]*)/(.+)$ ]]; then
  echo "DATABASE_URL no tiene el formato esperado postgresql://user:pass@host:port/db" >&2
  exit 2
fi

PGUSER="${BASH_REMATCH[2]}"
PGPASSWORD="${BASH_REMATCH[3]}"
PGHOST="${BASH_REMATCH[4]}"
PGPORT="${BASH_REMATCH[5]:-5432}"
PGDATABASE="${BASH_REMATCH[6]%%\?*}"

if [[ -z "$PGUSER" || -z "$PGHOST" || -z "$PGDATABASE" ]]; then
  echo "No se pudo extraer usuario, contrasena, host o base de DATABASE_URL." >&2
  exit 2
fi

command -v pg_dump >/dev/null 2>&1 || { echo "pg_dump no esta instalado." >&2; exit 2; }

mkdir -p "$DEST"
chmod 700 "$DEST" 2>/dev/null || true

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$DEST/recedu-db-$STAMP.dump"
TMP="$FILE.tmp.$$"

export PGPASSWORD
# --no-password evita prompts; la contrasena viene de PGPASSWORD.
if ! pg_dump --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
  --dbname="$PGDATABASE" --format=custom --no-owner --no-privileges \
  --file="$TMP" ; then
  rm -f "$TMP"
  echo "pg_dump fallo." >&2
  exit 1
fi

# Verificar que el volcado se pueda leer.
if ! pg_restore --list "$TMP" >/dev/null 2>&1; then
  rm -f "$TMP"
  echo "El volcado generado no es legible por pg_restore." >&2
  exit 1
fi

mv "$TMP" "$FILE"
chmod 600 "$FILE"

# Checksum para verificacion posterior.
( cd "$DEST" && sha256sum "$(basename "$FILE")" > "$FILE.sha256" )
chmod 600 "$FILE.sha256"

# Rotacion por antiguedad.
find "$DEST" -maxdepth 1 -type f -name 'recedu-db-*.dump' -mtime +"$RETENTION" -delete
find "$DEST" -maxdepth 1 -type f -name 'recedu-db-*.dump.sha256' -mtime +"$RETENTION" -delete

echo "Backup de base creado: $FILE"
echo "SHA256: $(sha256sum "$FILE" | cut -d' ' -f1)"
echo "Base origen: $PGDATABASE@$PGHOST:$PGPORT (usuario $PGUSER)"
