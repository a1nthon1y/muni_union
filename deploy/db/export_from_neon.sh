#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  EXPORTAR BASE DE DATOS DESDE NEON → ARCHIVO LOCAL
#  Ejecutar en tu PC Windows (Git Bash / PowerShell con pg_dump)
#  o desde cualquier máquina con acceso a internet y psql instalado
#
#  Resultado: genera 2 archivos en la carpeta actual:
#    - neon_schema_only.sql   → Solo estructura de tablas (sin datos)
#    - neon_full_backup.sql.gz → Esquema + TODOS los datos actuales
# ═══════════════════════════════════════════════════════════════════

# ── Credenciales Neon (las de tu .env actual) ──────────────────────
NEON_HOST="ep-divine-frog-anq5cr5v-pooler.c-6.us-east-1.aws.neon.tech"
NEON_PORT="5432"
NEON_USER="neondb_owner"
NEON_PASS="npg_1zGxC3VsWqQH"
NEON_DB="neondb"
NEON_URL="postgresql://${NEON_USER}:${NEON_PASS}@${NEON_HOST}/${NEON_DB}?sslmode=require"

DATE=$(date +"%Y%m%d_%H%M%S")

echo "════════════════════════════════════════════"
echo "  Exportando desde Neon..."
echo "  Host: $NEON_HOST"
echo "════════════════════════════════════════════"

echo ""
echo "[1/2] Exportando SOLO ESQUEMA (estructura de tablas, sin datos)..."
pg_dump \
  --no-owner \
  --no-privileges \
  --schema-only \
  "$NEON_URL" \
  -f "neon_schema_only_${DATE}.sql"
echo "  ✔ Creado: neon_schema_only_${DATE}.sql"

echo ""
echo "[2/2] Exportando BACKUP COMPLETO (esquema + todos los datos)..."
pg_dump \
  --no-owner \
  --no-privileges \
  "$NEON_URL" \
  | gzip > "neon_full_backup_${DATE}.sql.gz"
echo "  ✔ Creado: neon_full_backup_${DATE}.sql.gz"

echo ""
echo "════════════════════════════════════════════"
echo "  EXPORTACIÓN COMPLETADA"
echo ""
echo "  Archivos generados:"
ls -lh neon_*_${DATE}.*
echo ""
echo "  SIGUIENTE PASO:"
echo "  Copiar neon_full_backup_${DATE}.sql.gz a la VM DB:"
echo "  scp neon_full_backup_${DATE}.sql.gz deploy@172.16.3.23:/tmp/"
echo "════════════════════════════════════════════"
