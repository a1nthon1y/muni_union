#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  VM POSTGRESQL — 172.16.3.23
#  Base de Datos PostgreSQL 15
#  Se configura SEGUNDO, antes del Backend
#  Municipalidad Distrital La Unión — Sistema de Registro Civil
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }

[ "$EUID" -ne 0 ] && err "Ejecutar como root: sudo bash $0"

THIS_IP="172.16.3.23"
BACKEND_IP="172.16.3.22"
STORAGE_IP="172.16.3.24"

# ── CAMBIAR ESTAS CREDENCIALES ──────────────────────────────────
DB_NAME="registro_muni_union"
DB_APP_USER="app_user"
DB_APP_PASS="CAMBIAR_POR_PASSWORD_SEGURO_AQUI"
# ────────────────────────────────────────────────────────────────

log "══ [1/6] Instalando PostgreSQL 15 desde repo oficial ══"
apt install -y curl ca-certificates
install -d /usr/share/postgresql-common/pgdg
curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc
sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
apt update
apt install -y postgresql-15 postgresql-contrib-15

log "══ [2/6] Configurando parámetros de rendimiento ══"
cat > /etc/postgresql/15/main/conf.d/production.conf << EOF
# ── Conexiones ──────────────────────────────
listen_addresses = '${THIS_IP}'
port = 5432
max_connections = 80

# ── Memoria (para 4GB RAM) ──────────────────
shared_buffers            = 1GB
effective_cache_size      = 3GB
work_mem                  = 16MB
maintenance_work_mem      = 256MB

# ── WAL / Checkpoints ───────────────────────
wal_buffers               = 64MB
checkpoint_completion_target = 0.9
min_wal_size              = 512MB
max_wal_size              = 2GB

# ── Logging ─────────────────────────────────
logging_collector         = on
log_directory             = 'log'
log_filename              = 'postgresql-%Y-%m-%d.log'
log_rotation_age          = 1d
log_min_duration_statement = 1000
log_checkpoints           = on
log_connections           = on
log_lock_waits            = on

# ── Seguridad ────────────────────────────────
ssl                       = on
ssl_cert_file             = '/etc/postgresql/15/main/server.crt'
ssl_key_file              = '/etc/postgresql/15/main/server.key'
password_encryption       = scram-sha-256

# ── Timezone ─────────────────────────────────
timezone                  = 'America/Lima'
EOF

log "══ [3/6] Configurando pg_hba.conf (solo Backend puede conectar) ══"
cat > /etc/postgresql/15/main/pg_hba.conf << EOF
# TYPE  DATABASE              USER          ADDRESS           METHOD
local   all                   postgres                        peer
local   all                   all                             scram-sha-256
# Solo el backend puede conectarse y solo a su base
hostssl ${DB_NAME}            ${DB_APP_USER} ${BACKEND_IP}/32 scram-sha-256
# Rechazar todo lo demás
host    all                   all            0.0.0.0/0        reject
EOF

log "══ [4/6] Generando certificado SSL para PostgreSQL ══"
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/postgresql/15/main/server.key \
  -out    /etc/postgresql/15/main/server.crt \
  -subj   "/CN=${THIS_IP}/O=Municipalidad La Union/OU=DB"
chown postgres:postgres /etc/postgresql/15/main/server.{key,crt}
chmod 600 /etc/postgresql/15/main/server.key

systemctl restart postgresql

log "══ [5/6] Creando base de datos y usuario de aplicación ══"
sudo -u postgres psql << SQL
-- Usuario sin privilegios de superusuario
CREATE USER ${DB_APP_USER} WITH PASSWORD '${DB_APP_PASS}'
  NOSUPERUSER NOCREATEDB NOCREATEROLE LOGIN;

-- Base de datos
CREATE DATABASE ${DB_NAME} OWNER ${DB_APP_USER}
  ENCODING='UTF8' LC_COLLATE='es_PE.UTF-8' LC_CTYPE='es_PE.UTF-8'
  TEMPLATE template0;

-- Permisos mínimos necesarios
\c ${DB_NAME}
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
GRANT CONNECT ON DATABASE ${DB_NAME} TO ${DB_APP_USER};
GRANT USAGE ON SCHEMA public TO ${DB_APP_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_APP_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ${DB_APP_USER};
SQL

log "══ [6/6] Configurando backup automático hacia Storage ══"
apt install -y nfs-common

# Montar NFS de backups
mkdir -p /mnt/backups
echo "${STORAGE_IP}:/srv/muni/backups  /mnt/backups  nfs  defaults,_netdev,nofail  0  0" >> /etc/fstab
mount -a || warn "Asegúrate que la VM Storage (.24) esté encendida para montar NFS"

# Script de backup
cat > /opt/backup_postgres.sh << 'BKUP'
#!/bin/bash
set -euo pipefail

DB_USER="postgres"
DB_NAME="registro_muni_union"
BACKUP_DIR="/mnt/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DAY=$(date +%u)    # 1=lun..7=dom
DAY_OF_MONTH=$(date +%d)

# Verificar NFS montado
mountpoint -q "$BACKUP_DIR" || { echo "[ERROR] NFS no montado"; exit 1; }

FILE="${BACKUP_DIR}/daily/backup_${DB_NAME}_${DATE}.sql.gz"
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"
echo "[OK $(date)] Backup diario: $(basename $FILE) ($(du -sh $FILE | cut -f1))"

# Copia semanal (domingos)
if [ "$DAY" -eq 7 ]; then
  cp "$FILE" "${BACKUP_DIR}/weekly/$(basename $FILE)"
  echo "[OK $(date)] Copia semanal creada"
fi

# Copia mensual (día 1)
if [ "$DAY_OF_MONTH" = "01" ]; then
  cp "$FILE" "${BACKUP_DIR}/monthly/$(basename $FILE)"
  echo "[OK $(date)] Copia mensual creada"
fi

# Rotación
find "${BACKUP_DIR}/daily"   -name "*.sql.gz" -mtime +7  -delete
find "${BACKUP_DIR}/weekly"  -name "*.sql.gz" -mtime +30 -delete
find "${BACKUP_DIR}/monthly" -name "*.sql.gz" -mtime +365 -delete

echo "[OK $(date)] Rotación completada"
BKUP
chmod +x /opt/backup_postgres.sh

# Cron: cada día a las 2:00 AM
(crontab -l 2>/dev/null || true; echo "0 2 * * * /opt/backup_postgres.sh >> /var/log/backup_postgres.log 2>&1") | crontab -

# Firewall: solo Backend puede conectar al puerto 5432
ufw allow from "${BACKEND_IP}" to any port 5432 proto tcp comment "PostgreSQL desde Backend"

echo ""
log "════════════════════════════════════════════"
log "  VM POSTGRESQL configurada exitosamente"
log ""
log "  Base de datos: ${DB_NAME}"
log "  Usuario app:   ${DB_APP_USER}"
log "  Solo acepta conexiones desde: ${BACKEND_IP}"
log ""
warn "  PENDIENTE: Aplicar migraciones SQL:"
warn "  psql -h ${THIS_IP} -U ${DB_APP_USER} -d ${DB_NAME} -f 001_schema.sql"
warn "  psql -h ${THIS_IP} -U ${DB_APP_USER} -d ${DB_NAME} -f 002_indexes.sql"
log "════════════════════════════════════════════"
