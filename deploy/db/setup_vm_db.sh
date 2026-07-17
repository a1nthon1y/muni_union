#!/bin/bash
# ─────────────────────────────────────────────────────────
# Configuración PostgreSQL 15 — VM 172.16.3.22 (DB)
# ─────────────────────────────────────────────────────────
set -euo pipefail

echo "══════ Instalando PostgreSQL 15 ══════"
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/pgdg.gpg
apt update
apt install -y postgresql-15 postgresql-contrib-15

echo "══════ Creando directorios para backups y uploads ══════"
mkdir -p /srv/backups/{daily,weekly,monthly}
mkdir -p /srv/uploads-backup
chown -R deploy:deploy /srv/backups /srv/uploads-backup

echo "══════ Configurando PostgreSQL ══════"
cat > /etc/postgresql/15/main/conf.d/production.conf << 'EOF'
listen_addresses = '172.16.3.22'
port = 5432
max_connections = 100

shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB

wal_buffers = 64MB
checkpoint_completion_target = 0.9
min_wal_size = 1GB
max_wal_size = 4GB

logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_checkpoints = on

ssl = on
ssl_cert_file = '/etc/postgresql/15/main/server.crt'
ssl_key_file = '/etc/postgresql/15/main/server.key'
password_encryption = scram-sha-256

autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 60
EOF

cat > /etc/postgresql/15/main/pg_hba.conf << 'EOF'
local   all         postgres                       peer
local   all         all                            scram-sha-256
hostssl registro_muni_union  app_user  172.16.3.21/32  scram-sha-256
host    all         all         0.0.0.0/0          reject
EOF

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/postgresql/15/main/server.key \
  -out /etc/postgresql/15/main/server.crt \
  -subj "/CN=172.16.3.22/O=Muni La Union DB"
chown postgres:postgres /etc/postgresql/15/main/server.{key,crt}
chmod 0600 /etc/postgresql/15/main/server.key

systemctl restart postgresql

echo "══════ Creando base de datos y usuario ══════"
sudo -u postgres psql << 'SQL'
CREATE USER app_user WITH PASSWORD 'CAMBIAR_PASSWORD_SEGURO' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE registro_muni_union OWNER app_user;
\c registro_muni_union
CREATE EXTENSION IF NOT EXISTS pg_trgm;
GRANT CONNECT ON DATABASE registro_muni_union TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
SQL

echo "══════ Firewall — solo App puede acceder ══════"
ufw allow from 172.16.3.21 to any port 5432 proto tcp comment "PostgreSQL desde App"

echo "══════ Configuración completada ══════"
