#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  SCRIPT DE DESPLIEGUE — actualizar y/o restaurar la aplicación
#  Ejecutar desde /opt/muni_union como usuario 'deploy'
#  Funciona para: VM Backend (.22) y VM Frontend (.21)
#  Uso:
#    Desplegar Backend:  bash deploy.sh backend
#    Desplegar Frontend: bash deploy.sh frontend
#    Desplegar todo:     bash deploy.sh all
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }

TARGET="${1:-all}"
PROJECT_DIR="/opt/muni_union"

cd "$PROJECT_DIR" || err "No se encontró el directorio $PROJECT_DIR"

deploy_backend() {
  log "══ Desplegando Backend ══"
  git pull origin main
  docker compose -f deploy/docker-compose.backend.yml build --no-cache
  docker compose -f deploy/docker-compose.backend.yml up -d
  sleep 5
  docker compose -f deploy/docker-compose.backend.yml ps
  log "Backend desplegado. Verificando health..."
  curl -sf http://localhost:4000/api/health && log "API respondiendo correctamente" || \
    warn "API aún iniciando, espera 30s y vuelve a verificar"
}

deploy_frontend() {
  log "══ Desplegando Frontend ══"
  git pull origin main
  docker compose -f deploy/docker-compose.frontend.yml build --no-cache
  docker compose -f deploy/docker-compose.frontend.yml up -d
  sleep 10
  docker compose -f deploy/docker-compose.frontend.yml ps
  log "Frontend desplegado."
}

case "$TARGET" in
  backend)  deploy_backend  ;;
  frontend) deploy_frontend ;;
  all)      deploy_backend && deploy_frontend ;;
  *) err "Uso: $0 [backend|frontend|all]" ;;
esac

log "Despliegue completado: $(date)"
