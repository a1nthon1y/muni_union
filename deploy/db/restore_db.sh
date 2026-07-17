#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  SCRIPT DE RESTAURACIÓN — VM PostgreSQL (.23)
#  Restaurar la base de datos desde un backup guardado en Storage (.24)
#  Uso: bash restore_db.sh
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }

BACKUP_DIR="/mnt/backups"
DB_NAME="registro_muni_union"
DB_USER="postgres"

# Verificar NFS
mountpoint -q "$BACKUP_DIR" || err "NFS de backups no montado. Ejecuta: mount -a"

# Listar backups disponibles
echo "════════════════════════════════════════════"
echo "  Backups disponibles:"
echo "════════════════════════════════════════════"
echo ""
echo "DIARIOS:"
ls -lh "${BACKUP_DIR}/daily/" 2>/dev/null | tail -10 || echo "  (ninguno)"
echo ""
echo "SEMANALES:"
ls -lh "${BACKUP_DIR}/weekly/" 2>/dev/null | tail -5 || echo "  (ninguno)"
echo ""
echo "MENSUALES:"
ls -lh "${BACKUP_DIR}/monthly/" 2>/dev/null | tail -5 || echo "  (ninguno)"
echo ""

read -r -p "Ingresa el nombre exacto del archivo de backup: " BACKUP_FILE

if [[ "$BACKUP_FILE" == *"daily"* ]]; then
  FULL_PATH="${BACKUP_DIR}/daily/${BACKUP_FILE}"
elif [[ "$BACKUP_FILE" == *"weekly"* ]]; then
  FULL_PATH="${BACKUP_DIR}/weekly/${BACKUP_FILE}"
else
  # Buscar en todas las carpetas
  FULL_PATH=$(find "$BACKUP_DIR" -name "$BACKUP_FILE" | head -1)
fi

[ -f "$FULL_PATH" ] || err "Archivo no encontrado: $BACKUP_FILE"

warn "ADVERTENCIA: Esto ELIMINARÁ y recreará la base de datos '${DB_NAME}'"
read -r -p "¿Continuar? (escribe 'SI' para confirmar): " CONFIRM
[ "$CONFIRM" = "SI" ] || err "Restauración cancelada"

log "Deteniendo conexiones activas..."
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" || true

log "Eliminando base de datos actual..."
sudo -u postgres dropdb --if-exists "$DB_NAME"

log "Creando base de datos vacía..."
sudo -u postgres createdb -O app_user "$DB_NAME"
sudo -u postgres psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

log "Restaurando desde $BACKUP_FILE ..."
gunzip -c "$FULL_PATH" | sudo -u postgres psql -d "$DB_NAME"

log "════════════════════════════════════════════"
log "  Restauración completada exitosamente"
log "  Base de datos: ${DB_NAME}"
log "  Backup usado:  ${BACKUP_FILE}"
log "  Fecha:         $(date)"
log "════════════════════════════════════════════"
