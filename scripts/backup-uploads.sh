#!/usr/bin/env bash
# Respaldo del directorio de uploads de R.E.C-plus.
# Uso:
#   UPLOADS_DIR=/ruta/a/uploads ./scripts/backup-uploads.sh [--dest DIR] [--retention DAYS]
set -euo pipefail

DEST="${BACKUP_DIR:-/var/backups/recedu}"
RETENTION=14
UPLOADS_DIR="${UPLOADS_DIR:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest) DEST="$2"; shift 2 ;;
    --retention) RETENTION="$2"; shift 2 ;;
    --source) UPLOADS_DIR="$2"; shift 2 ;;
    *) echo "Opcion desconocida: $1" >&2; exit 2 ;;
  esac
done

# Intentar detectar el directorio por defecto relativo al repo.
if [[ -z "$UPLOADS_DIR" ]]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  UPLOADS_DIR="$ROOT/r.e.c-backend/uploads"
fi

if [[ ! -d "$UPLOADS_DIR" ]]; then
  echo "El directorio de uploads no existe: $UPLOADS_DIR" >&2
  exit 2
fi

command -v tar >/dev/null 2>&1 || { echo "tar no esta instalado." >&2; exit 2; }

mkdir -p "$DEST"
chmod 700 "$DEST" 2>/dev/null || true

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$DEST/recedu-uploads-$STAMP.tar.gz"
TMP="$FILE.tmp.$$"

# Se respalda el CONTENIDO del directorio (no el directorio mismo)
# para que la restauracion lo deje directamente en el destino.
if ! tar --create --gzip --file="$TMP" --directory="$UPLOADS_DIR" \
  --dereference -- . ; then
  rm -f "$TMP"
  echo "tar fallo." >&2
  exit 1
fi

# Verificar que el archivo se pueda listar.
if ! tar --list --gzip --file="$TMP" >/dev/null 2>&1; then
  rm -f "$TMP"
  echo "El archivo de uploads generado no es legible." >&2
  exit 1
fi

mv "$TMP" "$FILE"
chmod 600 "$FILE"
( cd "$DEST" && sha256sum "$(basename "$FILE")" > "$FILE.sha256" )
chmod 600 "$FILE.sha256"

find "$DEST" -maxdepth 1 -type f -name 'recedu-uploads-*.tar.gz' -mtime +"$RETENTION" -delete
find "$DEST" -maxdepth 1 -type f -name 'recedu-uploads-*.tar.gz.sha256' -mtime +"$RETENTION" -delete

echo "Backup de uploads creado: $FILE"
echo "SHA256: $(sha256sum "$FILE" | cut -d' ' -f1)"
echo "Origen: $UPLOADS_DIR"
