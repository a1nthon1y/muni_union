# 🔌 Manual de Integración de API REST
**Sistema de Registro Civil — Municipalidad Distrital de La Unión**  
Versión 1.0.0 · Julio 2026

Este manual detalla los endpoints, la autenticación y las estructuras de datos requeridas para que sistemas externos o de terceros (ej. mesa de partes, sistemas tributarios locales, validadores de identidad) consuman las APIs REST del sistema de Registro Civil de la municipalidad.

---

## 🌐 1. URL Base

El punto de acceso a la API REST varía según el ámbito de consumo:

* **Consumo Interno (Desde servidores/sistemas dentro de la red municipal):**
  ```
  https://172.16.3.22:4000/api
  ```
* **Consumo Vía Proxy (Desde la LAN general o VPN autorizada):**
  ```
  https://172.16.3.21/api
  ```

---

## 🔑 2. Autenticación y Ciclo de Vida

El sistema implementa autenticación basada en **JSON Web Tokens (JWT)**. Para sistemas de terceros, la autenticación se realiza mediante cabeceras HTTP estándar.

### Flujo de Trabajo para Sistemas Externos:
1. El sistema externo envía sus credenciales al endpoint `/auth/login`.
2. La API responde con el objeto de usuario y setea la cookie `auth_token`. Para sistemas que no admiten cookies, se puede extraer el token o cabecera JWT.
3. El sistema externo debe enviar en cada petición subsecuente la cabecera:
   ```http
   Authorization: Bearer <TU_ACCESS_TOKEN>
   ```

---

## 📡 3. Endpoints Principales

### 🔓 3.1. Autenticación

#### A. Iniciar Sesión (Login)
* **Método:** `POST`
* **Ruta:** `/auth/login`
* **Cuerpo de la Petición (JSON):**
  ```json
  {
    "username": "usuario_api",
    "password": "ContraseñaEstablecida"
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "usuario": {
      "id": 5,
      "username": "usuario_api",
      "nombres": "Integrador",
      "apellidos": "Terceros",
      "rol_id": 2,
      "rol": "OPERADOR",
      "activo": true
    }
  }
  ```
  *Nota: Las cookies `auth_token` y `refresh_token` se adjuntan en la respuesta HTTPS.*

---

### 📋 3.2. Gestión de Actas (Nacimiento, Matrimonio, Defunción)

#### A. Listar Actas (Filtros + Paginación)
* **Método:** `GET`
* **Ruta:** `/actas`
* **Parámetros de consulta (Query Params):**
  * `page` (opcional): Número de página (default `1`).
  * `limit` (opcional): Resultados por página (default `10`).
  * `q` (opcional): Texto a buscar (nombres, apellidos, número de acta, DNI, CUI).
  * `tipo` (opcional): Filtrar por tipo (`NACIMIENTO`, `MATRIMONIO`, `DEFUNCION`).
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "id": 1024,
        "tipo_acta": "NACIMIENTO",
        "numero_acta": "NAC-L5-144",
        "anio": 2024,
        "fecha_acta": "2024-05-12",
        "observaciones": "",
        "cui": "70321455",
        "estado": "ACTIVO",
        "persona_principal": "Juan Pérez Gómez"
      }
    ],
    "total": 1
  }
  ```

#### B. Obtener Detalle de un Acta
* **Método:** `GET`
* **Ruta:** `/actas/:id`
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "id": 1024,
    "tipo_acta": "NACIMIENTO",
    "numero_acta": "NAC-L5-144",
    "anio": 2024,
    "fecha_acta": "2024-05-12T05:00:00.000Z",
    "observaciones": "",
    "cui": "70321455",
    "estado": "ACTIVO",
    "persona_principal_id": 342,
    "persona_principal": {
      "id": 342,
      "nombres": "Juan",
      "apellido_paterno": "Pérez",
      "apellido_materno": "Gómez",
      "dni": "70321455",
      "fecha_nacimiento": "2024-05-10"
    }
  }
  ```

