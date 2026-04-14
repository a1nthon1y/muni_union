#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Backup automático de PostgreSQL — Registro Civil Municipalidad La Unión
#
# Uso:
#   bash backup_db.sh
#
# Configurar en crontab para ejecución diaria a las 2 AM:
#   0 2 * * * /ruta/al/proyecto/scripts/backup_db.sh >> /var/log/backup_db.log 2>&1
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuración ─────────────────────────────────────────────────
BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
DB_CONTAINER="union_db"                  # nombre del contenedor Docker
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-registro_muni_union}"
KEEP_DAYS=30                             # días de retención
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="backup_${DB_NAME}_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup → $FILENAME"

# Crear backup comprimido
docker exec "$DB_CONTAINER" \
    pg_dump -U "$DB_USER" "$DB_NAME" \
    | gzip > "$BACKUP_DIR/$FILENAME"

SIZE=$(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup creado: $FILENAME ($SIZE)"

# Eliminar backups más antiguos de $KEEP_DAYS días
DELETED=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +${KEEP_DAYS} -print -delete | wc -l)
[ "$DELETED" -gt 0 ] && echo "[$(date '+%Y-%m-%d %H:%M:%S')] $DELETED backup(s) antiguos eliminados"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completado exitosamente"
