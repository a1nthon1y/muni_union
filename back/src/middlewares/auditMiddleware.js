/**
 * Middleware de auditoría automática.
 *
 * Se aplica DESPUÉS del middleware auth (req.user disponible).
 * Registra en la tabla auditoria TODAS las peticiones autenticadas
 * que terminan con status < 400, usando res.on('finish').
 *
 * Las operaciones de escritura (POST/PUT/PATCH/DELETE) que ya tienen
 * registrarAccion() manual en sus controllers setean req.auditHandled = true
 * para evitar duplicados.  Los GETs siempre pasan por aquí.
 */

import { registrarAccion } from "../services/auditoria.service.js";

// Mapa URL → nombre de tabla legible
const TABLE_FROM_PATH = (path) => {
    const seg = path.replace(/^\/api\//, "").split("/")[0];
    const map = {
        actas:       "actas",
        personas:    "personas",
        usuarios:    "usuarios",
        solicitudes: "solicitudes",
        documentos:  "documentos",
        auditoria:   "auditoria",
        reportes:    "reportes",
        importacion: "importacion",
        auth:        "sesiones",
    };
    return map[seg] ?? seg;
};

// Operación según método HTTP
const OP_FROM_METHOD = {
    GET:    "READ",
    POST:   "CREATE",
    PUT:    "UPDATE",
    PATCH:  "UPDATE",
    DELETE: "DELETE",
};

// Descripción automática según ruta
const buildDescription = (method, originalUrl, params) => {
    const path = originalUrl.split("?")[0];
    const id   = params?.id ? ` ID:${params.id}` : "";
    const q    = originalUrl.includes("?") ? ` [${decodeURIComponent(originalUrl.split("?")[1])}]` : "";

    if (path.includes("/auth/me"))      return "Verificación de sesión activa";
    if (path.includes("/auth/refresh")) return "Renovación de token de sesión";
    if (path.includes("/reportes"))     return `Consulta de reporte${q}`;
    if (path.includes("/buscar"))       return `Búsqueda de ciudadano${q}`;
    if (path.includes("/auditoria"))    return `Consulta de registro de auditoría${q}`;

    const table = TABLE_FROM_PATH(path);
    switch (method) {
        case "GET":   return id ? `Consulta ${table}${id}` : `Listado de ${table}${q}`;
        default:      return `${method} ${path}`;
    }
};

export const auditMiddleware = (req, res, next) => {
    res.on("finish", async () => {
        // No registrar errores del cliente/servidor ni preflight
        if (res.statusCode >= 400) return;
        if (req.method === "OPTIONS") return;
        // No registrar archivos estáticos
        if (req.originalUrl.startsWith("/uploads")) return;

        // Escrituras ya auditadas manualmente en el controller → saltar
        if (req.auditHandled) return;

        // Solo auditar GETs automáticamente.
        // Los writes sin req.auditHandled (edge case) también se capturan.
        if (!req.user) return; // sin autenticación no hay quién registrar

        try {
            await registrarAccion({
                usuario_id:     req.user.id,
                tabla_afectada: TABLE_FROM_PATH(req.originalUrl.split("?")[0]),
                operacion:      OP_FROM_METHOD[req.method] ?? req.method,
                registro_id:    req.params?.id ? parseInt(req.params.id) : 0,
                ip:             req.ip,
                descripcion:    buildDescription(req.method, req.originalUrl, req.params),
            });
        } catch {
            // silencioso — error en auditoría no debe romper la respuesta
        }
    });
    next();
};
