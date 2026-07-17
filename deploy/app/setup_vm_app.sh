#!/bin/bash
# ─────────────────────────────────────────────────────────
# Configuración del servidor de aplicación — VM 172.16.3.21
# ─────────────────────────────────────────────────────────
set -euo pipefail

echo "══════ [1/5] Instalando Docker ══════"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker deploy
systemctl enable docker

echo "══════ [2/5] Instalando Nginx y Redis ══════"
apt install -y nginx redis-server

# Configurar Redis para escuchar solo en localhost
cp /etc/redis/redis.conf /etc/redis/redis.conf.bak
sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
sed -i 's/^# requirepass .*/requirepass CAMBIAR_PASSWORD_REDIS_SEGURO/' /etc/redis/redis.conf
systemctl restart redis-server

echo "══════ [3/5] Firewall ══════"
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"

echo "══════ [4/5] Creando estructura del proyecto ══════"
mkdir -p /opt/muni_union/uploads
chown -R deploy:deploy /opt/muni_union

echo "══════ [5/5] Generando certificados SSL autofirmados iniciales ══════"
mkdir -p /etc/nginx/ssl/{internal,public}

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/internal/key.pem \
  -out /etc/nginx/ssl/internal/cert.pem \
  -subj "/CN=172.16.3.21/O=Municipalidad La Union"

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/public/key.pem \
  -out /etc/nginx/ssl/public/cert.pem \
  -subj "/CN=verificar.muniunion.gob.pe/O=Municipalidad La Union"

echo "══════ Setup App completado ══════"
