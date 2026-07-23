# Manual de Integración API — Sistema de Registro Civil
**Municipalidad Distrital de La Unión — Piura, Perú**  
Versión 1.3.0 | Julio 2026

---

## A quién va dirigido

Este manual es para desarrolladores o sistemas externos (mesa de partes, tributario, validadores, etc.) que necesitan **consultar o registrar datos** mediante la API REST del Registro Civil.

No describe cómo instalar servidores. Para eso use el **Manual de Instalación**. Para operación diaria de infraestructura use el **Manual Técnico**.

---

## 1. URL base (producción)

Use preferentemente el proxy HTTPS del Frontend (recomendado):

```
https://172.16.3.21/api
```

Acceso directo al Backend (red interna, puerto de la API):

```
http://172.16.3.22:4000/api
```

**Verificación pública (sin login):**

```
https://172.16.3.21/api/verificar/solicitud/{id}
```

También existe el portal web ciudadano:

```
https://172.16.3.21/verificar
https://172.16.3.21/verificar/000001
```

---

## 2. Autenticación (JWT / cookies)

La aplicación web usa cookies `httpOnly` (`auth_token`, `refresh_token`).

Para integraciones externas típicas:

1. Hacer login.
2. Enviar en cada petición autenticada la cookie de sesión **o**, si su cliente lo soporta, el token en:

```http
Authorization: Bearer <access_token>
```

3. Si el token expira, usar el flujo de refresh (`/auth/refresh`) según el cliente.

### Login

- **Método:** `POST`
- **Ruta:** `/auth/login`
- **Cuerpo:**

```json
{
  "username": "aespinoza",
  "password": "123456"
}
```

> En producción el administrador inicial es `aespinoza` / `123456` (debe cambiarse). Para integraciones conviene crear un usuario de servicio con permisos mínimos, no usar el admin diario.

**Respuesta 200:** objeto `usuario` + cookies de sesión.

---

## 3. Endpoints principales

Todas las rutas siguientes se anteponen a la URL base (`.../api`).

### 3.1 Actas

#### Listar

- `GET /actas`
- Query params útiles:
  - `page`, `limit`
  - `q` — nombres / DNI
  - `tipo` — `NACIMIENTO` | `MATRIMONIO` | `DEFUNCION`
  - `anio`
  - `numero` — código completo (`NAC-L1-1`) = exacto; solo dígitos = folio exacto
  - `libro` — `2` o `L2`
  - `fecha_desde`, `fecha_hasta`
  - `dni`

#### Detalle

- `GET /actas/:id`

#### Crear

- `POST /actas`
- Requiere autenticación y permisos.
- Cuerpo mínimo típico: `persona_principal_id`, `tipo_acta`, `numero_acta`, `anio`, `fecha_acta`. En matrimonio también `persona_secundaria_id`.

### 3.2 Personas

- `GET /personas?q=...` — buscar por DNI o nombres
- `POST /personas` — crear (según permisos)

### 3.3 Solicitudes

- `GET /solicitudes`
- `POST /solicitudes`
- `PATCH /solicitudes/:id/atender` (según implementación actual)

### 3.4 Verificación pública (sin auth)

- `GET /verificar/solicitud/:id`

Ejemplo:

```bash
curl -sk "https://172.16.3.21/api/verificar/solicitud/1"
```

Respuesta típica si existe:

```json
{
  "valido": true,
  "constancia": {
    "numero": "000001",
    "tipo_solicitud": "COPIA_CERTIFICADA",
    "estado": "ATENDIDO"
  }
}
```

Si no existe: `valido: false` y mensaje descriptivo.

### 3.5 Importación masiva (solo admin)

- `POST /importacion`
- `multipart/form-data`: Excel (`.xlsx`/`.xls`) y ZIP opcional
- Límites de producción: hasta 500 MB por archivo; el proceso puede tardar varios minutos
- Nginx y el Frontend están configurados para esperas largas (ver Manual Técnico)

### 3.6 Configuración (URL pública)

- `GET /configuracion` — autenticado
- `PUT /configuracion/url-verificacion` — solo admin

```json
{
  "url_verificacion_publica": "https://172.16.3.21"
}
```

Valor por defecto de producción: IP `https://172.16.3.21`.

### 3.7 Backup (solo admin)

- `GET /backup/info`
- `GET /backup/download`

### 3.8 Salud

```bash
curl -skf https://172.16.3.21/api/health
curl -f http://172.16.3.22:4000/api/health
```

Esperado: `"status":"ok"` y `"services":{"db":"ok"}`.

---

## 4. Códigos HTTP comunes

| Código | Significado | Qué hacer |
|---|---|---|
| 200 / 201 | Éxito | Continuar |
| 400 | Datos inválidos | Revisar cuerpo/params |
| 401 | No autenticado / token vencido | Login o refresh |
| 403 | Sin permiso | Usar usuario con rol/permiso adecuado |
| 404 | No encontrado | Verificar ID |
| 429 | Demasiadas peticiones | Esperar y reintentar |
| 500 | Error interno | Revisar logs del Backend |

Errores suelen venir como:

```json
{ "message": "Descripción del problema" }
```

---

## 5. Seguridad para integradores

1. **CORS:** si llama desde un navegador en otro origen, ese origen debe estar en `FRONTEND_URL` del Backend (producción actual: `https://172.16.3.21`). Llamadas servidor-a-servidor (curl, backend propio) no sufren CORS.
2. **SSL a la base de datos:** la API usa `DB_SSL=true` hacia `172.16.3.23`. Eso es interno; el integrador no se conecta directo a PostgreSQL salvo acuerdo explícito.
3. **No exponga** usuario/contraseña de BD ni JWT en clientes públicos.
4. Preferir un **usuario de integración** con permisos mínimos, no el administrador `aespinoza`.
5. La verificación pública está limitada por tasa (rate limit) para evitar abusos.

### Conexión BD (solo si un sistema interno autorizado consulta directo)

| Dato | Valor producción |
|---|---|
| Host | `172.16.3.23` |
| Puerto | `5432` |
| Base | `registro_muni_union` |
| Usuario | `app_user` |
| Contraseña | `muniunion2026_prod` |
| SSL | obligatorio (`true`) |

> En general **no** se recomienda que terceros escriban directo en PostgreSQL. Use la API.

---

## 6. Ejemplo rápido con curl

```bash
# Salud
curl -skf https://172.16.3.21/api/health

# Login (guarda cookies en jar)
curl -sk -c /tmp/muni.jar -X POST https://172.16.3.21/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"aespinoza","password":"123456"}'

# Listar actas del libro 2, año 1940
curl -sk -b /tmp/muni.jar \
  "https://172.16.3.21/api/actas?libro=2&anio=1940&limit=20"

# Verificar constancia pública
curl -sk "https://172.16.3.21/api/verificar/solicitud/1"
```

---

## 7. Relación con otros manuales

| Manual | Contenido |
|---|---|
| Usuario | Uso diario en pantalla |
| Técnico | Servidores, Nginx, backups, variables |
| Instalación | Cómo montar las 4 VMs |
| Integración (este) | Cómo llamar a la API |
