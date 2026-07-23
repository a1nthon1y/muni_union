# Manual Técnico — Sistema de Registro Civil
**Municipalidad Distrital de La Unión**
Versión 1.1.0 | Julio 2026

---

## 1. Descripción general

Sistema web para la gestión de registros civiles (actas de nacimiento, matrimonio y defunción), solicitudes de copias certificadas, digitalización de documentos y auditoría de operaciones.

---

## 2. Arquitectura de producción

```
 Usuarios LAN / portal público
             │ HTTPS :443
             ▼
 VM Frontend 172.16.3.21
 Nginx (host) → Next.js Docker (127.0.0.1:3000)
             │ API privada :4000
             ▼
 VM Backend 172.16.3.22
 Express Docker → NFS uploads/logs (VM .24)
             │ TLS PostgreSQL :5432
             ▼
 VM PostgreSQL 172.16.3.23
 PostgreSQL 15 → NFS backups (VM .24)
             │
             ▼
 VM Storage 172.16.3.24
 NFS: uploads, logs y backups
```

### 2.1 Componentes

| VM | IP | Servicio | Exposición |
|---|---|---|---|
| Frontend | `172.16.3.21` | Nginx Debian + Next.js Docker | HTTPS 80/443; Next solo `127.0.0.1:3000` |
| Backend | `172.16.3.22` | Express Docker (`union_api`) | `172.16.3.22:4000`, solo desde Frontend |
| PostgreSQL | `172.16.3.23` | PostgreSQL 15 con TLS | `5432`, solo desde Backend |
| Storage | `172.16.3.24` | NFS | Solo Backend y PostgreSQL |

### 2.2 Orden de dependencia

1. Storage (`.24`)
2. PostgreSQL (`.23`)
3. Backend (`.22`)
4. Frontend (`.21`)

No iniciar un servicio dependiente antes del anterior: el Backend necesita PostgreSQL y los montajes NFS; el Frontend necesita que la API esté disponible.

### 2.3 Patrón de aplicación

- **Separación de capas:** Rutas → Controladores → Servicios → BD
- **Stateless:** Autenticación via JWT en cookies `httpOnly` (sin estado en servidor)
- **Modular:** Cada entidad tiene su propio controller, service y route
- **Soft delete:** Ningún registro se borra físicamente; se marca con `fecha_eliminacion`

---

## 3. Estructura de directorios

```
muni_union/
├── back/                        # API REST
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # Pool PostgreSQL + timezone Lima
│   │   │   ├── logger.js        # Logger Pino
│   │   │   └── swagger.js       # Documentación OpenAPI
│   │   ├── controllers/         # Lógica de cada endpoint
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js       # Verificación JWT
│   │   │   ├── auditMiddleware.js       # Auditoría automática
│   │   │   ├── errorHandler.js          # Manejo global de errores
│   │   │   ├── permisos.middleware.js   # Permisos granulares
│   │   │   ├── role.middleware.js       # Control por rol
│   │   │   ├── upload.middleware.js     # Multer (archivos)
│   │   │   └── validate.middleware.js   # express-validator
│   │   ├── migrations/          # Scripts SQL versionados
│   │   ├── routes/              # Definición de rutas
│   │   ├── services/            # Lógica de negocio + queries
│   │   ├── app.js               # Configuración Express
│   │   └── server.js            # Punto de entrada
│   ├── uploads/                 # Archivos digitalizados (volumen Docker)
│   └── .env.example             # Plantilla de variables de entorno
├── front/                       # Aplicación Next.js
│   └── src/
│       ├── app/                 # Páginas (App Router)
│       │   ├── (dashboard)/     # Rutas protegidas (requieren login)
│       │   ├── login/           # Página de autenticación
│       │   ├── print/           # Vistas de impresión (PDF)
│       │   └── verificar/       # Portal público de verificación
│       ├── components/          # Componentes UI reutilizables
│       ├── hooks/               # Custom hooks React
│       ├── services/            # Clientes HTTP (Axios)
│       ├── store/               # Estado global (Zustand)
│       ├── types/               # Interfaces TypeScript
│       └── utils/
│           ├── api.ts           # Instancia Axios + interceptor refresh
│           └── dateUtils.ts     # Utilidades de fechas
├── deploy/
│   ├── 00_base_hardening.sh     # Base Debian para las cuatro VMs
│   ├── backend/03_setup_backend.sh
│   ├── db/02_setup_postgresql.sh
│   ├── frontend/04_setup_frontend.sh
│   ├── storage/01_setup_storage.sh
│   ├── docker-compose.backend.yml
│   ├── docker-compose.frontend.yml
│   ├── deploy.sh                # Actualiza Backend o Frontend
│   └── health_check.sh
├── MANUAL_TECNICO.md
├── MANUAL_USUARIO.md
└── README.md
```

