# Manual Técnico — Sistema de Registro Civil
**Municipalidad Distrital de La Unión**
Versión 1.2.0 | Julio 2026

---

## 1. Descripción general

Sistema web para registros civiles (nacimiento, matrimonio, defunción), solicitudes de copias certificadas, digitalización, importación masiva, auditoría y verificación pública de constancias.

Dirigido a administradores del sistema e infraestructura.

**Cómo imprimir este manual:** abrir `MANUAL_TECNICO.html` en el navegador → **Ctrl+P** → Guardar como PDF o Imprimir.

---

## 2. Arquitectura de producción actual

```
 Usuarios LAN / portal verificación
             │ HTTPS :443
             ▼
 VM Frontend 172.16.3.21
 Nginx (host) → Next.js Docker (127.0.0.1:3000)  contenedor: union_web
             │ API :4000
             ▼
 VM Backend 172.16.3.22
 Express Docker (union_api) → NFS uploads/logs (VM .24)
             │ TLS PostgreSQL :5432
             ▼
 VM PostgreSQL 172.16.3.23
 PostgreSQL 15 → BD registro_muni_union → NFS backups (VM .24)
             │
             ▼
 VM Storage 172.16.3.24
 NFS: uploads, logs y backups
```

### 2.1 Componentes

| VM | IP | Servicio | Exposición |
|---|---|---|---|
| Frontend | `172.16.3.21` | Nginx Debian + Next.js Docker `union_web` | HTTPS 80/443; Next solo `127.0.0.1:3000` |
| Backend | `172.16.3.22` | Express Docker `union_api` | `172.16.3.22:4000` (desde Frontend) |
| PostgreSQL | `172.16.3.23` | PostgreSQL 15 TLS | `5432` (desde Backend) |
| Storage | `172.16.3.24` | NFS | Solo Backend y PostgreSQL |

### 2.2 URLs de producción actual

| Uso | URL |
|---|---|
| Sistema interno (login y operación) | `https://172.16.3.21` |
| API vía Nginx | `https://172.16.3.21/api` |
| Health Backend directo | `http://172.16.3.22:4000/api/health` |
| Verificación pública (activa por IP) | `https://172.16.3.21/verificar` |
| Ejemplo constancia | `https://172.16.3.21/verificar/000001` |
| Dominio público preparado en Nginx | `verificar.muniunion.gob.pe` (requiere DNS + certificado) |

### 2.3 Credenciales iniciales de aplicación

| Campo | Valor |
|---|---|
| Usuario admin | `aespinoza` |
| Contraseña inicial | `123456` |
| Base de datos | `registro_muni_union` |
| Usuario BD app | `app_user` |
| Ruta del código en VMs | `/opt/muni_union` |

Cambiar la contraseña del admin al primer ingreso. Crear el resto de usuarios desde el módulo **Usuarios**.

---

## 3. Orden de dependencia al arrancar

1. Storage `.24`
2. PostgreSQL `.23`
3. Backend `.22`
4. Frontend `.21`

---

## 4. Nginx de producción (VM Frontend `.21`)

Nginx corre en el **host Debian** (no en Docker). Next.js escucha solo en `127.0.0.1:3000` (`union_web`). La API está en `172.16.3.22:4000`.

### 4.1 Puertos y firewall

| Puerto | Uso |
|---|---|
| `80` | HTTP → redirige a HTTPS |
| `443` | HTTPS (sistema interno + portal público) |
| `3000` | Solo localhost (Next.js) |
| `4000` | Backend en `.22` (Nginx hace proxy) |

```bash
sudo ufw status
# Debe permitir 80/tcp y 443/tcp
sudo ss -tlnp | grep -E ':80|:443|:3000'
```

### 4.2 Archivos de configuración

| Archivo | Contenido |
|---|---|
| `/etc/nginx/conf.d/muni-union-upstreams.conf` | `upstream`, límites de cuerpo, timeouts de proxy |
| `/etc/nginx/sites-available/muni-union` | Bloques `server` (HTTP redirect, interno, público) |
| `/etc/nginx/sites-enabled/muni-union` | Enlace simbólico al anterior |

### 4.3 SSL / certificados

| Uso | Ruta | CN típico |
|---|---|---|
| Sistema interno (IP) | `/etc/nginx/ssl/internal/cert.pem` + `key.pem` | `172.16.3.21` |
| Portal público (dominio) | `/etc/nginx/ssl/public/cert.pem` + `key.pem` | `verificar.muniunion.gob.pe` |

Protocolos: TLS 1.2 / 1.3. El navegador puede advertir certificado autofirmado en la IP interna; es esperado hasta instalar un certificado institucional.

### 4.4 Acceso dual

