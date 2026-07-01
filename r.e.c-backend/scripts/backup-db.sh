#!/usr/bin/env bash
set -euo pipefail

# ─── PostgreSQL Backup Script ─────────────────────────────────────────
# Uso: ./scripts/backup-db.sh [--s3] [--local]
# Requiere: pg_dump, gzip, (opcional: aws-cli para S3)
#
# Variables de entorno:
#   DATABASE_URL           (obligatorio: conexión PostgreSQL)
#   BACKUP_DIR             (por defecto: ./backups)
#   BACKUP_RETENTION_DAYS  (por defecto: 30)
#   AWS_S3_BUCKET          (opcional: ej. s3://recedu-backups)
#   BACKUP_ENCRYPT_KEY     (opcional: clave GPG para cifrado)
# ────────────────────────────────────────────────────────────────────────

DB_URL="${DATABASE_URL:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
S3_BUCKET="${AWS_S3_BUCKET:-}"
ENCRYPT_KEY="${BACKUP_ENCRYPT_KEY:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="recedu_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILENAME="recedu_${TIMESTAMP}.sql.gz.gpg"

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL no está configurada"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "=== Iniciando backup: $TIMESTAMP ==="

# Extraer componentes de la URL para pg_dump (más confiable que pasar la URL directa)
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@\([^:/]*\).*|\2|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@[^:/]*:\([0-9]*\)/.*|\2|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_PORT="${DB_PORT:-5432}"

export PGPASSWORD="$DB_PASS"

echo "Backup de: $DB_NAME en $DB_HOST:$DB_PORT"

pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="${BACKUP_DIR}/${FILENAME%.gz}" 2>&1 | tail -5

gzip -f "${BACKUP_DIR}/${FILENAME%.gz}"
echo "Backup creado: ${BACKUP_DIR}/${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"

# Cifrado opcional
if [ -n "$ENCRYPT_KEY" ]; then
  echo "$ENCRYPT_KEY" | gpg --batch --yes --passphrase-fd 0 \
    --symmetric --cipher-algo AES256 \
    -o "${BACKUP_DIR}/${ENCRYPTED_FILENAME}" \
    "${BACKUP_DIR}/${FILENAME}"
  rm -f "${BACKUP_DIR}/${FILENAME}"
  echo "Backup cifrado: ${BACKUP_DIR}/${ENCRYPTED_FILENAME}"
fi

# Subir a S3 si está configurado
if [ -n "$S3_BUCKET" ]; then
  TARGET="${BACKUP_DIR}/${ENCRYPTED_FILENAME:-$FILENAME}"
  aws s3 cp "$TARGET" "${S3_BUCKET}/$(date +%Y/%m)/${TARGET##*/}" --storage-class STANDARD_IA
  echo "Subido a: $S3_BUCKET"
fi

# Limpieza de backups locales antiguos
echo "Limpiando backups locales con más de $RETENTION_DAYS días..."
find "$BACKUP_DIR" -name "recedu_*.sql.gz*" -type f -mtime "+$RETENTION_DAYS" -delete

echo "=== Backup completado exitosamente ==="
