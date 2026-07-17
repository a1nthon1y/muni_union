#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  SCRIPT BASE — Hardening Debian 12
#  Ejecutar como ROOT en TODAS las VMs antes de su script específico
#  Municipalidad Distrital La Unión — Sistema de Registro Civil
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }

[ "$EUID" -ne 0 ] && err "Ejecutar como root: sudo bash $0"

log "══ [1/7] Actualizando sistema ══"
apt update && apt upgrade -y

log "══ [2/7] Instalando paquetes esenciales ══"
apt install -y \
  sudo ufw fail2ban curl wget gnupg lsb-release ca-certificates \
  unattended-upgrades logrotate htop net-tools rsync \
  qemu-guest-agent openssh-server

systemctl enable --now qemu-guest-agent

log "══ [3/7] Creando usuario 'deploy' ══"
if ! id deploy &>/dev/null; then
  useradd -m -s /bin/bash -G sudo deploy
  echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
  chmod 0440 /etc/sudoers.d/deploy
  warn "Usuario 'deploy' creado. Establece su contraseña: passwd deploy"
fi

log "══ [4/7] Hardening SSH ══"
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
PermitRootLogin no
MaxAuthTries 3
PubkeyAuthentication yes
X11Forwarding no
AllowUsers deploy
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
systemctl restart sshd

log "══ [5/7] Configurando UFW ══"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow from 172.16.3.0/24 to any port 22 proto tcp comment "SSH LAN"
echo "y" | ufw enable

log "══ [6/7] Configurando Fail2Ban ══"
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 3
backend  = systemd

[sshd]
enabled  = true
maxretry = 3
EOF
systemctl enable --now fail2ban

log "══ [7/7] Parámetros de Kernel (sysctl) ══"
cat > /etc/sysctl.d/99-hardening.conf << 'EOF'
net.ipv4.tcp_syncookies          = 1
net.ipv4.conf.all.rp_filter      = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects   = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv6.conf.all.disable_ipv6    = 1
net.ipv6.conf.default.disable_ipv6 = 1
EOF
sysctl -p /etc/sysctl.d/99-hardening.conf

echo ""
log "════════════════════════════════════════════"
log "  Hardening base completado exitosamente"
log "  Ahora ejecuta el script específico de"
log "  esta VM (setup_frontend, setup_backend, etc.)"
log "════════════════════════════════════════════"