| Entrada | `server_name` | Rutas |
|---|---|---|
| Sistema interno | `172.16.3.21` | App, `/api/*`, `/uploads/*`, `/verificar/*` |
| Portal público | `verificar.muniunion.gob.pe` | Solo `/verificar/*`, `/api/verificar/*`, `/_next/*` |

Producción actual opera por IP. Verificación ciudadana:

```
https://172.16.3.21/verificar
https://172.16.3.21/verificar/000001
```

### 4.5 Carga masiva (límites Nginx reales)

Para Excel/ZIP grandes, en `/etc/nginx/conf.d/muni-union-upstreams.conf` debe quedar:

```nginx
upstream frontend { server 127.0.0.1:3000; keepalive 32; }
upstream backend  { server 172.16.3.22:4000; keepalive 32; }

limit_req_zone $binary_remote_addr zone=public:10m rate=10r/s;

client_max_body_size 500M;
client_body_timeout 300s;
proxy_connect_timeout 15s;
proxy_send_timeout 360s;
proxy_read_timeout 360s;
send_timeout 360s;

proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

| Parámetro | Valor producción | Para qué |
|---|---|---|
| `client_max_body_size` | `500M` | Importación Excel/ZIP y uploads |
| `client_body_timeout` | `300s` | Subida de archivos grandes |
| `proxy_send_timeout` / `proxy_read_timeout` | `360s` (15 min) | Procesamiento largo de importación |
| Timeout Axios frontend | `600000` ms (10 min) | Espera de respuesta en carga masiva |

Después de editar:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4.6 Proxy de API y documentos

En el bloque interno (`server_name 172.16.3.21`) deben existir al menos:

```nginx
location / {
    proxy_pass http://frontend;
}

location /api/ {
    proxy_pass http://backend;
}

location /uploads/ {
    proxy_pass http://backend;
}
```

Sin `/uploads/`, las actas digitalizadas no se abren desde la interfaz aunque existan en NFS.

### 4.7 Configurar dominio público desde el sistema (por defecto = IP)

Menú admin → **Configuración**.

- **Valor por defecto de producción:** `https://172.16.3.21`
- Migración `006` y fallback del Backend usan esa IP si no hay valor en BD.
- Futuro dominio (ejemplo): `https://verificar.muniunion.gob.pe` (sin barra final)

La URL se imprime en constancias. **No** actualiza sola Nginx ni DNS.

Para activar un dominio real:

1. DNS del dominio → `172.16.3.21`
2. Editar `server_name` del bloque público en `/etc/nginx/sites-available/muni-union`
3. Certificado TLS en `/etc/nginx/ssl/public/`
4. `sudo nginx -t && sudo systemctl reload nginx`
5. Guardar la misma URL en **Configuración**

API:

```bash
GET /api/configuracion
PUT /api/configuracion/url-verificacion
{ "url_verificacion_publica": "https://172.16.3.21" }
```

Migración:

```bash
psql -U app_user -h 172.16.3.23 -d registro_muni_union \
  -f /opt/muni_union/back/src/migrations/006_configuracion_sistema.sql
```

---

## 5. Actualización de la aplicación

```bash
# Backend (.22)
cd /opt/muni_union
git pull
bash deploy/deploy.sh backend

# Frontend (.21)
cd /opt/muni_union
git pull
bash deploy/deploy.sh frontend
```

No usar `deploy.sh all` en una sola VM. `git pull` solo no reconstruye Next.js.

Si Docker falla al bajar `node:20-slim` por IPv6:

```bash
sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1
sudo systemctl restart docker
sudo docker pull node:20-slim
```

---

## 6. Salud del sistema

```bash
# Backend
curl -f http://172.16.3.22:4000/api/health

# Frontend vía Nginx
curl -skf https://172.16.3.21/api/health
sudo docker ps
sudo nginx -t
```

Respuesta esperada: `"status":"ok"` y `"services":{"db":"ok"}`.

---

## 7. Backups (varias formas)

### 7.1 Desde la aplicación (recomendado para admin de sistema)

1. Login como admin en `https://172.16.3.21`
2. Menú → **Backup BD**
3. Descargar `.sql`
4. Guardar en medio seguro

El backup usa las variables `DB_*` del Backend (`DB_HOST=172.16.3.23`, `DB_NAME=registro_muni_union`, `DB_SSL=true`). Con `postgresql-client` en la imagen Backend usa `pg_dump` completo.

### 7.2 Desde la VM PostgreSQL `.23` (recomendado para administrador de infraestructura)

```bash
ssh deploy@172.16.3.23

# Backup personalizado (recomendado para restauración)
sudo -u postgres pg_dump -Fc registro_muni_union \
  > /mnt/backups/manual_$(date +%F_%H%M).dump

# Backup SQL plano
sudo -u postgres pg_dump -Fp --no-owner --no-acl registro_muni_union \
  > /mnt/backups/manual_$(date +%F_%H%M).sql

# Listar backups
ls -lh /mnt/backups/
```

