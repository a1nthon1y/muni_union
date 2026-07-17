#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  INICIALIZAR BASE DE DATOS LIMPIA — VM PostgreSQL 172.16.3.23
#
#  Modos de uso:
#    bash init_db.sh limpia     → Base completamente nueva (solo admin)
#    bash init_db.sh desde-neon → Importar backup completo de Neon
#
#  Ejecutar como usuario 'deploy' en la VM de PostgreSQL (.23)
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[⚠] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }
info() { echo -e "${BLUE}[i] $1${NC}"; }

DB_NAME="registro_muni_union"
DB_USER="app_user"
DB_HOST="172.16.3.23"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"

MODO="${1:-}"
[ -z "$MODO" ] && err "Uso: bash $0 [limpia|desde-neon]"

echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Sistema de Registro Civil — Municipalidad${NC}"
echo -e "${BLUE}  Inicialización de Base de Datos${NC}"
echo -e "${BLUE}  Modo: ${MODO}${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# ── Verificar que PostgreSQL está corriendo ────────────────────────
sudo systemctl is-active --quiet postgresql || err "PostgreSQL no está corriendo. Ejecuta: sudo systemctl start postgresql"
log "PostgreSQL activo"

# ── Verificar que la base de datos existe ─────────────────────────
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    warn "La base de datos '${DB_NAME}' no existe. Creándola..."
    sudo -u postgres psql << SQL
CREATE USER ${DB_USER} WITH PASSWORD 'CAMBIAR_PASSWORD_SEGURO' NOSUPERUSER NOCREATEDB NOCREATEROLE LOGIN;
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER} ENCODING='UTF8';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL
    log "Base de datos '${DB_NAME}' creada"
fi

# ══════════════════════════════════════════════════════════════════
# MODO: LIMPIA — Solo esquema + usuario administrador
# ══════════════════════════════════════════════════════════════════
if [ "$MODO" = "limpia" ]; then

    warn "ADVERTENCIA: Esto eliminará TODOS los datos existentes en '${DB_NAME}'"
    warn "Solo quedará el usuario administrador 'aespinoza'"
    echo ""
    read -r -p "$(echo -e ${RED})¿Continuar? Escribe 'SI BORRAR TODO' para confirmar: $(echo -e ${NC})" CONFIRM

    if [ "$CONFIRM" != "SI BORRAR TODO" ]; then
        info "Operación cancelada."
        exit 0
    fi

    log "Terminando conexiones activas..."
    sudo -u postgres psql -c \
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" \
      2>/dev/null || true

    log "Eliminando base de datos..."
    sudo -u postgres dropdb "${DB_NAME}"

    log "Recreando base de datos vacía..."
    sudo -u postgres psql << SQL
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER} ENCODING='UTF8';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

    log "Aplicando esquema limpio + datos iniciales..."
    sudo -u postgres psql -d "${DB_NAME}" -f "${SCRIPTS_DIR}/instalacion_limpia.sql"

    # Dar permisos al app_user sobre todo lo creado
    sudo -u postgres psql -d "${DB_NAME}" << SQL
GRANT USAGE ON SCHEMA public TO ${DB_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${DB_USER};
SQL

    echo ""
    log "════════════════════════════════════════════"
    log "  BASE DE DATOS LIMPIA INICIALIZADA"
    log ""
    log "  Base:     ${DB_NAME}"
    log "  Usuario:  aespinoza"
    log "  Password: 123456"
    warn "  ⚠ CAMBIAR CONTRASEÑA al primer login"
    log "════════════════════════════════════════════"

# ══════════════════════════════════════════════════════════════════
# MODO: DESDE-NEON — Importar backup completo de Neon
# ══════════════════════════════════════════════════════════════════
elif [ "$MODO" = "desde-neon" ]; then

    # Buscar el archivo de backup
    BACKUP_FILE=$(ls -t /tmp/neon_full_backup_*.sql.gz 2>/dev/null | head -1 || echo "")

    if [ -z "$BACKUP_FILE" ]; then
        err "No se encontró ningún backup de Neon en /tmp/\n  Copia el archivo con:\n  scp neon_full_backup_*.sql.gz deploy@172.16.3.23:/tmp/"
    fi

    info "Backup encontrado: $(basename $BACKUP_FILE) ($(du -sh $BACKUP_FILE | cut -f1))"
    echo ""
    warn "ADVERTENCIA: Esto reemplazará los datos actuales de '${DB_NAME}' con los de Neon"
    read -r -p "$(echo -e ${YELLOW})¿Continuar? Escribe 'SI IMPORTAR' para confirmar: $(echo -e ${NC})" CONFIRM

    if [ "$CONFIRM" != "SI IMPORTAR" ]; then
        info "Operación cancelada."
        exit 0
    fi

    log "Terminando conexiones activas..."
    sudo -u postgres psql -c \
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" \
      2>/dev/null || true

    log "Eliminando base de datos actual..."
    sudo -u postgres dropdb "${DB_NAME}"

    log "Recreando base de datos vacía..."
    sudo -u postgres psql << SQL
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER} ENCODING='UTF8';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

    log "Importando backup de Neon... (puede tardar varios minutos)"
    gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d "${DB_NAME}"

    log "Ajustando permisos para app_user..."
    sudo -u postgres psql -d "${DB_NAME}" << SQL
GRANT USAGE ON SCHEMA public TO ${DB_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${DB_USER};
SQL

    # Contar registros importados
    ACTAS=$(sudo -u postgres psql -d "${DB_NAME}" -tAc "SELECT COUNT(*) FROM actas WHERE fecha_eliminacion IS NULL" 2>/dev/null || echo "?")
    PERSONAS=$(sudo -u postgres psql -d "${DB_NAME}" -tAc "SELECT COUNT(*) FROM personas WHERE fecha_eliminacion IS NULL" 2>/dev/null || echo "?")
    USUARIOS=$(sudo -u postgres psql -d "${DB_NAME}" -tAc "SELECT COUNT(*) FROM usuarios WHERE fecha_eliminacion IS NULL" 2>/dev/null || echo "?")

    echo ""
    log "════════════════════════════════════════════"
    log "  IMPORTACIÓN DESDE NEON COMPLETADA"
    log ""
    log "  Actas importadas:    ${ACTAS}"
    log "  Personas importadas: ${PERSONAS}"
    log "  Usuarios importados: ${USUARIOS}"
    log ""
    log "  Backup usado: $(basename $BACKUP_FILE)"
    log "════════════════════════════════════════════"

else
    err "Modo desconocido: '${MODO}'. Usa: limpia | desde-neon"
fi
