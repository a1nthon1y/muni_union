# Sistema de Registro Civil — Municipalidad Distrital de La Unión

Sistema web para gestionar personas, actas de nacimiento/matrimonio/defunción, documentos digitalizados, solicitudes de copias, reportes, usuarios, auditoría, backups, identidad visual y verificación pública.

## Documentación oficial

| Documento | Audiencia | Formatos |
|---|---|---|
| Manual Técnico | Infraestructura, soporte, desarrollo, DBA y seguridad | [Markdown](MANUAL_TECNICO.md) · [HTML imprimible](MANUAL_TECNICO.html) |
| Manual de Usuario | Usuarios finales y administradores funcionales | [Markdown](MANUAL_USUARIO.md) · [HTML imprimible](MANUAL_USUARIO.html) |

Los antiguos manuales de Instalación e Integración API están obsoletos. Su contenido vigente fue incorporado en las secciones 5 y 7 del Manual Técnico.

> El Manual Técnico es confidencial porque contiene direcciones y credenciales operativas. No debe publicarse ni distribuirse fuera del personal autorizado.

## Arquitectura de producción

El sistema es una aplicación web monolítica en capas distribuida en cuatro VMs Debian sobre una plataforma de virtualización con hipervisor tipo 1:

| VM | IP | Función |
|---|---|---|
| Frontend | `172.16.3.21` | Nginx + Next.js (`union_web`) |
| Backend | `172.16.3.22` | Express (`union_api`) |
| PostgreSQL | `172.16.3.23` | PostgreSQL 15 con TLS |
| Storage | `172.16.3.24` | NFS para uploads, logs provisionados y backups |

La aplicación completa se limita a la red municipal. El dominio público solo permite verificación ciudadana.

## Tecnologías principales

- Frontend: Node.js 20, Next.js 16.1.6, React 19.2.3, TypeScript y Tailwind CSS 4.
- Backend: Node.js 20, Express 5.2.1 y ES Modules.
- Datos: PostgreSQL 15, `pg_trgm` y NFS.
- Operación: Docker, Docker Compose y Nginx.
- Autenticación: JWT en cookies `httpOnly`, refresh tokens, roles y permisos granulares.

Las versiones verificadas y limitaciones se encuentran en la sección 2.3 del Manual Técnico.

## Estructura del repositorio

```text
muni_union/
├── back/                  # API Express
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── migrations/   # 000_schema.sql a 008_fecha_fallecimiento.sql
│       ├── routes/
│       └── services/
├── front/                 # Aplicación Next.js
│   └── src/
│       ├── app/
│       ├── components/
│       ├── services/
│       ├── store/
│       └── types/
├── deploy/                # Despliegue vigente de cuatro VMs
├── nginx/                 # Configuración local/desarrollo
├── scripts/               # Utilidades locales
├── MANUAL_TECNICO.*
└── MANUAL_USUARIO.*
```

## Desarrollo local

Requisitos: Node.js 20+, PostgreSQL 15+ y npm.

```bash
git clone https://github.com/a1nthon1y/muni_union.git
cd muni_union
cp back/.env.example back/.env
```

Configure `back/.env` para el entorno local. No copie secretos de producción ni versione archivos `.env`.

Aplique las migraciones en orden:

```bash
for archivo in back/src/migrations/00{0..8}_*.sql; do
  psql -U postgres -d muni_union -v ON_ERROR_STOP=1 -f "$archivo"
done
```

Inicie cada componente:

```bash
# Terminal 1
cd back && npm install && npm run dev

# Terminal 2
cd front && npm install && npm run dev
```

- Frontend local: `http://localhost:3000`.
- Backend local: `http://localhost:4000`.
- Health: `http://localhost:4000/api/health`.
- Swagger: `http://localhost:4000/api/docs`, solo desarrollo y con cobertura parcial.

## Producción

No utilice el `docker-compose.yml` raíz ni las configuraciones legacy como guía de producción. El procedimiento oficial está en:

- Manual Técnico, sección 5: requisitos, instalación y despliegue.
- Manual Técnico, sección 6: seguridad digital.
- Manual Técnico, sección 7: catálogo de endpoints e interoperabilidad.
- Manual Técnico, sección 9: backups, restauración, actualización y diagnóstico.

Orden de encendido: `172.16.3.24 → 172.16.3.23 → 172.16.3.22 → 172.16.3.21`. Apagado planificado: orden inverso.

## Estado de integraciones

Implementado: API REST interna y verificación pública limitada.

No implementado: PIDE, consultas en línea RENIEC/SUNARP, webhooks, colas, ESB y API keys por integrador.
