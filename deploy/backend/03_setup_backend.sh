#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  VM BACKEND — 172.16.3.22
#  API REST Node.js + Express (Docker)
#  Se configura TERCERO
#  Municipalidad Distrital La Unión — Sistema de Registro Civil
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }

[ "$EUID" -ne 0 ] && err "Ejecutar como root: sudo bash $0"

THIS_IP="172.16.3.22"
FRONTEND_IP="172.16.3.21"
DB_IP="172.16.3.23"
STORAGE_IP="172.16.3.24"

log "══ [1/5] Instalando Docker CE ══"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io \
               docker-buildx-plugin docker-compose-plugin
usermod -aG docker deploy
systemctl enable docker

log "══ [2/5] Montando NFS de uploads y logs desde Storage ══"
apt install -y nfs-common

mkdir -p /mnt/uploads /mnt/logs
echo "${STORAGE_IP}:/srv/muni/uploads  /mnt/uploads  nfs  defaults,_netdev,nofail  0  0" >> /etc/fstab
echo "${STORAGE_IP}:/srv/muni/logs     /mnt/logs     nfs  defaults,_netdev,nofail  0  0" >> /etc/fstab
mount -a || warn "Asegúrate que la VM Storage (.24) esté encendida"

log "══ [3/5] Creando estructura del proyecto ══"
# Solo el directorio raíz: git clone requiere destino vacío (no crear subcarpetas aquí)
mkdir -p /opt/muni_union
chown deploy:deploy /opt/muni_union

log "══ [4/5] Firewall ══"
# Solo acepta peticiones del Frontend (.21) al puerto 4000
ufw allow from "${FRONTEND_IP}" to any port 4000 proto tcp \
  comment "API Backend desde Frontend"
# NO abrir al exterior: Nginx en el Frontend hace de proxy

log "══ [5/5] Plantilla de entorno de producción ══"
cat > /root/muni_union.env.backend << EOF
# ─────────────────────────────────────────────
# BACKEND ENV — Registro Civil Municipalidad La Unión
# COMPLETAR antes de levantar el contenedor
# ─────────────────────────────────────────────

NODE_ENV=production
PORT=4000

# Base de Datos (VM .23)
DB_HOST=${DB_IP}
DB_PORT=5432
DB_USER=app_user
DB_PASSWORD=CAMBIAR_POR_PASSWORD_SEGURO_AQUI
DB_NAME=registro_muni_union
DB_SSL=true

# JWT — generar con: openssl rand -base64 64
JWT_SECRET=GENERAR_SECRETO_LARGO_AQUI
REFRESH_TOKEN_SECRET=GENERAR_OTRO_SECRETO_AQUI

# CORS — solo el Frontend puede consumir la API
FRONTEND_URL=https://${FRONTEND_IP}

# Auditoría
AUDIT_RETENTION_DAYS=730
EOF

chmod 600 /root/muni_union.env.backend

echo ""
log "════════════════════════════════════════════"
log "  VM BACKEND configurada exitosamente"
log ""
log "  Docker instalado y listo"
log "  NFS montado: /mnt/uploads → ${STORAGE_IP}:/srv/muni/uploads"
log "  NFS montado: /mnt/logs    → ${STORAGE_IP}:/srv/muni/logs"
log ""
warn "  PENDIENTE (en este orden):"
warn "  1. Como 'deploy': git clone https://github.com/a1nthon1y/muni_union.git /opt/muni_union"
warn "  2. sudo cp /root/muni_union.env.backend /opt/muni_union/.env.backend && sudo chown deploy:deploy /opt/muni_union/.env.backend"
warn "  3. Editar /opt/muni_union/.env.backend (DB_PASSWORD y JWT deben coincidir con PostgreSQL)"
warn "  4. cd /opt/muni_union && docker compose -f deploy/docker-compose.backend.yml up -d --build"
log "════════════════════════════════════════════"