### 7.3 Restaurar

```bash
# Desde dump personalizado (.dump)
sudo -u postgres pg_restore -d registro_muni_union --clean --if-exists \
  /mnt/backups/manual_YYYY-MM-DD_HHMM.dump

# Desde SQL plano
sudo -u postgres psql -d registro_muni_union -f /mnt/backups/manual_YYYY-MM-DD_HHMM.sql
```

Antes de restaurar o migrar: siempre generar un backup nuevo.

---

## 8. Base de datos

### 8.1 Conexión

```bash
ssh deploy@172.16.3.23
sudo -u postgres psql -d registro_muni_union
# o
psql -U app_user -h 172.16.3.23 -d registro_muni_union
```

### 8.2 Migraciones (orden)

```bash
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/000_schema.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/001_refresh_tokens.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/002_indexes.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/003_usuario_permisos.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/004_usuario_permisos_modificar.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/005_seed_data.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/006_configuracion_sistema.sql
```

Instalación limpia alternativa: `deploy/db/init_db.sh limpia` en la VM PostgreSQL.

---

## 9. Variables de entorno relevantes

### Backend (`/opt/muni_union/.env.backend` en `.22`)

| Variable | Valor producción típico |
|---|---|
| `DB_HOST` | `172.16.3.23` |
| `DB_NAME` | `registro_muni_union` |
| `DB_USER` | `app_user` |
| `DB_SSL` | `true` |
| `FRONTEND_URL` | `https://172.16.3.21` (agregar dominio público separado por coma si aplica) |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |

### Frontend (`/opt/muni_union/.env.frontend` en `.21`)

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://172.16.3.21/api` |
| `NODE_ENV` | `production` |

---

## 10. Importación masiva

- Endpoint: `POST /api/importacion` (ADMIN)
- Excel `.xlsx`/`.xls` + ZIP opcional
- Límites: 30.000 filas; 500 MB/archivo
- Frontend timeout: 10 minutos
- Nginx: `client_max_body_size 500M` y timeouts de proxy ≥ 15 min

Resultados: `OK`, `OMITIDO`, `OMITIDO_DOC`, `ERROR`.

---

## 11. Filtros de actas (listado y exportación)

| Filtro | Comportamiento |
|---|---|
| Código con guiones (`NAC-L1-1`) | Exacto |
| Folio numérico (`1`) | Folio exacto (no parcial) |
| Libro (`2` o `L2`) | Segmento exacto del código |
| Texto/DNI/año/tipo/fechas | Combinables; exportación usa los mismos filtros |

---

## 12. Logs y almacenamiento

| Recurso | Ubicación |
|---|---|
| Uploads | NFS montado en Backend: `/mnt/uploads` → `/app/uploads` |
| Logs app | `/mnt/logs` + `docker logs union_api` / `union_web` |
| Backups DB | `/mnt/backups` en VM PostgreSQL / Storage |

---

## 13. Seguridad operativa

- PostgreSQL solo acepta SSL desde Backend (`DB_SSL=true`).
- Puerto 5432 no expuesto a Internet.
- Backend `:4000` solo red municipal.
- JWT en cookies `httpOnly`.
- Swagger deshabilitado en producción.
- Soft delete (`fecha_eliminacion`).

---

## 14. API REST (resumen)

| Método | Ruta | Auth | Uso |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login |
| GET | `/api/actas` | Sí | Listado/filtros |
| POST | `/api/importacion` | Admin | Carga masiva |
| GET | `/api/backup/download` | Admin | Backup SQL |
| GET | `/api/configuracion` | Sí | Leer URL pública |
| PUT | `/api/configuracion/url-verificacion` | Admin | Guardar URL pública |
| GET | `/api/verificar/solicitud/:id` | No | Verificación pública |

---

## 15. Dependencias principales

### Backend
express, pg, jsonwebtoken, bcrypt, multer, xlsx, helmet, pino, postgresql-client (imagen Docker para `pg_dump`)

### Frontend
Next.js 16, React 19, Axios, Zustand, Zod, react-hook-form

---

## 16. Checklist post-despliegue

1. `curl -f http://172.16.3.22:4000/api/health`
2. `curl -skf https://172.16.3.21/api/health`
3. Login `aespinoza` / `123456` → cambiar contraseña
4. Aplicar migración `006_configuracion_sistema.sql` si aún no existe
5. Menú **Configuración** → confirmar URL `https://172.16.3.21`
6. Probar `https://172.16.3.21/verificar`
7. Probar Backup BD y/o `pg_dump` en `.23`
