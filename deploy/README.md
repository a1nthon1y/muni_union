# 🚀 Guía de Despliegue en Producción
## Sistema de Registro Civil — Municipalidad Distrital La Unión
### Arquitectura 4 VMs en Proxmox (Debian 12)

---

## 🗺️ Mapa de IPs

| VM | IP | Función |
|---|---|---|
| **Frontend** | `172.16.3.21` | Nginx + Next.js (interfaz web) |
| **Backend**  | `172.16.3.22` | Express.js API REST |
| **PostgreSQL**| `172.16.3.23` | Base de Datos |
| **Storage**  | `172.16.3.24` | Archivos NFS + Backups |

---

## 📋 Orden de Instalación (¡respetar este orden!)

```
1. VM Storage  (.24)  ← primero, no depende de nada
2. VM PostgreSQL (.23) ← segundo, se conecta a Storage
3. VM Backend  (.22)  ← tercero, se conecta a DB y Storage
4. VM Frontend (.21)  ← último, se conecta a Backend
```

---

## ⚡ Paso a Paso

### En TODAS las VMs (ejecutar primero)

```bash
# Transferir y ejecutar el script de hardening base
scp deploy/00_base_hardening.sh root@172.16.3.XX:/tmp/
ssh root@172.16.3.XX "bash /tmp/00_base_hardening.sh"
```

---

### 1️⃣ VM Storage — 172.16.3.24

```bash
scp deploy/storage/01_setup_storage.sh root@172.16.3.24:/tmp/
ssh root@172.16.3.24 "bash /tmp/01_setup_storage.sh"

# Verificar que los shares estén disponibles:
ssh deploy@172.16.3.24 "showmount -e 172.16.3.24"
```

---

### 2️⃣ VM PostgreSQL — 172.16.3.23

```bash
scp deploy/db/02_setup_postgresql.sh root@172.16.3.23:/tmp/
ssh root@172.16.3.23 "bash /tmp/02_setup_postgresql.sh"

# Inicializar la base (elegir UNO):

# Opción A — instalación limpia (recomendado en servidor nuevo):
scp -r deploy/db deploy@172.16.3.23:/opt/muni_union/deploy/
ssh deploy@172.16.3.23 "bash /opt/muni_union/deploy/db/init_db.sh limpia"

# Opción B — migraciones SQL del repo (en orden numérico):
scp back/src/migrations/*.sql deploy@172.16.3.23:/tmp/
ssh deploy@172.16.3.23 "
  for f in /tmp/000_schema.sql /tmp/001_refresh_tokens.sql /tmp/002_indexes.sql \
           /tmp/003_usuario_permisos.sql /tmp/004_usuario_permisos_modificar.sql \
           /tmp/005_seed_data.sql; do
    [ -f \"\$f\" ] && psql -h 172.16.3.23 -U app_user -d registro_muni_union -f \"\$f\"
  done
"
```

> ⚠️ **IMPORTANTE:** Editar la contraseña de `app_user` en el script antes de ejecutarlo.

---

### 3️⃣ VM Backend — 172.16.3.22

```bash
scp deploy/backend/03_setup_backend.sh root@172.16.3.22:/tmp/
ssh root@172.16.3.22 "bash /tmp/03_setup_backend.sh"

# Clonar el repositorio (directorio debe estar vacío)
ssh deploy@172.16.3.22 "git clone https://github.com/a1nthon1y/muni_union.git /opt/muni_union"
ssh root@172.16.3.22 "cp /root/muni_union.env.backend /opt/muni_union/.env.backend && chown deploy:deploy /opt/muni_union/.env.backend"

# Editar el .env del backend con las credenciales reales
ssh deploy@172.16.3.22 "nano /opt/muni_union/.env.backend"

# Levantar el contenedor
ssh deploy@172.16.3.22 "
  cd /opt/muni_union
  docker compose -f deploy/docker-compose.backend.yml up -d --build
"

# Verificar que la API responde
curl http://172.16.3.22:4000/api/health
```

---

### 4️⃣ VM Frontend — 172.16.3.21

