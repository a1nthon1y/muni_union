#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  MONITOR DE SALUD — Registro Civil Municipalidad La Unión
#  Ejecutar desde cualquier VM de la red
#  Crontab: */5 * * * * /opt/scripts/health_check.sh >> /var/log/muni-health.log 2>&1
# ═══════════════════════════════════════════════════════════════════

FRONTEND_IP="172.16.3.21"
BACKEND_IP="172.16.3.22"
DB_IP="172.16.3.23"
STORAGE_IP="172.16.3.24"
LOG_FILE="/var/log/muni-health.log"
ALERT=false

check_tcp() {
  local name=$1 host=$2 port=$3
  if nc -z -w3 "$host" "$port" 2>/dev/null; then
    echo "[OK]   ${name} (${host}:${port})"
  else
    echo "[FAIL] ${name} (${host}:${port}) — $(date '+%Y-%m-%d %H:%M:%S')"
    ALERT=true
  fi
}

check_http() {
  local name=$1 url=$2
  if curl -skf "$url" -o /dev/null --max-time 5; then
    echo "[OK]   ${name} (${url})"
  else
    echo "[FAIL] ${name} (${url}) — $(date '+%Y-%m-%d %H:%M:%S')"
    ALERT=true
  fi
}

echo "─── Health Check $(date '+%Y-%m-%d %H:%M:%S') ───" >> "$LOG_FILE"

{
  check_tcp  "Nginx Frontend"   "$FRONTEND_IP" 443
  check_tcp  "Express Backend"  "$BACKEND_IP"  4000
  check_tcp  "PostgreSQL DB"    "$DB_IP"       5432
  check_tcp  "NFS Storage"      "$STORAGE_IP"  2049
  check_http "API Health"       "https://${FRONTEND_IP}/api/health"
  check_http "Portal Público"   "https://${FRONTEND_IP}/verificar"
} | tee -a "$LOG_FILE"

if [ "$ALERT" = true ]; then
  echo "[⚠ ALERTA] Uno o más servicios caídos — $(date)" >> "$LOG_FILE"
fi

# Mantener log de 7 días
find "$(dirname $LOG_FILE)" -name "muni-health*.log" -mtime +7 -delete 2>/dev/null || true
