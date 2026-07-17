#!/bin/bash
# ─────────────────────────────────────────────────────────
# Hardening base — ejecutar como root en cada VM Debian 12
# ─────────────────────────────────────────────────────────
set -euo pipefail

echo "══════ [1/8] Actualizar sistema ══════"
apt update && apt upgrade -y

echo "══════ [2/8] Instalar paquetes esenciales ══════"
apt install -y \
  sudo ufw fail2ban curl wget gnupg lsb-release ca-certificates \
  unattended-upgrades apt-listchanges logrotate htop \
  qemu-guest-agent net-tools rsync

echo "══════ [3/8] Configurar usuario deploy ══════"
if ! id deploy &>/dev/null; then
  useradd -m -s /bin/bash -G sudo deploy
  echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
  chmod 0440 /etc/sudoers.d/deploy
fi

echo "══════ [4/8] Hardening SSH ══════"
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

cat > /etc/ssh/sshd_config.d/hardening.conf << 'EOF'
PubkeyAuthentication yes
PermitRootLogin no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowUsers deploy
Protocol 2
EOF

systemctl restart sshd

echo "══════ [5/8] Configurar Firewall (UFW) ══════"
ufw default deny incoming
ufw default allow outgoing
ufw allow from 172.16.3.0/24 to any port 22 proto tcp comment "SSH solo red interna"
echo "y" | ufw enable

echo "══════ [6/8] Configurar Fail2Ban ══════"
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 3
bantime = 3600
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo "══════ [7/8] Configurar actualizaciones automáticas ══════"
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

echo "══════ [8/8] Parámetros de kernel (sysctl) ══════"
cat > /etc/sysctl.d/99-hardening.conf << 'EOF'
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.log_martians = 1
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
EOF

sysctl -p /etc/sysctl.d/99-hardening.conf

echo "══════ Hardening base completado ══════"
