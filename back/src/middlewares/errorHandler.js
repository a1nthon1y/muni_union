import logger from "../config/logger.js";

const DB_ERROR_MAP = {
    "23502": "Faltan datos obligatorios en la solicitud.",
    "23503": "El registro referenciado no existe o fue eliminado.",
    "23505": "Ya existe un registro con esos datos (valor duplicado).",
    "22P02": "Formato de datos inválido.",
    "42703": "Error interno de configuración (columna desconocida).",
    "08006": "No se pudo conectar a la base de datos.",
    "08001": "No se pudo conectar a la base de datos.",
};

export const errorHandler = (err, req, res, _next) => {
    logger.error({ err, url: req.url, method: req.method }, "Error no controlado");

    // Errores de PostgreSQL (código en err.code)
    if (err.code && DB_ERROR_MAP[err.code]) {
        return res.status(400).json({ message: DB_ERROR_MAP[err.code] });
    }

    // Error genérico — no exponer detalles en producción
    const isProd = process.env.NODE_ENV === "production";
    res.status(500).json({
        message: isProd
            ? "Error interno del servidor. Contacte al administrador."
            : err.message,
    });
};