---

## 4. Base de datos

### 4.1 Diagrama de tablas

```
roles ──────────────── usuarios ──────────── usuario_permisos
                           │
                           ├── refresh_tokens
                           │
tipos_documento ─── personas ◄────────────── actas ──── documentos_digitales
                                              │
                                        detalle_solicitud ◄── solicitudes ── solicitantes
                                                                    │
                                                               auditoria
```

### 4.2 Tablas principales

| Tabla | Descripción | Filas esperadas |
|---|---|---|
| `actas` | Registros de nacimiento, matrimonio y defunción | Miles/decenas de miles |
| `personas` | Ciudadanos registrados en el sistema | Similar a actas |
| `solicitudes` | Solicitudes de copias certificadas | Cientos por año |
| `detalle_solicitud` | Detalle de actas por solicitud | N:1 con solicitudes |
| `documentos_digitales` | Archivos PDF/imagen adjuntos a actas | Similar a actas |
| `auditoria` | Log de todas las operaciones | Alto volumen |
| `refresh_tokens` | Sesiones activas (limpieza automática cada 6h) | Bajo |

### 4.3 Convenciones

- **Soft delete:** `fecha_eliminacion TIMESTAMP` en todas las tablas operacionales. Siempre filtrar con `WHERE fecha_eliminacion IS NULL`.
- **Zona horaria:** Todas las operaciones en `America/Lima`. Forzado en el pool de conexiones y en `server.js`.
- **Numeración de actas modo CLASICO:** formato `{TIPO}-L{libro}-{numero}` (ej. `NAC-L1-45`)
- **Numeración modo CUI:** código alfanumérico libre (RENIEC)

### 4.4 Orden de ejecución de migraciones

```bash
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/000_schema.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/001_refresh_tokens.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/002_indexes.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/003_usuario_permisos.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/004_usuario_permisos_modificar.sql
psql -U app_user -h 172.16.3.23 -d registro_muni_union -f back/src/migrations/005_seed_data.sql
```

---

## 5. API REST

### 5.1 Autenticación

- **Mecanismo:** JWT en cookies `httpOnly` (no accesibles desde JavaScript)
- **Access token:** 1 hora de vigencia
- **Refresh token:** 7 días, almacenado como hash SHA-256 en BD
- **Rotación:** Cada refresh genera un nuevo par de tokens y revoca el anterior
- **Rate limiting:** Login: 10 intentos / 15 min. Refresh: 30 / 15 min. Verificación pública: 20 / min.

