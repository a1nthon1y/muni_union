# Manual de Instalación — Sistema de Registro Civil
**Municipalidad Distrital de La Unión — Piura, Perú**  
Versión 1.3.0 | Julio 2026

---

## A quién va dirigido

Este manual es para el técnico que debe **instalar o reinstalar** el sistema en las cuatro máquinas virtuales de producción (Debian 12 sobre Proxmox).

Si el sistema **ya está instalado** y solo necesita operarlo día a día, use el **Manual Técnico**.  
Si necesita consumir la API desde otro sistema, use el **Manual de Integración API**.

---

## 1. Qué se va a instalar (visión simple)

Se crean **4 servidores virtuales (VM)**. Cada uno tiene una función:

| VM | IP | Función en palabras simples |
|---|---|---|
| Frontend | `172.16.3.21` | Pantalla web + Nginx (entrada HTTPS) |
| Backend | `172.16.3.22` | API (lógica del sistema) |
| PostgreSQL | `172.16.3.23` | Base de datos |
| Storage | `172.16.3.24` | Disco compartido (PDF, logs, backups) |

**Orden obligatorio de instalación / encendido:**

1. Storage `.24`
2. PostgreSQL `.23`
3. Backend `.22`
4. Frontend `.21`

Si enciende al revés, el Backend no encontrará la base o el disco compartido.

---

## 2. Diagrama de red

```
 Usuarios (red municipal)
        │ HTTPS :443
        ▼
 Frontend 172.16.3.21  (Nginx + Docker union_web)
        │ API
        ▼
 Backend 172.16.3.22   (Docker union_api :4000)
        │ SSL SQL          │ NFS
        ▼                  ▼
 PostgreSQL .23         Storage .24
```

---

## 3. Preparación en todas las VMs

En cada VM Debian nueva, endurecer el sistema:

```bash
scp deploy/00_base_hardening.sh root@172.16.3.XX:/tmp/
ssh root@172.16.3.XX "bash /tmp/00_base_hardening.sh"
```

Después se trabaja con el usuario `deploy` (no con root por SSH, salvo que lo hayan dejado habilitado a propósito).

---

## 4. VM Storage — `172.16.3.24`

```bash
scp deploy/storage/01_setup_storage.sh deploy@172.16.3.24:/tmp/
ssh deploy@172.16.3.24 "sudo bash /tmp/01_setup_storage.sh"

showmount -e 172.16.3.24
```

Debe publicar carpetas NFS para uploads/logs (Backend) y backups (PostgreSQL).

---

## 5. VM PostgreSQL — `172.16.3.23`

```bash
scp deploy/db/02_setup_postgresql.sh deploy@172.16.3.23:/tmp/
ssh deploy@172.16.3.23 "sudo bash /tmp/02_setup_postgresql.sh"
```

Inicializar base (instalación limpia recomendada):

```bash
scp -r deploy/db deploy@172.16.3.23:/opt/muni_union/deploy/
ssh deploy@172.16.3.23 "bash /opt/muni_union/deploy/db/init_db.sh limpia"
```

O aplicar migraciones en orden: `000` … `006` desde `back/src/migrations/`.

**Importante:** PostgreSQL exige SSL (`hostssl`). El Backend debe tener `DB_SSL=true`.

### Credenciales de base de datos (producción actual)

| Dato | Valor |
|---|---|
| Host | `172.16.3.23` |
| Puerto | `5432` |
| Base | `registro_muni_union` |
| Usuario | `app_user` |
| Contraseña | `muniunion2026_prod` |
| SSL | `true` (obligatorio) |

Prueba:

```bash
psql -h 172.16.3.23 -p 5432 -U app_user -d registro_muni_union
# Contraseña: muniunion2026_prod
```

---

## 6. VM Backend — `172.16.3.22`