```bash
scp deploy/frontend/04_setup_frontend.sh root@172.16.3.21:/tmp/
ssh root@172.16.3.21 "bash /tmp/04_setup_frontend.sh"

# Clonar el repositorio
ssh deploy@172.16.3.21 "git clone https://github.com/a1nthon1y/muni_union.git /opt/muni_union"
ssh root@172.16.3.21 "cp /root/muni_union.env.frontend /opt/muni_union/.env.frontend && chown deploy:deploy /opt/muni_union/.env.frontend"

# Levantar el contenedor de Next.js
ssh deploy@172.16.3.21 "
  cd /opt/muni_union
  docker compose -f deploy/docker-compose.frontend.yml up -d --build
"

# Verificar Nginx
ssh deploy@172.16.3.21 "nginx -t && systemctl status nginx"
```

---

## 🛠️ Problemas frecuentes

### Health `/api/health` → 503 y logs: `pg_hba.conf rejects ... no encryption`

PostgreSQL en `.23` solo acepta conexiones **SSL** (`hostssl` en `pg_hba.conf`). El backend debe tener **`DB_SSL=true`** en `/opt/muni_union/.env.backend`.

En la VM **172.16.3.22** (usuario `deploy`):

```bash
grep DB_SSL /opt/muni_union/.env.backend
# Debe mostrar: DB_SSL=true

cd /opt/muni_union
docker compose -f deploy/docker-compose.backend.yml up -d --force-recreate
curl -f http://172.16.3.22:4000/api/health
```

Si `DB_SSL` está bien pero sigue fallando, confirma que el contenedor recibe las variables:

```bash
docker exec union_api printenv | grep -E '^DB_'
```

Si no aparecen `DB_HOST`, `DB_PASSWORD`, etc., el `env_file` del compose no está cargando (usa la versión corregida del repo con `../.env.backend`).

### No puedo entrar por SSH como `root`

Es normal después de `00_base_hardening.sh` (`PermitRootLogin no`, solo usuario `deploy`).

---

## ✅ Verificación Final

Desde cualquier PC de la red municipal:

1. Abrir `https://172.16.3.21` en el navegador → Debe aparecer el login del sistema
2. Ingresar con las credenciales por defecto (cambiarlas inmediatamente)
3. Verificar `https://172.16.3.21/api/health` → debe responder `{"status":"ok","services":{"db":"ok"}}`

---

## 🔄 Actualizar la aplicación (después del primer despliegue)

```bash
# En VM Backend:
ssh deploy@172.16.3.22 "cd /opt/muni_union && bash deploy/deploy.sh backend"

# En VM Frontend:
ssh deploy@172.16.3.21 "cd /opt/muni_union && bash deploy/deploy.sh frontend"
```

---

## 💾 Restaurar Base de Datos desde Backup

```bash
ssh deploy@172.16.3.23 "bash /opt/muni_union/deploy/db/restore_db.sh"
```

---

## 📊 Monitoreo de salud

```bash
# Desde VM Frontend (ver estado de todas las VMs):
ssh deploy@172.16.3.21 "bash /opt/muni_union/deploy/health_check.sh"
```

---

## 🔐 Credenciales por defecto (CAMBIAR INMEDIATAMENTE)

| Campo | Valor |
|---|---|
| Usuario | `aespinoza` |
| Contraseña | `123456` |

---

## 📁 Estructura de archivos generados

```
deploy/
├── 00_base_hardening.sh          ← Ejecutar en TODAS las VMs (primero)
├── storage/
│   └── 01_setup_storage.sh       ← VM Storage (.24)
├── db/
│   ├── 02_setup_postgresql.sh    ← VM PostgreSQL (.23)
│   └── restore_db.sh             ← Restaurar BD desde backup
├── backend/
│   └── 03_setup_backend.sh       ← VM Backend (.22)
├── frontend/
│   └── 04_setup_frontend.sh      ← VM Frontend (.21)
├── docker-compose.backend.yml    ← Docker del Backend
├── docker-compose.frontend.yml   ← Docker del Frontend
├── deploy.sh                     ← Script de actualización
└── health_check.sh               ← Monitor de salud
```