### 5.2 Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | No | Iniciar sesión |
| POST | `/api/auth/logout` | Sí | Cerrar sesión |
| POST | `/api/auth/refresh` | No | Renovar token |
| GET | `/api/auth/me` | Sí | Usuario actual |
| GET | `/api/actas` | Sí | Listar actas (filtros + paginación) |
| POST | `/api/actas` | Sí | Registrar acta |
| PUT | `/api/actas/:id` | Sí + permiso | Editar acta |
| PATCH | `/api/actas/:id/anular` | Sí + permiso | Anular acta |
| GET | `/api/actas/siguiente-numero` | Sí | Sugerir N° correlativo |
| GET | `/api/personas` | Sí | Listar ciudadanos |
| GET | `/api/solicitudes` | Sí | Listar solicitudes |
| POST | `/api/solicitudes` | Sí | Nueva solicitud |
| PATCH | `/api/solicitudes/:id/atender` | Sí | Marcar como atendida |
| GET | `/api/reportes/dashboard` | Sí | Estadísticas |
| POST | `/api/importacion` | Sí (ADMIN) | Carga masiva `.xlsx`/`.xls` + ZIP opcional |
| GET | `/api/auditoria` | Sí (admin) | Log de auditoría |
| GET | `/api/verificar/solicitud/:id` | **No** | Verificación pública |

Documentación completa (solo en desarrollo): `http://localhost:4000/api/docs`

### 5.3 Formato de respuesta de error

```json
{
  "message": "Descripción del error"
}
```

Código 400: validación / datos incorrectos  
Código 401: no autenticado o token expirado (`code: "TOKEN_EXPIRED"`)  
Código 403: sin permisos  
Código 404: recurso no encontrado  
Código 500: error interno (en producción no expone detalles)

---

## 6. Seguridad

| Medida | Implementación |
|---|---|
| Contraseñas | bcrypt (10 rondas) |
| Tokens | JWT firmados + cookies httpOnly + SameSite |
| Headers HTTP | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Lista blanca de orígenes (variable `FRONTEND_URL`) |
| Rate limiting | express-rate-limit en login, refresh y verificación |
| SQL Injection | Queries parametrizadas (pg pool, nunca string interpolation) |
| Uploads | Digitalización: PDF/JPG/PNG hasta 20 MB; importación: `.xlsx`/`.xls` y ZIP hasta 500 MB por archivo |
| Logs | Pino (sin datos sensibles en producción) |
| Swagger | Deshabilitado en `NODE_ENV=production` |

---

## 7. Acceso dual de red

| Entrada | `server_name` en Nginx | Rutas expuestas |
|---|---|---|
| Portal público | `verificar.muniunion.gob.pe` | `/verificar/*`, `/api/verificar/*`, `/_next/*` |
| Sistema interno | `https://172.16.3.21` | Aplicación, `/api/*` y `/uploads/*` |

---

## 8. Procesos de mantenimiento automático

El servidor ejecuta cada 6 horas (`server.js`):
- **Limpieza de refresh tokens expirados:** `DELETE FROM refresh_tokens WHERE expires_at < NOW()`
- **Purga de auditoría antigua:** registros de más de 2 años

---

## 9. Importación masiva

El módulo de importación (`POST /api/importacion`) acepta:
- Archivo Excel `.xlsx` o `.xls`
- ZIP opcional con PDF, JPG o PNG; se vinculan por `nombre_archivo_pdf` y, cuando existe, `carpeta_ruta`
- Límite: 30.000 filas por lote
- Límite de carga: 500 MB por archivo
- Deduplicación de actas por `numero_acta + anio`
- Resultado por fila: `OK`, `OMITIDO`, `OMITIDO_DOC` o `ERROR`

Columnas requeridas: `nombres`, `apellido_paterno`, `apellido_materno`, `tipo_acta`, `fecha_acta` + (`libro` y `numero_acta`) o `cui`.

### Operación y diagnóstico

- El frontend espera hasta 10 minutos por la respuesta de una importación.
- Nginx en Frontend debe permitir cuerpo de hasta 500 MB y tiempos de proxy de al menos 15 minutos.
- Si se agota el tiempo en navegador, no reintentar de inmediato: verificar actas y documentos, porque el Backend puede continuar procesando.
- Las coincidencias de personas sin DNI no son una identidad confiable. Antes de nuevas cargas históricas debe aplicarse una política de revisión para coincidencias ambiguas.

