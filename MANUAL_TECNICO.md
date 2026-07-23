# Manual Técnico — Sistema de Registro Civil
**Municipalidad Distrital de La Unión — Piura, Perú**  
Versión 1.3.0 | Julio 2026

---

## A quién va dirigido

Este manual es para quien **administra la infraestructura y el sistema en producción**: técnicos de sistemas, soporte municipal o personal encargado de servidores, red y base de datos.

Se explica con términos claros. Cuando aparezca una palabra técnica, se indica qué significa en la práctica.

> Los manuales de **instalación desde cero** y de **integración API** se documentan aparte. Este documento describe la **producción actual ya desplegada** y cómo operarla día a día.

---

## 1. Qué es el sistema (vista técnica)

Aplicación web de Registro Civil con:

- **Frontend:** pantalla que ven los usuarios (Next.js en Docker).
- **Backend / API:** lógica y conexión a la base de datos (Express en Docker).
- **Base de datos:** PostgreSQL (motor que guarda actas, personas, usuarios, etc.).
- **Almacenamiento NFS:** carpeta compartida en red para PDF/imágenes, logs y backups.
- **Nginx:** “portero” en el servidor Frontend: recibe HTTPS y reparte el tráfico al Frontend o al Backend.

---

## 2. Arquitectura de producción actual

Hay **cuatro máquinas virtuales (VM)** en Proxmox, cada una con una IP fija:

```
 Usuarios de la red municipal / verificación
             │  HTTPS (puerto 443)
             ▼
 VM Frontend     172.16.3.21
 Nginx en el sistema operativo + contenedor Docker "union_web" (Next.js en 127.0.0.1:3000)
             │  llama a la API
             ▼
 VM Backend      172.16.3.22
 Contenedor Docker "union_api" (Express en puerto 4000)
             │  monta NFS uploads/logs
             │  conecta a PostgreSQL con SSL
             ▼
 VM PostgreSQL   172.16.3.23
 PostgreSQL 15 — base "registro_muni_union" — backups hacia NFS
             │
             ▼
 VM Storage      172.16.3.24
 Servidor NFS: uploads, logs y backups
```

### 2.1 Tabla de VMs (producción)

| Nombre práctico | IP | Qué corre | Quién la usa |
|---|---|---|---|
| Frontend | `172.16.3.21` | Nginx + Docker `union_web` | Usuarios (navegador) y proxy a la API |
| Backend | `172.16.3.22` | Docker `union_api` puerto `4000` | Solo el Frontend / red interna |
| Base de datos | `172.16.3.23` | PostgreSQL 15 con SSL | Solo el Backend |
| Almacenamiento | `172.16.3.24` | NFS | Backend (uploads/logs) y PostgreSQL (backups) |

### 2.2 Orden correcto al encender

Si se reinicia todo el entorno, encienda en este orden:

1. Storage `.24` (las carpetas compartidas deben existir primero)
2. PostgreSQL `.23` (la base debe estar disponible)
3. Backend `.22` (la API necesita la base y el NFS)
4. Frontend `.21` (la web necesita la API)

### 2.3 Direcciones que debe conocer el administrador

| Para qué | Dirección |
|---|---|
| Entrar al sistema (login) | `https://172.16.3.21` |
| API a través de Nginx | `https://172.16.3.21/api` |
| Probar si el Backend está sano | `http://172.16.3.22:4000/api/health` |
| Verificación ciudadana | `https://172.16.3.21/verificar` |
| Ejemplo de constancia | `https://172.16.3.21/verificar/000001` |
| Dominio público preparado (aún requiere DNS/cert oficial) | `verificar.muniunion.gob.pe` |
| Carpeta del código en las VMs | `/opt/muni_union` |

---

## 3. Credenciales de producción

### 3.1 Usuario administrador de la aplicación

| Campo | Valor |
|---|---|
| Usuario | `aespinoza` |
| Contraseña inicial | `123456` |

Cambiarla al primer ingreso. El resto de usuarios se crea desde el menú **Usuarios** de la aplicación.

### 3.2 Conexión a la base de datos (producción actual)

Estos valores son los que usa el Backend en `/opt/muni_union/.env.backend` en la VM `172.16.3.22`:

| Variable / dato | Valor en producción |
|---|---|
| `DB_HOST` | `172.16.3.23` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `registro_muni_union` |
| `DB_USER` | `app_user` |
| `DB_PASSWORD` | `muniunion2026_prod` |
| `DB_SSL` | `true` |

**Qué significa cada uno (para quien no opera bases a diario):**

- **Host:** IP del servidor donde vive PostgreSQL.
- **Puerto 5432:** puerta de red estándar de PostgreSQL.
- **DB_NAME:** nombre de la base (el “archivo lógico” donde están las tablas).
- **Usuario / contraseña:** credenciales con las que la aplicación se conecta.
- **DB_SSL = true:** la conexión va cifrada. En este servidor PostgreSQL **exige** SSL; si está en `false`, el Backend falla con error de autenticación.

**Cómo probar la conexión desde una máquina autorizada:**

