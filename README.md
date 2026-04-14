# Sistema de Registro Civil — Municipalidad Distrital La Unión

Sistema web para la digitalización, gestión y búsqueda de actas civiles (nacimiento, matrimonio y defunción), solicitudes de copias certificadas, gestión de personas y auditoría de operaciones.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand |
| Backend | Node.js 20+, Express 5, ES Modules |
| Base de datos | PostgreSQL 15+ |
| Autenticación | JWT en cookies httpOnly (access 1h + refresh 7d) |
| Servidor web | Nginx (reverse proxy + SSL) |
| Contenedores | Docker + Docker Compose |

---

## Requisitos previos

- **Node.js** 20+
- **PostgreSQL** 15+ (o cuenta en [Neon.tech](https://neon.tech) para desarrollo)
- **Docker** + **Docker Compose** (para producción)

---

## Estructura del proyecto

```
muni_union/
├── back/                   # API REST (Node.js / Express)
│   ├── src/
│   │   ├── config/         # DB, logger, Swagger
│   │   ├── controllers/    # Lógica de controladores
│   │   ├── middlewares/    # Auth, auditoría, validación, errores
│   │   ├── migrations/     # SQL: esquema + índices
│   │   ├── routes/         # Definición de rutas
│   │   └── services/       # Lógica de negocio + queries
│   ├── uploads/            # Archivos subidos (PDFs/imágenes)
│   └── .env                # Variables de entorno (no subir a git)
├── front/                  # Aplicación Next.js
│   └── src/
│       ├── app/            # Páginas (App Router)
│       ├── components/     # Componentes reutilizables
│       ├── services/       # Clientes HTTP (Axios)
│       ├── store/          # Estado global (Zustand)
│       └── types/          # Interfaces TypeScript
├── nginx/
│   └── nginx.conf          # Configuración Nginx (producción)
├── scripts/
│   └── backup_db.sh        # Script de backup automático de BD
└── docker-compose.yml      # Orquestación de contenedores
```

---

## Configuración — Desarrollo local

### 1. Clonar el repositorio

```bash
git clone https://github.com/a1nthon1y/muni_union.git
cd muni_union
```

### 2. Configurar variables de entorno del backend

```bash
cp back/.env.example back/.env
```

Editar `back/.env`:

```env
# Base de Datos
DB_HOST=localhost          # o endpoint de Neon.tech para desarrollo en la nube
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=muni_union
DB_SSL=false               # true si usas Neon.tech

# Seguridad — CAMBIAR en producción (mín. 64 chars aleatorios)
JWT_SECRET=cambia_esto_por_una_clave_larga_y_aleatoria
REFRESH_TOKEN_SECRET=cambia_esto_tambien_diferente_a_la_anterior

# Servidor
PORT=4000
NODE_ENV=development

# Frontend (para CORS) — separar por comas si hay varios puertos
FRONTEND_URL=http://localhost:3000,http://localhost:3003
```

### 3. Preparar la base de datos

```sql
-- En psql como postgres
CREATE DATABASE muni_union;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- requerida para búsqueda fuzzy
```

Aplicar migraciones:

```bash
psql -U postgres -d muni_union -f back/src/migrations/001_schema.sql
psql -U postgres -d muni_union -f back/src/migrations/002_indexes.sql
```

### 4. Instalar dependencias y arrancar

```bash
# Backend
cd back && npm install && npm run dev
# Escucha en: http://localhost:4000

# Frontend (nueva terminal)
cd front && npm install && npm run dev
# Escucha en: http://localhost:3000
```

---

## Documentación de la API (Swagger)

Disponible **solo en modo desarrollo** en:

```
http://localhost:4000/api/docs
```

Incluye todos los endpoints documentados con ejemplos de request/response.
Para autenticarse en Swagger: primero hacer `POST /api/auth/login` — la cookie se
establecerá automáticamente en el navegador.

> En producción Swagger está deshabilitado por seguridad.

---

## Credenciales por defecto

| Campo | Valor |
|---|---|
| Usuario | `aespinoza` |
| Contraseña | `123456` |
| Rol | Administrador |

> **Cambiar la contraseña inmediatamente en producción** desde Gestión de Usuarios.

---

## Roles del sistema

| Rol ID | Nombre | Acceso |
|---|---|---|
| 1 | Administrador | Acceso total: usuarios, auditoría, CRUD completo |
| 2 | Operador | Digitalización, personas, actas, solicitudes |

---

## Tipos de actas

| Tipo | Descripción |
|---|---|
| `NACIMIENTO` | Acta de nacimiento |
| `MATRIMONIO` | Acta de matrimonio (requiere datos de cónyuge) |
| `DEFUNCION` | Acta de defunción |

### Modos de numeración

- **Libro Clásico**: requiere `libro` + `número de acta` + `año`. El sistema sugiere automáticamente el siguiente número disponible por libro.
- **RENIEC (CUI)**: requiere código CUI único. El sistema sugiere el siguiente CUI por tipo y año.

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/refresh` | Renovar token de acceso |
| GET | `/api/auth/me` | Datos del usuario autenticado |
| GET | `/api/personas` | Listar personas (paginado + búsqueda) |
| GET | `/api/actas` | Listar actas (filtros: tipo, año, DNI, fecha) |
| GET | `/api/actas/siguiente-numero` | Sugerir siguiente número de acta |
| POST | `/api/actas` | Registrar nueva acta |
| GET | `/api/solicitudes` | Listar solicitudes de copias certificadas |
| GET | `/api/reportes/dashboard` | Estadísticas del dashboard |
| POST | `/api/importacion/actas` | Carga masiva de actas (Excel/CSV) |
| GET | `/api/auditoria` | Registro de auditoría (solo admin) |

Ver documentación completa en `/api/docs` (modo desarrollo).

---

## Despliegue en producción (on-premise / servidor)

### Requisitos del servidor

- Ubuntu 22.04 LTS (recomendado)
- Docker Engine + Docker Compose
- Dominio o IP fija
- Certificados SSL (`.pem`)

### 1. Variables de entorno de producción

Crear `.env` en la raíz del proyecto:

```env
# Base de datos
DB_USER=postgres
DB_PASSWORD=password_muy_seguro_cambiar
DB_NAME=muni_union

# Seguridad — generar con: openssl rand -base64 64
JWT_SECRET=...64_caracteres_aleatorios...
REFRESH_TOKEN_SECRET=...64_caracteres_aleatorios_diferentes...

# URLs
FRONTEND_URL=https://tu-dominio.com
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api
```

### 2. Certificados SSL

```bash
mkdir -p nginx/ssl
# Copiar certificados:
cp tu_cert.pem nginx/ssl/cert.pem
cp tu_key.pem  nginx/ssl/key.pem
```

### 3. Levantar todos los servicios

```bash
docker compose up -d --build
```

Servicios que levanta:
- `union_db` — PostgreSQL 15 en `127.0.0.1:5432` (no expuesto a la red externa)
- `union_api` — Backend Node.js en puerto `4000` (interno)
- `union_web` — Frontend Next.js en puerto `3000` (interno)
- `union_nginx` — Nginx en puertos `80` y `443` (público)

### 4. Aplicar migraciones en producción

```bash
docker exec -it union_db psql -U postgres -d muni_union \
  -f /docker-entrypoint-initdb.d/001_schema.sql
docker exec -it union_db psql -U postgres -d muni_union \
  -f /docker-entrypoint-initdb.d/002_indexes.sql
```

### 5. Verificar que todo funciona

```bash
docker compose ps          # todos en estado "running"
docker compose logs -f     # ver logs en tiempo real
curl http://localhost/api  # debe responder JSON
```

---

## Backup de la base de datos

Script automático disponible en `scripts/backup_db.sh`.

Ejecutar manualmente:

```bash
chmod +x scripts/backup_db.sh
./scripts/backup_db.sh
```

Los backups se guardan en `backups/` con formato `backup_YYYYMMDD_HHMMSS.sql.gz`.

Para automatizar con cron (diario a las 2am):

```bash
crontab -e
# Agregar:
0 2 * * * /ruta/al/proyecto/scripts/backup_db.sh >> /var/log/backup_muni.log 2>&1
```

Restaurar un backup:

```bash
gunzip -c backups/backup_20260414_020000.sql.gz | psql -U postgres -d muni_union
```

---

## Migración de BD: Neon → on-premise

Para exportar el esquema desde Neon y llevarlo al servidor de producción:

```bash
# Exportar solo esquema (sin datos)
pg_dump \
  --schema-only \
  --no-owner \
  --no-privileges \
  "postgresql://usuario:password@ep-xxx.neon.tech/neondb?sslmode=require" \
  -f esquema.sql

# Importar en servidor on-premise
psql -U postgres -d muni_union -f esquema.sql
```

Para exportar con datos:

```bash
pg_dump \
  --no-owner \
  --no-privileges \
  "postgresql://usuario:password@ep-xxx.neon.tech/neondb?sslmode=require" \
  -f backup_completo.sql
```

---

## Consideraciones de seguridad para producción

- [ ] Cambiar `JWT_SECRET` y `REFRESH_TOKEN_SECRET` por valores aleatorios de 64+ chars
- [ ] Cambiar contraseña del usuario administrador por defecto
- [ ] Configurar certificados SSL válidos en `nginx/ssl/`
- [ ] Asegurarse que `NODE_ENV=production` (deshabilita Swagger y logs detallados)
- [ ] El puerto `5432` de PostgreSQL NO debe estar expuesto a internet (Docker lo maneja)
- [ ] Configurar reglas de firewall: solo puertos `80` y `443` públicos
- [ ] Habilitar backup automático con cron

---

## Funcionalidades implementadas

- **Digitalización de actas**: registro de actas de nacimiento, matrimonio y defunción con archivo digital adjunto (PDF/imagen)
- **Auto-sugerencia de numeración**: el sistema sugiere automáticamente el siguiente número de acta por tipo, año, libro y modo
- **Búsqueda inteligente**: búsqueda por nombre, DNI o número de acta con tolerancia a errores tipográficos (GIN + pg_trgm)
- **Gestión de personas**: registro de ciudadanos con validación de duplicados por nombre
- **Solicitudes de copias certificadas**: flujo de atención y anulación con trazabilidad
- **Carga masiva (Excel/CSV)**: importación de actas en lote con validación
- **Auditoría completa**: registro automático de todas las operaciones del sistema
- **Dashboard con gráficos**: evolución de actas por mes y estado de solicitudes
- **Gestión de usuarios y roles**: administrador y operador
- **Autenticación segura**: cookies httpOnly, refresh automático de token, logout total
- **Exportación a Excel**: todas las tablas son exportables
- **Diseño responsive**: optimizado para escritorio, tablet y móvil

---

## Repositorio

[https://github.com/a1nthon1y/muni_union](https://github.com/a1nthon1y/muni_union)