---

## 10. Variables de entorno

Ver `back/.env.example` para la lista completa con descripción de cada variable.

| Variable | Requerida | Descripción |
|---|---|---|
| `DB_HOST` | Sí | Host PostgreSQL |
| `DB_NAME` | Sí | `registro_muni_union` en producción |
| `DB_PASSWORD` | Sí | Contraseña BD |
| `DB_SSL` | Sí en producción | `true`; PostgreSQL solo acepta conexión TLS desde Backend |
| `JWT_SECRET` | Sí | Clave de firma JWT (mín. 64 chars) |
| `REFRESH_TOKEN_SECRET` | Sí | Clave refresh token (diferente al anterior) |
| `NODE_ENV` | Sí | `development` o `production` |
| `FRONTEND_URL` | Sí | Origen(es) permitidos por CORS |
| `PORT` | No | Puerto del servidor (default: 4000) |

---

## 11. Logs

El sistema usa **Pino** como logger. En desarrollo: salida coloreada (pino-pretty). En producción: JSON estructurado en el volumen NFS `/mnt/logs` del Backend y en los logs de Docker.

Niveles: `info` (operaciones normales), `warn` (errores recuperables), `error` (errores no controlados).

---

## 12. Operación de producción

### 12.1 Verificación de salud

```bash
# Backend (.22)
curl -f http://172.16.3.22:4000/api/health

# Frontend (.21)
curl -skf https://172.16.3.21/api/health
sudo docker ps
sudo nginx -t
```

La respuesta esperada del health es `"status":"ok"` y `"services":{"db":"ok"}`.

### 12.2 Actualizar la aplicación

Publicar primero los cambios validados en `main`. Luego actualizar cada VM de forma independiente:

```bash
# En Backend (.22)
cd /opt/muni_union
bash deploy/deploy.sh backend

# En Frontend (.21)
cd /opt/muni_union
bash deploy/deploy.sh frontend
```

No ejecutar `deploy.sh all` en una sola VM: Backend y Frontend son máquinas diferentes. `git pull` por sí solo no actualiza Next.js; el despliegue Frontend reconstruye `union_web`.

### 12.3 Base de datos y restauración

Antes de aplicar una migración o corregir datos, crear un backup:

```bash
sudo -u postgres pg_dump -Fc registro_muni_union \
  > /mnt/backups/manual_$(date +%F_%H%M).dump
```

Aplicar primero la migración en `.23`, luego actualizar Backend y, si hubo cambios de interfaz, Frontend.

### 12.4 Nginx y archivos digitalizados

Nginx corre en el host de la VM Frontend. Después de cambiar archivos en `/etc/nginx/`:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

El servidor interno debe enrutar `/api/` y `/uploads/` al Backend; de lo contrario los PDF/imagen registrados no podrán abrirse desde la interfaz.

---

## 13. Dependencias principales

### Backend
| Paquete | Versión | Uso |
|---|---|---|
| express | ^5.2.1 | Framework HTTP |
| pg | ^8.17 | Cliente PostgreSQL |
| jsonwebtoken | ^9.0 | JWT |
| bcrypt | ^6.0 | Hash de contraseñas |
| multer | ^2.0 | Upload de archivos |
| xlsx | ^0.18 | Importación Excel |
| helmet | ^8.1 | Headers de seguridad |
| pino | ^10.3 | Logging |

### Frontend
| Paquete | Versión | Uso |
|---|---|---|
| next | 16.1.6 | Framework React |
| react | 19.2 | UI |
| axios | ^1.13 | HTTP client |
| zustand | ^5.0 | Estado global |
| recharts | ^3.8 | Gráficos dashboard |
| zod | ^4.3 | Validación de formularios |
| react-hook-form | ^7.71 | Manejo de formularios |
| xlsx | ^0.18 | Exportación Excel |