#### C. Crear un Acta
* **Método:** `POST`
* **Ruta:** `/actas`
* **Cuerpo de la Petición (JSON):**
  ```json
  {
    "persona_principal_id": 342,
    "tipo_acta": "NACIMIENTO",
    "numero_acta": "NAC-L5-144",
    "anio": 2024,
    "fecha_acta": "2024-05-12",
    "cui": "70321455",
    "observaciones": "Inscripción oportuna"
  }
  ```
* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": 1024,
    "message": "Acta registrada con éxito."
  }
  ```

---

### 👤 3.3. Gestión de Personas/Ciudadanos

#### A. Listar/Buscar Personas
* **Método:** `GET`
* **Ruta:** `/personas`
* **Parámetros de consulta:**
  * `q`: Búsqueda por DNI o nombres/apellidos.
* **Respuesta Exitosa (200 OK):**
  ```json
  [
    {
      "id": 342,
      "nombres": "Juan",
      "apellido_paterno": "Pérez",
      "apellido_materno": "Gómez",
      "dni": "70321455",
      "fecha_nacimiento": "2024-05-10T05:00:00.000Z"
    }
  ]
  ```

---

### 🔍 3.4. Portal de Verificación Pública (Sin Autenticación)

Este endpoint permite a sistemas de consulta rápida verificar la validez de una constancia o trámite emitido por el sistema usando su código numérico de identificación (impreso en el pie del documento). **No requiere cabeceras de autorización.**

* **Método:** `GET`
* **Ruta:** `/verificar/solicitud/:id`
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "valido": true,
    "constancia": {
      "numero": "000321",
      "tipo_solicitud": "COPIA_CERTIFICADA",
      "estado": "ATENDIDO",
      "fecha_solicitud": "2026-07-15T14:30:00.000Z",
      "fecha_atencion": "2026-07-16T10:00:00.000Z",
      "solicitante": "J. Pérez Gómez",
      "cantidad_documentos": 2,
      "total": "20.00",
      "atendido_por": "Ana Espinoza"
    }
  }
  ```
* **Respuesta en caso de código inválido o inexistente (404 Not Found):**
  ```json
  {
    "valido": false,
    "message": "No se encontró ninguna constancia con ese número. Verifique que el código sea correcto."
  }
  ```

---

## 🚫 4. Manejo de Errores y Códigos HTTP

La API REST responde utilizando códigos de estado HTTP estándar. Todas las respuestas de error tienen el siguiente formato:

```json
{
  "message": "Detalle descriptivo del error presentado"
}
```

### Códigos de Retorno Comunes:

| Código HTTP | Significado | Causa común |
| :--- | :--- | :--- |
| **200 OK** | Éxito | Operación completada con datos de retorno. |
| **201 Created** | Creado | Nuevo registro insertado con éxito. |
| **400 Bad Request** | Solicitud incorrecta | Falta de campos obligatorios o formatos inválidos. |
| **401 Unauthorized** | No autenticado | Token JWT omitido, dañado o expirado. Retorna campo `code: "TOKEN_EXPIRED"` si requiere refresco. |
| **403 Forbidden** | Acceso prohibido | El usuario/sistema no cuenta con el rol o permisos requeridos para la acción. |
| **404 Not Found** | No encontrado | El recurso solicitado (acta, persona, solicitud) no existe. |
| **429 Too Many Requests**| Límite excedido | Se sobrepasaron las peticiones máximas por minuto por IP (ej: login o verificación pública). |
| **500 Internal Error** | Error de servidor | Excepción no controlada en base de datos o lógica del API. |

---

## 🛡️ 5. Restricciones y Seguridad

1. **CORS:** La API restringe las llamadas cruzadas en navegadores. Si consumes las APIs mediante Axios/Fetch en un frontend de otro dominio, el dominio de origen debe estar en la lista blanca (`FRONTEND_URL` del backend). Peticiones backend-to-backend (ej. curl, Node.js, PHP, Python, Java) no están limitadas por CORS.
2. **Rate Limiting:** El endpoint `/api/verificar/*` posee una restricción activa de seguridad contra raspado de datos (*scraping*) de máximo **20 consultas por minuto por dirección IP**.