```bash
psql -h 172.16.3.23 -p 5432 -U app_user -d registro_muni_union
# Pedirá la contraseña: muniunion2026_prod
```

Desde la propia VM de base de datos:

```bash
ssh deploy@172.16.3.23
sudo -u postgres psql -d registro_muni_union
```

> Guarde estas credenciales con cuidado. Quien tenga este manual puede acceder a los datos. No las comparta por chat o correo no seguro.

### 3.3 Variables del Frontend

Archivo `/opt/muni_union/.env.frontend` en `172.16.3.21`:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://172.16.3.21/api` |
| `NODE_ENV` | `production` |

### 3.4 Otras variables importantes del Backend

Además de la base de datos, en `.env.backend` deben existir (entre otras):

| Variable | Rol |
|---|---|
| `JWT_SECRET` | Firma de sesiones (no compartir) |
| `REFRESH_TOKEN_SECRET` | Renovación de sesión (distinta al JWT) |
| `FRONTEND_URL` | Origen permitido por CORS, ej. `https://172.16.3.21` |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |

---

## 4. Nginx (VM Frontend `172.16.3.21`)

**Nginx** es el programa que escucha en internet/red en los puertos 80 y 443, termina el HTTPS y envía cada petición al contenedor web o al Backend.

No corre dentro de Docker: corre en el **sistema Debian del host**.

### 4.1 Puertos

| Puerto | Uso práctico |
|---|---|
| `80` | HTTP: redirige automáticamente a HTTPS |
| `443` | HTTPS: acceso real de usuarios |
| `3000` | Solo en la propia máquina Frontend (Next.js); no se abre al resto de la red |
| `4000` | Backend en `.22`; Nginx del Frontend le hace de puente |

Firewall típico en Frontend: permitir solo `80` y `443` al exterior/LAN según política.

```bash
sudo ufw status
sudo ss -tlnp | grep -E ':80|:443|:3000'
sudo nginx -t
```

### 4.2 Archivos clave

| Archivo | Para qué sirve |
|---|---|
| `/etc/nginx/conf.d/muni-union-upstreams.conf` | Dónde están Frontend/Backend, tamaño máximo de archivos, tiempos de espera |
| `/etc/nginx/sites-available/muni-union` | Reglas de cada sitio (interno por IP y portal público) |
| `/etc/nginx/sites-enabled/muni-union` | Enlace activo al archivo anterior |
| `/etc/nginx/ssl/internal/` | Certificado del sistema por IP (`172.16.3.21`) |
| `/etc/nginx/ssl/public/` | Certificado del portal público (`verificar.muniunion.gob.pe`) |

### 4.3 Carga masiva (valores reales en producción)

Para que Excel/ZIP grandes no fallen a mitad de camino, en `muni-union-upstreams.conf` debe figurar:

```nginx
client_max_body_size 500M;
client_body_timeout 300s;
proxy_connect_timeout 15s;
proxy_send_timeout 360s;
proxy_read_timeout 360s;
send_timeout 360s;
```

- **500M:** tamaño máximo del archivo que Nginx acepta.
- **Timeouts ~15 min:** tiempo que Nginx espera mientras el Backend procesa la importación.
- En la aplicación web, la espera del navegador está en **10 minutos**.

Después de cambiar Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4.4 Rutas que deben llegar al Backend

En el servidor interno (`server_name 172.16.3.21`):

```nginx
location /api/     { proxy_pass http://backend; }
location /uploads/ { proxy_pass http://backend; }
```

Sin `/uploads/`, los PDF/imagen de actas **no se ven** aunque estén guardados en el NFS.

### 4.5 Acceso dual

| Entrada | Nombre en Nginx | Qué deja pasar |
|---|---|---|
| Sistema interno | IP `172.16.3.21` | Toda la aplicación, API, uploads y verificación |
| Portal público | `verificar.muniunion.gob.pe` | Solo verificación y recursos necesarios |

Hoy la operación diaria usa la **IP**. El dominio público está preparado en Nginx, pero necesita DNS y certificado válidos para usarse desde internet.

### 4.6 Configuración de URL pública desde la aplicación

Menú admin → **Configuración**.

- **Valor por defecto:** `https://172.16.3.21`
- Se guarda en la tabla `configuracion_sistema` (migración `006_configuracion_sistema.sql`).
- Esa URL es la que se **imprime en las constancias**.

Cambiarla en la web **no** cambia sola Nginx ni el DNS. Para un dominio real:

1. Apuntar el DNS a `172.16.3.21`
2. Ajustar `server_name` y certificado en Nginx
3. Recargar Nginx
4. Guardar la misma URL en **Configuración**

---

## 5. Cómo actualizar la aplicación

En cada VM, el código está en `/opt/muni_union`.

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

- No ejecute `deploy.sh all` en una sola VM: Frontend y Backend son máquinas distintas.
- Solo hacer `git pull` **no** actualiza la web: el Frontend debe reconstruir el contenedor Docker.

Comprobar salud:

```bash
curl -f http://172.16.3.22:4000/api/health
curl -skf https://172.16.3.21/api/health
```

