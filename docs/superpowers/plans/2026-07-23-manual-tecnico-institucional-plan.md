# Manual Técnico Institucional — Plan de adecuación

> **Para agentes ejecutores:** trabajar una tarea por vez, conservar evidencia verificable del repositorio y solicitar revisión documental al finalizar cada bloque.

**Objetivo:** convertir `MANUAL_TECNICO.md` y su versión HTML en el documento técnico único, autosuficiente y profesional solicitado por la Municipalidad, manteniendo `MANUAL_USUARIO.md` como documento independiente para usuarios finales.

**Arquitectura documental:** el Manual Técnico contendrá las nueve secciones institucionales obligatorias. La instalación completa se centralizará en la sección 5 y el catálogo completo de APIs en la sección 7. Los manuales actuales de instalación e integración se usarán como fuentes durante la consolidación, pero el lector no dependerá de ellos para comprender o desplegar el sistema.

**Fuentes técnicas:** código fuente actual, migraciones SQL, archivos `package.json`, Dockerfiles, Docker Compose, scripts de `deploy/`, configuración Nginx y manuales existentes.

## Restricciones globales

- Documentar solamente funcionalidades y controles verificables en el repositorio.
- Identificar explícitamente como **No implementado actualmente**: PISP, consulta en línea a RENIEC/SUNARP, webhooks, colas, ESB, MFA, cifrado de campos personales y API keys por integrador.
- No incluir líneas de código fuente; sí se permiten comandos operativos, rutas, variables, diagramas, tablas y ejemplos de peticiones.
- Conservar la separación entre sistema interno municipal y portal público de verificación.
- Incluir todas las credenciales y valores reales necesarios para configurar producción: aplicación, PostgreSQL, URLs, puertos, rutas y variables. No usar placeholders en la copia de entrega restringida.
- Identificar para cada credencial: servicio, usuario, valor, archivo donde se configura, VM responsable, procedimiento de comprobación y momento recomendado de cambio.
- Clasificar el Manual Técnico como **CONFIDENCIAL — USO INTERNO MUNICIPAL** y entregarlo por un canal controlado.
- Antes de retirar los manuales del repositorio, generar y validar la copia formal de entrega. La eliminación del archivo no borra el historial Git: si el repositorio fue accesible por terceros, se deberá purgar el historial o rotar todas las credenciales.
- No suponer valores ni comportamientos. Cada afirmación debe provenir del código, configuración, infraestructura observada o confirmación expresa del responsable; cuando no haya evidencia se rotulará “No verificado” o “No implementado actualmente”.
- Mantener equivalencia de contenido entre Markdown y HTML; el HTML no será un resumen.
- Usar español técnico claro, términos consistentes y siglas definidas en el primer uso.
- Diferenciar siempre: implementado, configurado, opcional, recomendado y no implementado.
- No afirmar cumplimiento integral de la Ley N.º 29733; describir controles técnicos y responsabilidades institucionales.
- Versión objetivo del documento: `1.4.0`, con fecha, propietario, aprobador, clasificación, estado e historial de cambios.

---

### Tarea 1: Gobierno documental e índice institucional

**Archivos:**
- Modificar: `MANUAL_TECNICO.md`
- Modificar posteriormente: `MANUAL_TECNICO.html`

**Resultado:** portada formal, control de versiones e índice con las nueve secciones solicitadas.

- [x] Incorporar ficha de control documental: nombre, código documental, versión, fecha, entidad, propietario, aprobador, estado y clasificación.
- [x] Añadir historial de cambios con versión `1.4.0` y motivo “Adecuación a estructura técnica institucional”.
- [x] Sustituir el índice actual por los nueve capítulos y los 26 subapartados oficiales `1.1–9.2`, respetando literalmente la estructura institucional solicitada.
- [x] Reservar la sección `5.2` para la guía completa de producción y la sección `7.1` para el catálogo completo de endpoints.
- [x] Incorporar como lista cerrada los encabezados: `1.1`, `1.2`, `2.1–2.4`, `3.1–3.4`, `4.1–4.3`, `5.1–5.3`, `6.1–6.3`, `7.1–7.2`, `8.1–8.3` y `9.1–9.2`.
- [x] Definir convenciones: “Producción”, “Red interna”, “Portal público”, “VM”, “API”, “NFS” y “PISP”.
- [x] Validar que no existan secciones numeradas fuera de la estructura oficial.

