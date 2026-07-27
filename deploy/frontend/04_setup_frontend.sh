#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  VM FRONTEND — 172.16.3.21
#  Nginx + Next.js (Docker)
#  Se configura ÚLTIMO
#  Municipalidad Distrital La Unión — Sistema de Registro Civil
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }

[ "$EUID" -ne 0 ] && err "Ejecutar como root: sudo bash $0"

THIS_IP="172.16.3.21"
BACKEND_IP="172.16.3.22"
PUBLIC_DOMAIN="verificar.muniunion.gob.pe"

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
               docker-buildx-plugin docker-compose-plugin nginx
usermod -aG docker deploy
systemctl enable docker

log "══ [2/5] Generando certificados SSL ══"
mkdir -p /etc/nginx/ssl/{internal,public}

# Certificado INTERNO (red municipal → sistema completo)
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/internal/key.pem \
  -out    /etc/nginx/ssl/internal/cert.pem \
  -subj   "/CN=${THIS_IP}/O=Municipalidad La Union/OU=Sistema Interno"

# Certificado PÚBLICO (internet → solo portal de verificación)
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/public/key.pem \
  -out    /etc/nginx/ssl/public/cert.pem \
  -subj   "/CN=${PUBLIC_DOMAIN}/O=Municipalidad La Union/OU=Portal Publico"

log "══ [3/5] Instalando configuración Nginx ══"
# Debian incluye sites-enabled/* dentro del bloque http de nginx.conf.
# Upstreams y limit_req van en conf.d; sites-available solo bloques server.

cat > /etc/nginx/conf.d/muni-union-upstreams.conf << NGINX_HTTP
upstream frontend { server 127.0.0.1:3000; keepalive 32; }
upstream backend  { server ${BACKEND_IP}:4000; keepalive 32; }

limit_req_zone \$binary_remote_addr zone=public:10m rate=10r/s;

# Carga masiva / digitalización: Excel+ZIP y PDFs grandes
client_max_body_size 500M;
client_body_timeout 300s;
proxy_connect_timeout 15s;
proxy_send_timeout 360s;
proxy_read_timeout 360s;
send_timeout 360s;

proxy_http_version 1.1;
proxy_set_header Host              \$host;
proxy_set_header X-Real-IP         \$remote_addr;
proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
NGINX_HTTP

cat > /etc/nginx/sites-available/muni-union << NGINX_CONF
    # ── HTTP → HTTPS redirect ──────────────────────────────────
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        return 301 https://\$host\$request_uri;
    }

    # ── SISTEMA INTERNO (red municipal, acceso completo) ───────
    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name ${THIS_IP};

        ssl_certificate     /etc/nginx/ssl/internal/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/internal/key.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_session_cache   shared:SSL_INT:10m;

        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;

        allow 172.16.0.0/16;
        allow 192.168.0.0/16;
        deny all;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Upgrade    \$http_upgrade;
            proxy_set_header Connection 'upgrade';
        }

        location /api/ {
            proxy_pass http://backend;
        }

        location /uploads/ {
            proxy_pass http://backend;
        }

        location = /Logo_MDUnion.svg {
            proxy_intercept_errors on;
            error_page 404 = @frontend_logo;
            add_header Cache-Control "no-store, max-age=0" always;
            proxy_pass http://backend;
        }

        location = /Logo_blanco.svg {
            proxy_intercept_errors on;
            error_page 404 = @frontend_logo;
            add_header Cache-Control "no-store, max-age=0" always;
            proxy_pass http://backend;
        }

        location @frontend_logo {
            add_header Cache-Control "no-store, max-age=0" always;
            proxy_pass http://frontend;
        }
    }

    # ── PORTAL PÚBLICO (internet, solo verificación) ───────────
    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name ${PUBLIC_DOMAIN};

        ssl_certificate     /etc/nginx/ssl/public/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/public/key.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options "DENY" always;

        location ~ ^/verificar(/.*)?$ {
            limit_req zone=public burst=20 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Upgrade    \$http_upgrade;
            proxy_set_header Connection 'upgrade';
        }

        location ~ ^/_next/ { proxy_pass http://frontend; }

        location = /favicon.ico {
            proxy_pass http://frontend;
        }

        location = /Logo_MDUnion.svg {
            proxy_intercept_errors on;
            error_page 404 = @frontend_logo;
            add_header Cache-Control "no-store, max-age=0" always;
            proxy_pass http://backend;
        }

        location = /Logo_blanco.svg {
            proxy_intercept_errors on;
            error_page 404 = @frontend_logo;
            add_header Cache-Control "no-store, max-age=0" always;
            proxy_pass http://backend;
        }

        location @frontend_logo {
            add_header Cache-Control "no-store, max-age=0" always;
            proxy_pass http://frontend;
        }

        location ~ ^/api/verificar/ {
            limit_req zone=public burst=10 nodelay;
            proxy_pass http://backend;
        }

        location / {
            default_type application/json;
            return 403 '{"error":"Acceso no autorizado"}';
        }
    }
NGINX_CONF

ln -sf /etc/nginx/sites-available/muni-union /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx

log "══ [4/5] Firewall — solo 80/443 al mundo ══"
ufw allow 80/tcp  comment "HTTP"
ufw allow 443/tcp comment "HTTPS"

log "══ [5/5] Plantilla de entorno de producción ══"
cat > /root/muni_union.env.frontend << EOF
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://${THIS_IP}/api
EOF
chmod 600 /root/muni_union.env.frontend

echo ""
log "════════════════════════════════════════════"
log "  VM FRONTEND configurada exitosamente"
log ""
log "  Nginx activo y escuchando en :80 y :443"
log "  Sistema interno:  https://${THIS_IP}"
log "  Portal público:   https://${PUBLIC_DOMAIN}"
log ""
warn "  PENDIENTE (en este orden):"
warn "  1. git clone https://github.com/a1nthon1y/muni_union.git /opt/muni_union"
warn "  2. sudo cp /root/muni_union.env.frontend /opt/muni_union/.env.frontend && sudo chown deploy:deploy /opt/muni_union/.env.frontend"
warn "  3. cd /opt/muni_union && docker compose -f deploy/docker-compose.frontend.yml up -d --build"
log "════════════════════════════════════════════"
