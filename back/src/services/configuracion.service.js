import { pool } from "../config/db.js";

const CLAVE_URL = "url_verificacion_publica";
const DEFAULT_URL = "https://172.16.3.21";

const normalizarUrl = (valor) => {
    const limpia = String(valor || "").trim().replace(/\/+$/, "");
    if (!limpia) throw new Error("La URL pública de verificación es obligatoria.");

    let parsed;
    try {
        parsed = new URL(limpia);
    } catch {
        throw new Error("La URL no es válida. Use el formato https://dominio o https://IP");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("La URL debe empezar con http:// o https://");
    }

    return limpia;
};

export const obtenerConfiguracion = async () => {
    const { rows } = await pool.query(
        `SELECT clave, valor, descripcion, fecha_modificacion
         FROM configuracion_sistema
         WHERE clave = $1`,
        [CLAVE_URL]
    );

    const url = rows[0]?.valor || DEFAULT_URL;
    return {
        url_verificacion_publica: url,
        descripcion: rows[0]?.descripcion || null,
        fecha_modificacion: rows[0]?.fecha_modificacion || null,
        ejemplo_verificacion: `${url}/verificar/000001`,
    };
};

export const actualizarUrlVerificacion = async (urlRaw) => {
    const url = normalizarUrl(urlRaw);

    const { rows } = await pool.query(
        `INSERT INTO configuracion_sistema (clave, valor, descripcion, fecha_modificacion)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (clave) DO UPDATE
           SET valor = EXCLUDED.valor,
               fecha_modificacion = NOW()
         RETURNING clave, valor, descripcion, fecha_modificacion`,
        [
            CLAVE_URL,
            url,
            "URL base impresa en constancias para verificación pública. Puede ser la IP interna o un dominio público (sin barra final).",
        ]
    );

    return {
        url_verificacion_publica: rows[0].valor,
        descripcion: rows[0].descripcion,
        fecha_modificacion: rows[0].fecha_modificacion,
        ejemplo_verificacion: `${rows[0].valor}/verificar/000001`,
    };
};