**Verificación:**

```bash
rg '^#{2,3} [1-9]\.[0-9]?\.? ' MANUAL_TECNICO.md
```

**Esperado:** nueve capítulos y 26 subapartados oficiales, en orden y sin duplicados.

---

### Tarea 2: Sección 1 — Generalidades y objetivos

**Archivo:** `MANUAL_TECNICO.md`

**Resultado:** definición institucional del propósito y alcance real.

- [x] Redactar `1.1 Propósito del documento`: operación, despliegue, mantenimiento, integración, seguridad y continuidad.
- [x] Redactar `1.2 Alcance del software`: personas, actas, documentos digitales, solicitudes, usuarios, reportes, auditoría, backup, configuración y verificación pública.
- [x] Identificar audiencias: administrador técnico, desarrollador, DBA, responsable de seguridad y proveedor autorizado.
- [x] Definir exclusiones: no sustituye políticas municipales, no integra PISP/RENIEC/SUNARP y no constituye por sí solo cumplimiento legal.
- [x] Incorporar límites de exposición: aplicación completa en red interna; solo verificación ciudadana en Internet.

**Criterio de aceptación:** un revisor puede determinar qué hace el sistema, para quién es el manual y qué no está implementado sin consultar otro documento.

---

### Tarea 3: Sección 2 — Arquitectura, flujos y plataforma

**Archivo:** `MANUAL_TECNICO.md`

**Resultado:** arquitectura real explicada con diagramas y versiones verificadas.

- [x] Describir el patrón como **aplicación web monolítica en capas**, no como microservicios:
  - Frontend Next.js.
  - API Express organizada en rutas, controladores, servicios y acceso SQL.
  - PostgreSQL relacional.
  - NFS para archivos, logs y backups.
- [x] Crear diagrama de bloques de capas en Mermaid.
- [x] Crear diagrama de despliegue de las cuatro VMs:
  - Frontend `172.16.3.21`.
  - Backend `172.16.3.22`.
  - PostgreSQL `172.16.3.23`.
  - Storage `172.16.3.24`.
- [x] Crear diagramas de secuencia para:
  - inicio de sesión y renovación de sesión;
  - consulta/registro de actas;
  - digitalización y almacenamiento documental;
  - verificación pública;
  - generación de backup.
- [x] Documentar tránsito de datos, protocolos, puertos y límites de confianza.
- [x] Aclarar que PostgreSQL usa TLS, pero el cliente actual configura `rejectUnauthorized: false`; existe cifrado del canal sin validación fuerte de la identidad del servidor.
- [x] Aclarar que el NFS de logs está provisionado, pero el logger actual escribe a stdout y Docker usa `json-file`; la centralización efectiva de logs no está implementada.
- [x] Registrar tecnologías y versiones reales:
  - Node.js 20;
  - Next.js 16.1.6;
  - React 19.2.3;
  - TypeScript 5;
  - Tailwind CSS 4;
  - Express 5.2.1;
  - PostgreSQL 15;
  - Debian 12 en la plataforma documentada;
  - Docker y Docker Compose.
- [x] Distinguir producción distribuida de los archivos legacy/locales que no deben usarse para el despliegue 4-VM.

**Verificación:** contrastar versiones con `front/package.json`, `back/package.json`, Dockerfiles y scripts de despliegue.

---

### Tarea 4: Sección 3 — Especificación de módulos

**Archivo:** `MANUAL_TECNICO.md`

**Resultado:** catálogo funcional técnico trazable entre interfaz, API, servicio y datos.

- [x] Documentar `3.1 Seguridad y control de accesos`:
  - usuarios, roles `ADMIN` y `USER`;
  - permisos granulares;
  - sesiones, refresh tokens y cierre de sesión;
  - rate limiting.
- [x] Documentar `3.2 Módulos principales`:
  - Dashboard.
  - Personas.
  - Actas.
  - Digitalización y documentos.
  - Solicitudes.
  - Usuarios.
  - Backup BD.
  - Verificación pública.
  - Configuración.
  - Importación masiva.
