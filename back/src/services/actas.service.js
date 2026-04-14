import { pool } from "../config/db.js";
import fs from "fs";
import path from "path";
import logger from "../config/logger.js";

// Columnas del titular (sin prefijo — compatibilidad con frontend existente)
const TITULAR_COLS = `
    p.nombres, p.apellido_paterno, p.apellido_materno,
    p.dni, p.sexo, p.fecha_nacimiento, p.telefono, p.direccion
`;

// Columnas del cónyuge con prefijo p2_ (solo para matrimonios)
const CONYUGE_COLS = `
    p2.nombres          AS p2_nombres,
    p2.apellido_paterno AS p2_apellido_paterno,
    p2.apellido_materno AS p2_apellido_materno,
    p2.dni              AS p2_dni,
    p2.sexo             AS p2_sexo,
    p2.fecha_nacimiento AS p2_fecha_nacimiento,
    p2.telefono         AS p2_telefono
`;

export const crearActa = async (datos, usuario_id) => {
    const {
        tipo_acta, numero_acta, anio,
        persona_principal_id, persona_secundaria_id,
        fecha_acta, observaciones,
    } = datos;

    if (tipo_acta === 'MATRIMONIO' && !persona_secundaria_id) {
        throw new Error("El acta de MATRIMONIO requiere registrar al cónyuge (persona_secundaria_id).");
    }

    const { rows } = await pool.query(
        `INSERT INTO actas
           (tipo_acta, numero_acta, anio, persona_principal_id, persona_secundaria_id,
            fecha_acta, observaciones, usuario_registro)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [tipo_acta, numero_acta, anio, persona_principal_id,
         persona_secundaria_id || null, fecha_acta, observaciones, usuario_id]
    );
    return rows[0];
};

export const listarActas = async (filtros = {}) => {
    const { q, tipo, anio, dni, numero, fecha_desde, fecha_hasta, page = 1, limit = 10 } = filtros;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryBase = `
        FROM actas a
        INNER JOIN personas p  ON a.persona_principal_id = p.id
        LEFT JOIN  personas p2 ON a.persona_secundaria_id = p2.id
        WHERE a.fecha_eliminacion IS NULL
    `;
    const params = [];

    if (q) {
        params.push(`%${q}%`);
        queryBase += ` AND (
            (p.apellido_paterno  || ' ' || p.apellido_materno  || ' ' || p.nombres)  ILIKE $${params.length}
            OR (p2.apellido_paterno || ' ' || p2.apellido_materno || ' ' || p2.nombres) ILIKE $${params.length}
            OR p.dni  ILIKE $${params.length}
            OR p2.dni ILIKE $${params.length}
        )`;
    }
    if (tipo)   { params.push(tipo);          queryBase += ` AND a.tipo_acta = $${params.length}`; }
    if (anio)   { params.push(parseInt(anio)); queryBase += ` AND a.anio = $${params.length}`; }
    if (numero) { params.push(`%${numero}%`); queryBase += ` AND a.numero_acta ILIKE $${params.length}`; }
    if (dni) {
        params.push(`%${dni}%`);
        queryBase += ` AND (p.dni ILIKE $${params.length} OR p2.dni ILIKE $${params.length})`;
    }
    if (fecha_desde) {
        params.push(fecha_desde);
        queryBase += ` AND a.fecha_acta >= $${params.length}`;
    }
    if (fecha_hasta) {
        params.push(fecha_hasta);
        queryBase += ` AND a.fecha_acta <= $${params.length}`;
    }

    const total = parseInt(
        (await pool.query(`SELECT COUNT(*) AS total ${queryBase}`, params)).rows[0].total
    );

    const dataQuery = `
        SELECT
            a.id, a.tipo_acta, a.numero_acta, a.anio, a.fecha_acta, a.estado,
            a.observaciones, a.fecha_registro,
            a.persona_principal_id, a.persona_secundaria_id,
            ${TITULAR_COLS},
            ${CONYUGE_COLS},
            EXISTS(SELECT 1 FROM documentos_digitales d
                   WHERE d.acta_id = a.id AND d.fecha_eliminacion IS NULL)::BOOLEAN AS tiene_documento,
            (SELECT d.tipo_archivo FROM documentos_digitales d
             WHERE d.acta_id = a.id AND d.fecha_eliminacion IS NULL
             ORDER BY d.fecha_registro DESC LIMIT 1) AS tipo_documento,
            (SELECT d.ruta_archivo FROM documentos_digitales d
             WHERE d.acta_id = a.id AND d.fecha_eliminacion IS NULL
             ORDER BY d.fecha_registro DESC LIMIT 1) AS ruta_archivo
        ${queryBase}
        ORDER BY a.fecha_registro DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit), offset);
    const { rows } = await pool.query(dataQuery, params);

    return {
        data: rows,
        pagination: {
            total,
            page:       parseInt(page),
            limit:      parseInt(limit),
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const obtenerActaPorId = async (id) => {
    const { rows } = await pool.query(
        `        SELECT
             a.*,
             ${TITULAR_COLS},
             ${CONYUGE_COLS},
             d.nombre_archivo, d.tipo_archivo, d.ruta_archivo
         FROM actas a
         JOIN  personas p  ON a.persona_principal_id = p.id
         LEFT JOIN personas p2 ON a.persona_secundaria_id = p2.id
         LEFT JOIN documentos_digitales d ON a.id = d.acta_id AND d.fecha_eliminacion IS NULL
         WHERE a.id = $1 AND a.fecha_eliminacion IS NULL`,
        [id]
    );
    return rows[0];
};

export const actualizarActa = async (id, datos) => {
    const {
        tipo_acta, numero_acta, anio,
        persona_principal_id, persona_secundaria_id,
        fecha_acta, estado, observaciones,
    } = datos;

    const { rows } = await pool.query(
        `UPDATE actas SET
            tipo_acta             = COALESCE($1, tipo_acta),
            numero_acta           = COALESCE($2, numero_acta),
            anio                  = COALESCE($3, anio),
            persona_principal_id  = COALESCE($4, persona_principal_id),
            persona_secundaria_id = COALESCE($5, persona_secundaria_id),
            fecha_acta            = COALESCE($6, fecha_acta),
            estado                = COALESCE($7, estado),
            observaciones         = COALESCE($8, observaciones)
         WHERE id = $9 AND fecha_eliminacion IS NULL
         RETURNING *`,
        [tipo_acta, numero_acta, anio, persona_principal_id,
         persona_secundaria_id ?? null, fecha_acta, estado, observaciones, id]
    );
    return rows[0];
};

export const eliminarActa = async (id, usuario_id) => {
    const docResult = await pool.query(
        `SELECT id, ruta_archivo FROM documentos_digitales
         WHERE acta_id = $1 AND fecha_eliminacion IS NULL`,
        [id]
    );

    if (docResult.rows.length > 0) {
        const doc = docResult.rows[0];
        await pool.query(
            `UPDATE documentos_digitales
             SET fecha_eliminacion = NOW(), usuario_eliminacion = $1
             WHERE acta_id = $2`,
            [usuario_id, id]
        );
        if (doc.ruta_archivo) {
            const filePath = path.resolve(doc.ruta_archivo);
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (err) {
                logger.warn({ err }, "No se pudo borrar el archivo físico del acta");
            }
        }
    }

    const { rows } = await pool.query(
        `UPDATE actas
         SET fecha_eliminacion = NOW(), usuario_eliminacion = $1
         WHERE id = $2
         RETURNING id`,
        [usuario_id, id]
    );
    return rows[0];
};

export const cambiarEstadoActa = async (id, estado, usuario_id, motivo = null) => {
    const setMotivo = motivo
        ? `observaciones = CASE
               WHEN observaciones IS NULL OR observaciones = '' THEN $2
               ELSE observaciones || E'\\n' || $2
           END,`
        : '';
    const params = motivo ? [estado, `[ANULADO] ${motivo}`, id] : [estado, id];

    const { rows } = await pool.query(
        `UPDATE actas SET estado = $1, ${setMotivo}
         fecha_registro = fecha_registro
         WHERE id = $${params.length} AND fecha_eliminacion IS NULL
         RETURNING *`,
        params
    );
    return rows[0];
};

export const reactivarActa = async (id) => {
    const { rows } = await pool.query(
        `UPDATE actas
         SET fecha_eliminacion = NULL, estado = 'ACTIVO'
         WHERE id = $1
         RETURNING *`,
        [id]
    );
    return rows[0];
};

/**
 * Calcula el siguiente número de acta disponible.
 *
 * Modo CLASICO: busca folios con patrón "{PREFIX}-L{libro}-{folio}"
 *   dentro del mismo tipo_acta + libro + anio, devuelve MAX(folio) + 1.
 *
 * Modo CUI: busca numero_acta numérico (sin formato clásico)
 *   dentro del mismo tipo_acta + anio, devuelve MAX + 1.
 *   Si los valores no son numéricos devuelve null (no sugiere).
 */
export const obtenerSiguienteNumero = async ({ tipo_acta, anio, modo, libro }) => {
    if (modo === "CLASICO") {
        const prefixes = { NACIMIENTO: "NAC", MATRIMONIO: "MAT", DEFUNCION: "DEF" };
        const prefix   = prefixes[tipo_acta] ?? "ACT";
        const pattern  = `${prefix}-L${libro}-%`;

        const { rows } = await pool.query(
            `SELECT numero_acta
             FROM actas
             WHERE tipo_acta = $1
               AND anio = $2
               AND numero_acta ILIKE $3
               AND fecha_eliminacion IS NULL`,
            [tipo_acta, parseInt(anio), pattern]
        );

        // Extrae el folio numérico de "NAC-L1-45" → 45
        const folios = rows
            .map(r => {
                const parts = String(r.numero_acta).split("-");
                return parseInt(parts[parts.length - 1]);
            })
            .filter(n => !isNaN(n));

        return { siguiente: folios.length ? Math.max(...folios) + 1 : 1 };
    }

    // ── Modo CUI ──────────────────────────────────────────────────────────────
    const { rows } = await pool.query(
        `SELECT numero_acta
         FROM actas
         WHERE tipo_acta = $1
           AND anio = $2
           AND numero_acta NOT ILIKE '%-L%-%'
           AND fecha_eliminacion IS NULL`,
        [tipo_acta, parseInt(anio)]
    );

    const nums = rows
        .map(r => parseInt(String(r.numero_acta).replace(/\D/g, "")))
        .filter(n => !isNaN(n) && n > 0);

    return { siguiente: nums.length ? Math.max(...nums) + 1 : null };
};
