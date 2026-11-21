#!/usr/bin/env bash
# Restauracion del directorio de uploads de R.E.C-plus.
# Requiere confirmacion explicita del directorio de destino.
# Uso:
#   ./scripts/restore-uploads.sh --file backup.tar.gz --target-dir /ruta/uploads --confirm /ruta/uploads
set -euo pipefail

FILE=""
TARGET_DIR=""
CONFIRM=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) FILE="$2"; shift 2 ;;
    --target-dir) TARGET_DIR="$2"; shift 2 ;;
    --confirm) CONFIRM="$2"; shift 2 ;;
    *) echo "Opcion desconocida: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$FILE" || -z "$TARGET_DIR" ]]; then
  echo "Se requiere --file y --target-dir." >&2
  exit 2
fi
if [[ ! -f "$FILE" ]]; then
  echo "El archivo de backup no existe: $FILE" >&2
  exit 2
fi
if [[ "$CONFIRM" != "$TARGET_DIR" ]]; then
  echo "Confirmacion incorrecta. Pase --confirm $TARGET_DIR para continuar." >&2
  exit 2
fi

command -v tar >/dev/null 2>&1 || { echo "tar no esta instalado." >&2; exit 2; }

CHECKSUM_FILE="$FILE.sha256"
if [[ -f "$CHECKSUM_FILE" ]]; then
  ( cd "$(dirname "$FILE")" && sha256sum -c "$(basename "$CHECKSUM_FILE")" ) >/dev/null
fi

mkdir -p "$TARGET_DIR"

# Extraer el contenido directamente en el directorio de destino.
tar --extract --gzip --file="$FILE" --directory="$TARGET_DIR" --keep-old-files

echo "Restauracion de uploads completada en: $TARGET_DIR"
echo "Revise los archivos restaurados antes de reiniciar la aplicacion."