- [x] Para cada módulo incluir: objetivo, actores, entradas, procesamiento, salidas, API relacionada y tablas afectadas.
- [x] Documentar `3.3 Reportes y tareas programadas`:
  - resumen del dashboard;
  - exportaciones;
  - ingresos;
  - backup diario;
  - purga de refresh tokens;
  - retención de auditoría;
  - revisión de disco.
- [x] Documentar `3.4 Auditoría`:
  - acciones registradas;
  - campos conservados;
  - acceso exclusivo del administrador;
  - retención configurable.

**Criterio de aceptación:** cada opción principal del `Sidebar` debe aparecer en la sección y tener trazabilidad técnica.

---

### Tarea 5: Sección 4 — Código fuente y buenas prácticas

**Archivo:** `MANUAL_TECNICO.md`

**Resultado:** orientación del repositorio sin reproducir código fuente.

- [x] Registrar repositorio oficial: `https://github.com/a1nthon1y/muni_union`.
- [x] Incluir árbol curado de directorios, excluyendo dependencias y artefactos:
  - `back/src/config`;
  - `controllers`;
  - `middlewares`;
  - `migrations`;
  - `routes`;
  - `services`;
  - `front/src/app`;
  - `components`;
  - `services`;
  - `store`;
  - `types`;
  - `deploy`;
  - `nginx`;
  - `scripts`.
- [x] Explicar responsabilidad de cada directorio y flujo `route → controller → service → PostgreSQL`.
- [x] Documentar estándares observados: ES Modules, TypeScript en frontend, SQL parametrizado, validación de rutas, soft delete y manejo centralizado de errores.
- [x] Declarar controles existentes: ESLint frontend y pruebas Node del backend.
- [x] Declarar limitaciones reales: backend sin lint formal, CI Deno no representativo del stack y ausencia de política automática de formato.
- [x] Definir recomendaciones de contribución sin presentarlas como automatizaciones existentes.

---

### Tarea 6: Sección 5 — Requerimientos, instalación y despliegue

**Archivos fuente:**
- Consolidar desde: `MANUAL_INSTALACION.md`
- Documentar en: `MANUAL_TECNICO.md`

**Resultado:** procedimiento completo y autónomo para instalar producción.

- [x] Definir requisitos mínimos y recomendados como recomendaciones de capacidad basadas en la arquitectura y en el incidente operativo confirmado:
  - host Proxmox mínimo 16 GiB;
  - recomendado 24–32 GiB si se ejecuta una VM Windows auxiliar;
  - reserva mínima de 1.5–2 GiB para Proxmox;
  - capacidad de CPU, disco y red por VM.
- [x] Incorporar advertencia basada en operación real: sobreasignar 4 GiB a cinco VMs en un host de 8 GiB provoca OOM Killer y apagado de procesos KVM.
- [x] Documentar direccionamiento, DNS, NTP, gateway, certificados, acceso al repositorio y llaves SSH.
- [x] Describir instalación paso a paso en orden operativo corregido para no iniciar la API sin esquema:
  1. endurecimiento base;
  2. Storage;
  3. PostgreSQL;
  4. migraciones;
  5. Backend;
  6. Frontend/Nginx;
  7. verificación.
