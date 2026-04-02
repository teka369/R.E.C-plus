#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILE="${BACKUP_DIR}/rec_db_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup to ${BACKUP_FILE}..."

pg_dump \
  --host="${PGHOST}" \
  --username="${PGUSER}" \
  --dbname="${PGDATABASE}" \
  --no-password \
  --format=plain \
  --no-owner \
  --no-privileges \
  | gzip > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup complete: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Retention: delete backups older than BACKUP_RETENTION_DAYS
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
find "${BACKUP_DIR}" -name "rec_db_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true

REMAINING=$(ls -1 "${BACKUP_DIR}"/rec_db_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Retention applied (${RETENTION_DAYS} days). Backups remaining: ${REMAINING}"
