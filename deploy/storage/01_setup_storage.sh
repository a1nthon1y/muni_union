#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  VM STORAGE — 172.16.3.24
#  Servidor de Archivos NFS
#  Se configura PRIMERO porque las demás VMs dependen de él
#  Municipalidad Distrital La Unión — Sistema de Registro Civil
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }

[ "$EUID" -ne 0 ] && err "Ejecutar como root: sudo bash $0"

THIS_IP="172.16.3.24"
BACKEND_IP="172.16.3.22"
DB_IP="172.16.3.23"

log "══ [1/4] Instalando servidor NFS ══"
apt install -y nfs-kernel-server

log "══ [2/4] Creando estructura de directorios ══"
# Carpeta de archivos subidos (PDFs de actas)
mkdir -p /srv/muni/uploads/documentos
# Carpeta de backups de PostgreSQL (daily/weekly/monthly)
mkdir -p /srv/muni/backups/{daily,weekly,monthly}
# Logs centralizados
mkdir -p /srv/muni/logs

# Permisos
chown -R nobody:nogroup /srv/muni
chmod -R 770 /srv/muni

log "══ [3/4] Configurando exports NFS ══"
cat > /etc/exports << EOF
# Backend (.22) puede leer y escribir uploads
/srv/muni/uploads  ${BACKEND_IP}(rw,sync,no_subtree_check,no_root_squash)

# BD (.23) solo puede escribir backups
/srv/muni/backups  ${DB_IP}(rw,sync,no_subtree_check,no_root_squash)

# Backend puede escribir logs
/srv/muni/logs     ${BACKEND_IP}(rw,sync,no_subtree_check,no_root_squash)
EOF

exportfs -ra
systemctl enable --now nfs-kernel-server

log "══ [4/4] Firewall — permisos NFS estrictos ══"
ufw allow from "${BACKEND_IP}" to any port 2049 proto tcp comment "NFS desde Backend"
ufw allow from "${BACKEND_IP}" to any port 111  proto tcp comment "RPC desde Backend"
ufw allow from "${DB_IP}"      to any port 2049 proto tcp comment "NFS desde DB"
ufw allow from "${DB_IP}"      to any port 111  proto tcp comment "RPC desde DB"

# Script de alerta de disco lleno (cron diario)
cat > /etc/cron.daily/check-disk-storage << 'CRON'
#!/bin/bash
USAGE=$(df /srv/muni --output=pcent | tail -1 | tr -d ' %')
if [ "$USAGE" -gt 85 ]; then
    echo "[ALERTA $(date)] Disco Storage al ${USAGE}%" >> /var/log/muni-disk-alert.log
fi
find /srv/muni/logs -name "*.log" -mtime +30 -delete 2>/dev/null || true
CRON
chmod +x /etc/cron.daily/check-disk-storage

echo ""
log "════════════════════════════════════════════"
log "  VM STORAGE configurada exitosamente"
log "  Shares disponibles:"
log "    ${THIS_IP}:/srv/muni/uploads  → Backend (.22)"
log "    ${THIS_IP}:/srv/muni/backups  → DB (.23)"
log "    ${THIS_IP}:/srv/muni/logs     → Backend (.22)"
log ""
log "  Verifica con: showmount -e ${THIS_IP}"
log "════════════════════════════════════════════"