Respuesta esperada: `"status":"ok"` y `"services":{"db":"ok"}`.

Si al construir Docker falla la descarga de `node:20-slim` por IPv6, deshabilite IPv6 temporalmente, reinicie Docker y vuelva a construir.

---

## 6. Copias de seguridad (backup)

### 6.1 Desde la aplicación (administrador de sistema)

1. Entrar a `https://172.16.3.21` como admin.
2. Menú → **Backup BD**.
3. Descargar el `.sql` y guardarlo en lugar seguro.

Ese backup usa la misma conexión `DB_*` del Backend hacia `172.16.3.23`.

### 6.2 Desde el servidor de base de datos `.23` (recomendado para técnicos)

```bash
ssh deploy@172.16.3.23

# Formato compacto (recomendado)
sudo -u postgres pg_dump -Fc registro_muni_union \
  > /mnt/backups/manual_$(date +%F_%H%M).dump

# Formato SQL texto
sudo -u postgres pg_dump -Fp --no-owner --no-acl registro_muni_union \
  > /mnt/backups/manual_$(date +%F_%H%M).sql

ls -lh /mnt/backups/
```

### 6.3 Restaurar (solo con backup previo y cuidado)

```bash
sudo -u postgres pg_restore -d registro_muni_union --clean --if-exists \
  /mnt/backups/manual_YYYY-MM-DD_HHMM.dump
```

Siempre genere un backup **antes** de restaurar o de aplicar cambios de esquema.

---

## 7. Base de datos: migraciones

Las migraciones son scripts SQL que crean o actualizan tablas. Orden:

```text
000_schema.sql
001_refresh_tokens.sql
002_indexes.sql
003_usuario_permisos.sql
004_usuario_permisos_modificar.sql
005_seed_data.sql
006_configuracion_sistema.sql
```

Ejemplo para aplicar la de configuración (URL pública):

```bash
psql -h 172.16.3.23 -p 5432 -U app_user -d registro_muni_union \
  -f /opt/muni_union/back/src/migrations/006_configuracion_sistema.sql
```

---

## 8. Almacenamiento NFS (`.24`)

| Recurso | Dónde se monta | Contenido |
|---|---|---|
| Uploads | Backend: `/mnt/uploads` → `/app/uploads` | PDF/imágenes de actas |
| Logs | Backend: `/mnt/logs` | Logs de aplicación |
| Backups | PostgreSQL: `/mnt/backups` | Volcados de base de datos |

Si el NFS no está montado, la API puede fallar al subir o servir documentos.

---

## 9. Importación masiva y filtros (resumen operativo)

- Endpoint: `POST /api/importacion` (solo admin).
- Excel `.xlsx`/`.xls` + ZIP opcional; hasta 30.000 filas y 500 MB.
- Resultados: `OK`, `OMITIDO`, `OMITIDO_DOC`, `ERROR`.
- Filtros de actas: código exacto, folio exacto, libro exacto; la exportación Excel usa los mismos filtros de pantalla.

---

## 10. Checklist rápido del administrador técnico

1. ¿Las cuatro VMs están encendidas? (`.24` → `.23` → `.22` → `.21`)
2. `curl -f http://172.16.3.22:4000/api/health` → ok + db ok
3. `curl -skf https://172.16.3.21/api/health` → ok
4. Login `aespinoza` (cambiar `123456` si aún no se cambió)
5. ¿Existe migración `006`? Si no, aplicarla
6. Menú **Configuración** → URL por defecto `https://172.16.3.21`
7. Probar `https://172.16.3.21/verificar`
8. Probar Backup desde la app o `pg_dump` en `.23`
9. Confirmar Nginx: body `500M`, `/api/` y `/uploads/` al Backend

---

## 11. Glosario breve

| Término | Significado sencillo |
|---|---|
| VM | Máquina virtual: un servidor “dentro” de Proxmox |
| Docker / contenedor | Empaque que ejecuta la aplicación de forma aislada |
| Nginx | Recibe el tráfico web y lo reparte |
| API | Interfaz del Backend que el Frontend llama para leer/guardar datos |
| PostgreSQL | Programa de base de datos |
| NFS | Disco compartido por red entre VMs |
| SSL/TLS | Cifrado de la conexión |
| Backup | Copia de seguridad para recuperar datos |
| Migración | Script que actualiza la estructura de la base |

---

## 12. Otros manuales del sistema

| Manual | Archivos | Para qué |
|---|---|---|
| Usuario | `MANUAL_USUARIO.md` / `.html` | Uso diario en pantalla |
| Técnico (este) | `MANUAL_TECNICO.md` / `.html` | Operación de servidores y red |
| Instalación | `MANUAL_INSTALACION.md` / `.html` | Montar o reinstalar las 4 VMs |
| Integración API | `MANUAL_INTEGRACION_API.md` / `.html` | Consumir la API desde otros sistemas |

> Contienen credenciales reales de producción. Cuando el repositorio pase a privado o se entreguen solo por canal interno, retire estos archivos del acceso público.