```bash
scp deploy/backend/03_setup_backend.sh deploy@172.16.3.22:/tmp/
ssh deploy@172.16.3.22 "sudo bash /tmp/03_setup_backend.sh"

ssh deploy@172.16.3.22 "git clone https://github.com/a1nthon1y/muni_union.git /opt/muni_union"

sudo cp /root/muni_union.env.backend /opt/muni_union/.env.backend
sudo chown deploy:deploy /opt/muni_union/.env.backend
nano /opt/muni_union/.env.backend
```

### Contenido mínimo real de `.env.backend` (producción)

```env
NODE_ENV=production
PORT=4000

DB_HOST=172.16.3.23
DB_PORT=5432
DB_NAME=registro_muni_union
DB_USER=app_user
DB_PASSWORD=muniunion2026_prod
DB_SSL=true

FRONTEND_URL=https://172.16.3.21

# Generar con: openssl rand -base64 64
JWT_SECRET=<secreto_largo>
REFRESH_TOKEN_SECRET=<otro_secreto_diferente>
```

Levantar:

```bash
cd /opt/muni_union
docker compose -f deploy/docker-compose.backend.yml up -d --build
curl -f http://172.16.3.22:4000/api/health
# Esperado: "status":"ok" y "services":{"db":"ok"}
```

Si falla con `pg_hba.conf ... no encryption`, revise que `DB_SSL=true` esté dentro del contenedor.

---

## 7. VM Frontend — `172.16.3.21`

```bash
scp deploy/frontend/04_setup_frontend.sh deploy@172.16.3.21:/tmp/
ssh deploy@172.16.3.21 "sudo bash /tmp/04_setup_frontend.sh"

ssh deploy@172.16.3.21 "git clone https://github.com/a1nthon1y/muni_union.git /opt/muni_union"

sudo cp /root/muni_union.env.frontend /opt/muni_union/.env.frontend
sudo chown deploy:deploy /opt/muni_union/.env.frontend
```

### `.env.frontend` (producción)

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://172.16.3.21/api
```

Levantar:

```bash
cd /opt/muni_union
docker compose -f deploy/docker-compose.frontend.yml up -d --build
sudo nginx -t && sudo systemctl restart nginx
```

### Nginx para carga masiva (debe quedar así en producción)

En `/etc/nginx/conf.d/muni-union-upstreams.conf`:

- `client_max_body_size 500M`
- timeouts de proxy ≥ 360s
- upstream Backend → `172.16.3.22:4000`

En el server interno: `location /api/` y `location /uploads/` hacia el Backend.

---

## 8. Usuario administrador de la aplicación

Tras la instalación limpia / seed:

| Campo | Valor |
|---|---|
| Usuario | `aespinoza` |
| Contraseña | `123456` |

Cambiarla al primer ingreso. Crear el resto de usuarios desde el menú **Usuarios**.

Aplicar también la migración de configuración (URL de verificación por defecto = IP):

```bash
psql -h 172.16.3.23 -p 5432 -U app_user -d registro_muni_union \
  -f /opt/muni_union/back/src/migrations/006_configuracion_sistema.sql
```

---

## 9. Verificación final del despliegue

1. Abrir `https://172.16.3.21` → pantalla de login.
2. `curl -skf https://172.16.3.21/api/health` → ok + db ok.
3. `curl -f http://172.16.3.22:4000/api/health` → ok + db ok.
4. Login `aespinoza` / `123456` → cambiar contraseña.
5. Menú **Configuración** → URL `https://172.16.3.21`.
6. Probar `https://172.16.3.21/verificar`.
7. Probar Backup BD y/o `pg_dump` en `.23`.

---

## 10. Actualizaciones posteriores

```bash
# En .22
cd /opt/muni_union && git pull && bash deploy/deploy.sh backend

# En .21
cd /opt/muni_union && git pull && bash deploy/deploy.sh frontend
```

No use `deploy.sh all` en una sola VM.

---

## 11. Backups después de instalar

- Automático (si el cron del setup DB está activo): script en VM `.23` hacia `/mnt/backups`.
- Manual: ver Manual Técnico (sección backups), con `pg_dump` o pantalla **Backup BD**.