- [x] Identificar en cada comando el host donde debe ejecutarse: `[OPERADOR]`, `[PVE]`, `[VM21]`, `[VM22]`, `[VM23]` o `[VM24]`.
- [x] Marcar `init_db.sh limpia` como destructivo y exigir respaldo/verificación previa.
- [x] Definir `000_schema.sql` a `006_configuracion_sistema.sql` como secuencia canónica de instalación.
- [x] No presentar `instalacion_limpia.sql` como equivalente completo mientras no incluya y verifique la migración `006`.
- [x] Clasificar cada Docker Compose y configuración Nginx como producción vigente, desarrollo/local o legacy.
- [x] Documentar orden de encendido `.24 → .23 → .22 → .21` y apagado inverso.
- [x] Añadir tabla completa de puertos y reglas de firewall.
- [x] Añadir diccionario de variables:
  - `NODE_ENV`, `PORT`;
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`;
  - `JWT_SECRET`, `REFRESH_TOKEN_SECRET`;
  - `FRONTEND_URL`;
  - `AUDIT_RETENTION_DAYS`;
  - `LOG_LEVEL`;
  - `NEXT_PUBLIC_API_URL`.
- [x] Separar valores requeridos, secretos, valor de producción y procedimiento de generación.
- [x] Incorporar en el Manual Técnico una matriz de credenciales reales para aplicación, PostgreSQL, sistema operativo, URLs y secretos JWT, obtenidas de la infraestructura y nunca inventadas. No duplicar los valores secretos en planes ni en el Manual de Usuario.
- [x] Documentar Nginx real: 500 MB, upstream `.22:4000`, `/api/`, `/uploads/`, zona interna y portal público.
- [x] Añadir pruebas de aceptación con resultados esperados para health, BD, NFS, login, verificación y backup.
- [ ] Probar la instalación desde una base vacía y verificar tablas, configuración inicial, usuario bootstrap, conexión TLS y health de la API.

**Verificación:**

```bash
rg '172\.16\.3\.(21|22|23|24)|DB_SSL|NEXT_PUBLIC_API_URL|AUDIT_RETENTION_DAYS' MANUAL_TECNICO.md
```

---

### Tarea 7: Sección 6 — Seguridad digital

**Archivo:** `MANUAL_TECNICO.md`

**Resultado:** matriz de controles implementados, limitaciones y responsabilidades.

- [x] Documentar JWT access/refresh, cookies `httpOnly`, vigencias y revocación.
- [x] Documentar roles, permisos y endpoints administrativos.
- [x] Documentar TLS en Nginx y TLS obligatorio entre Backend y PostgreSQL, indicando que la validación actual del certificado PostgreSQL es parcial por `rejectUnauthorized: false`.
- [x] Aclarar que los datos personales en PostgreSQL no tienen cifrado por campo.
- [x] Documentar firewall, Fail2ban, endurecimiento SSH, CORS, Helmet y rate limits.
- [x] Documentar almacenamiento y retención de logs/auditoría.
- [x] Añadir clasificación de información, matriz completa de credenciales y procedimiento de custodia, entrega, rotación y revocación.
- [x] Registrar controles no implementados: MFA, OAuth, API keys, WAF, rotación automática de secretos y cifrado de campos.
- [x] Añadir matriz amenaza/control/evidencia/riesgo residual.
- [x] Explicar que la publicación posterior como repositorio privado no elimina secretos del historial Git y que la rotación sigue siendo necesaria.

---

### Tarea 8: Sección 7 — APIs e interoperabilidad

**Archivos fuente:**
- Consolidar desde: `MANUAL_INTEGRACION_API.md`
- Contrastar con: `back/src/routes/*.js`
- Documentar en: `MANUAL_TECNICO.md`

**Resultado:** catálogo completo y reproducible dentro del Manual Técnico.

- [x] Explicar las zonas de integración:
  - API completa para sistemas de la red interna.
  - Portal/API de verificación como única superficie pública.
- [x] Documentar URL base interna y acceso directo restringido.
- [x] Explicar autenticación real mediante cookies y compatibilidad Bearer del middleware, aclarando cómo se obtienen actualmente los tokens.
- [x] Crear catálogo uno a uno, a partir de cada `router.get/post/put/patch/delete`, con método, ruta, autenticación, rol, parámetros, cuerpo, respuesta y errores:
  - Auth.
  - Usuarios.
  - Personas.
  - Actas.
  - Documentos.
  - Solicitudes.
  - Reportes.
  - Auditoría.
  - Importación.
  - Backup.
  - Configuración.
  - Verificación.
  - Health.
- [x] Corregir parámetros reales, incluido `termino` para personas.
- [x] Documentar campos multipart `excel` y `zip`, límite 500 MB y máximo 30 000 filas.
- [x] Incorporar ejemplos `curl` de login, consulta, creación, importación y verificación.
- [x] Probar los ejemplos autenticados con cookie jar; el login actual devuelve cookies y no entrega el access token en el JSON.
- [x] Documentar códigos HTTP, paginación, rate limits, reintentos y errores.
- [x] Limitar los reintentos automáticos a operaciones seguras; no recomendar reintentos genéricos de `POST` sin idempotencia.
- [x] Documentar Swagger en su estado actual: `/api/docs` solo cuando `NODE_ENV !== production`.
- [x] Indicar que PISP, RENIEC/SUNARP en línea, webhooks, colas y ESB no están implementados.
- [x] Explicar integración entrante y saliente; marcar la integración saliente como no implementada actualmente.

**Verificación:** comparar todos los montajes de `back/src/app.js` y todas las declaraciones de métodos en `back/src/routes/*.js`; ninguna combinación método+ruta puede quedar sin registrar.

---

### Tarea 9: Sección 8 — Base de datos, DER y protección de datos

**Archivos fuente:**
- `back/src/migrations/000_schema.sql`
- `back/src/migrations/001_refresh_tokens.sql`
- `back/src/migrations/002_indexes.sql`
- `back/src/migrations/003_usuario_permisos.sql`
- `back/src/migrations/004_usuario_permisos_modificar.sql`
- `back/src/migrations/005_seed_data.sql`
- `back/src/migrations/006_configuracion_sistema.sql`

**Resultado:** modelo y diccionario verificables dentro del Manual Técnico.

- [x] Crear DER Mermaid con todas las entidades y relaciones.
- [x] Documentar tablas:
  - roles;
  - tipos_documento;
  - usuarios;
  - usuario_permisos;
  - refresh_tokens;
  - personas;
  - actas;
  - documentos_digitales;
  - solicitantes;
  - solicitudes;
  - detalle_solicitud;
  - auditoria;
  - configuracion_sistema.
- [x] Crear diccionario por tabla con campo, tipo, nulabilidad, PK/FK, descripción y clasificación de dato personal.
- [x] Documentar índices, unicidad, extensiones `pg_trgm`/`unaccent` y soft delete.
- [x] Documentar orden oficial de migraciones `000–006`.
- [x] Diferenciar migraciones incrementales de `instalacion_limpia.sql`.
- [x] Señalar que la instalación limpia debe aplicar/verificar también la configuración `006`.
- [x] Incorporar sección Ley N.º 29733:
  - categorías de datos tratados;
  - minimización en verificación pública;
  - control de acceso y auditoría;
  - backup y retención;
  - responsabilidades ARCO y administrativas no automatizadas.
- [x] Añadir matriz dato/finalidad/acceso/retención/eliminación y someterla a aprobación del responsable institucional de datos personales.
- [x] No declarar consentimiento, DPIA o registro ante ANPD como implementados.

**Verificación:** cada `CREATE TABLE` de las migraciones debe corresponder a una entrada del DER y del diccionario.

---

### Tarea 10: Sección 9 — Soporte, mantenimiento y continuidad

**Archivo:** `MANUAL_TECNICO.md`

**Resultado:** procedimientos seguros y matriz de diagnóstico.

- [x] Unificar mecanismos de backup:
  - descarga desde la aplicación;
  - cron PostgreSQL a NFS;
  - backup manual;
  - backup de desarrollo, claramente separado.
- [x] Definir retención, verificación, checksum, acceso, almacenamiento externo y prueba periódica.
- [x] Redactar restauración segura con precondiciones:
  - ventana de mantenimiento;
  - detener escrituras;
  - verificar archivo;
  - restaurar;
  - validar conteos y permisos;
  - rollback.
- [x] Documentar actualización con release/commit identificado, backup previo, migraciones, health checks y reversión.
- [x] Crear matriz síntoma/causa/verificación/solución/escalamiento.
- [x] Incluir, como mínimo:
  - VM detenida por OOM Killer;
  - falta de memoria/swap alta en Proxmox;
  - PostgreSQL sin SSL;
  - NFS no montado;
  - API/DB health degradado;
  - Nginx 502/504;
  - importación cortada por timeout;
  - archivo superior al límite;
  - usuario 401/403;
  - backup fallido;
  - disco lleno;
  - certificado inválido.
- [x] Añadir checklist diario, semanal, mensual y posterior a despliegue.
- [x] Definir datos mínimos para escalar un incidente: fecha/hora, VM, servicio, comando, log y acción previa.
- [x] Añadir pruebas negativas del portal público: debe rechazar cualquier ruta distinta de `/verificar`, recursos permitidos y `/api/verificar/`.

---

### Tarea 11: Ajuste profesional del Manual de Usuario

**Archivos:**
- Modificar: `MANUAL_USUARIO.md`
- Modificar posteriormente: `MANUAL_USUARIO.html`

**Resultado:** documento funcional separado, coherente con el Manual Técnico.

- [x] Mantener únicamente tareas de usuario; retirar instrucciones propias de infraestructura.
- [x] Corregir procedimientos que no existen en UI, especialmente cambio de contraseña.
- [x] Aclarar ruta de carga masiva: `Actas → IMPORTAR` y disponibilidad administrativa.
- [x] Diferenciar aplicación interna de verificación pública.
- [x] Añadir resultados esperados, mensajes frecuentes y datos que debe entregar a soporte.
- [x] Añadir referencias puntuales al Manual Técnico para incidentes, backup, integración y despliegue.
- [x] Corregir terminología y gramática, incluido “un acta”.

---

### Tarea 12: Generación HTML equivalente y control de calidad

**Archivos:**
- Modificar: `MANUAL_TECNICO.html`
- Modificar: `MANUAL_USUARIO.html`

**Resultado:** versiones HTML completas, imprimibles y equivalentes a Markdown.

- [x] Replicar todos los capítulos, tablas, diagramas, advertencias y apéndices del Markdown.
- [x] Mantener navegación por anclas y numeración institucional.
- [x] Eliminar dependencia de Google Fonts para funcionamiento offline.
- [x] Usar estilos A4, saltos de página controlados y tablas que no se corten incorrectamente.
- [x] Rotular clasificación y versión en portada y pie de página.
- [x] Verificar que no exista botón o instrucción especial de `Ctrl+P`.
- [x] Comparar encabezados Markdown vs HTML.
- [x] Validar enlaces, etiquetas HTML y contenido de credenciales.
- [x] Consolidar el contenido vigente de `MANUAL_INSTALACION.*` y `MANUAL_INTEGRACION_API.*`; después convertirlos en avisos de obsolescencia o retirarlos según la estrategia de entrega aprobada.
- [x] Verificar que README, índices y referencias oficiales presenten únicamente `MANUAL_TECNICO` y `MANUAL_USUARIO` como manuales vigentes.
- [ ] Generar una copia de entrega fuera del repositorio y comprobar que conserva todas las credenciales requeridas.
- [ ] Antes de eliminar los manuales del repositorio, verificar si las credenciales ya existen en el historial; si hubo exposición, registrar rotación o purga del historial como condición de cierre.
- [x] Abrir ambos HTML en navegador y revisar portada, índice, diagramas, tablas, código, impresión y responsive.

**Comandos de control:**

```bash
rg '^## ' MANUAL_TECNICO.md
rg '<h2' MANUAL_TECNICO.html
rg 'TBD|TODO|pendiente de completar|lorem ipsum' MANUAL_*.md MANUAL_*.html
git diff --check
```

**Esperado:** sin placeholders, sin errores de espacios accidentales y con correspondencia completa MD/HTML.

---

## Orden de ejecución y revisiones

1. **Parte I — Marco técnico:** tareas 1–3.
2. **Parte II — Módulos y código:** tareas 4–5.
3. **Parte III — Despliegue y seguridad:** tareas 6–7.
4. **Parte IV — API y base de datos:** tareas 8–9.
5. **Parte V — Continuidad y usuario:** tareas 10–11.
6. **Parte VI — HTML y validación final:** tarea 12.

Al terminar cada parte:

- revisar exactitud contra el repositorio;
- presentar el bloque al propietario;
- corregir observaciones antes de avanzar;
- registrar el cambio en el historial documental.

## Criterio final de aceptación

El trabajo estará terminado cuando un técnico que no conoce el proyecto pueda, usando únicamente el Manual Técnico:

1. comprender la arquitectura y los flujos;
2. identificar módulos, tecnologías y estructura del repositorio;
3. instalar y desplegar las cuatro VMs;
4. configurar variables y controles de seguridad;
5. consumir y diagnosticar todas las APIs;
6. interpretar el modelo de datos;
7. ejecutar backup, restauración y recuperación;
8. distinguir claramente lo implementado de lo no implementado.

El Manual de Usuario estará terminado cuando un operador pueda ejecutar sus tareas habituales sin instrucciones de infraestructura ni procedimientos inexistentes.
