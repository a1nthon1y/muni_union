import { pool } from "../config/db.js";
import { resolverFechasPersona } from "./persona-fechas.service.js";

const PERSONA_COLS = `
    p.id, p.dni, p.tipo_documento_id,
    td.nombre AS tipo_documento,
    p.nombres, p.apellido_paterno, p.apellido_materno,
    p.sexo, p.fecha_nacimiento, p.fecha_fallecimiento, p.telefono, p.direccion,
    p.observaciones, p.fecha_registro
`;

// Resuelve tipo_documento_id: acepta el id numérico directo O el nombre de texto
const resolverTipoDocIdFromDatos = async (datos, db = pool) => {
    if (datos.tipo_documento_id) return parseInt(datos.tipo_documento_id);
    if (datos.tipo_documento) {
        const { rows } = await db.query(
            "SELECT id FROM tipos_documento WHERE UPPER(nombre) = UPPER($1) LIMIT 1",
            [datos.tipo_documento]
        );
        if (rows.length > 0) return rows[0].id;
    }
    return 1; // Default: DNI
};

export const crearPersona = async (datos, usuario_id, db = pool) => {
    const {
        dni,
        nombres, apellido_paterno, apellido_materno,
        sexo, telefono, direccion, observaciones,
    } = datos;

    const tipo_documento_id = await resolverTipoDocIdFromDatos(datos, db);
    const { fecha_nacimiento, fecha_fallecimiento } = resolverFechasPersona(null, datos);

    const { rows } = await db.query(
        `INSERT INTO personas
           (dni, tipo_documento_id, nombres, apellido_paterno, apellido_materno,
            sexo, fecha_nacimiento, fecha_fallecimiento, telefono, direccion, observaciones, usuario_registro)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id`,
        [
            dni || null,
            tipo_documento_id,
            nombres, apellido_paterno, apellido_materno,
            sexo || null,
            fecha_nacimiento || null,
            fecha_fallecimiento || null,
            telefono || null, direccion || null, observaciones || null,
            usuario_id,
        ]
    );

    return obtenerPersonaPorId(rows[0].id, db);
};

export const listarPersonas = async (filtros = {}) => {
    const { termino, page = 1, limit = 10 } = filtros;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = "WHERE p.fecha_eliminacion IS NULL";
    const params = [];

    if (termino) {
        // Usa los índices GIN (pg_trgm) creados sobre la expresión concatenada y dni
        whereClause += ` AND (
            (p.apellido_paterno || ' ' || p.apellido_materno || ' ' || p.nombres) ILIKE $1
            OR p.dni ILIKE $1
        )`;
        params.push(`%${termino}%`);
    }

    const fromClause = `FROM personas p JOIN tipos_documento td ON td.id = p.tipo_documento_id`;

    const totalRes = await pool.query(
        `SELECT COUNT(*) AS total ${fromClause} ${whereClause}`,
        params
    );
    const total = parseInt(totalRes.rows[0].total);

    const dataRes = await pool.query(
        `SELECT ${PERSONA_COLS}
         ${fromClause}
         ${whereClause}
         ORDER BY p.apellido_paterno, p.apellido_materno, p.nombres
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
    );

    return {
        data: dataRes.rows,
        total,
        pagination: {
            total,
            page:       parseInt(page),
            limit:      parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

export const obtenerPersonaPorId = async (id, db = pool) => {
    const { rows } = await db.query(
        `SELECT ${PERSONA_COLS}
         FROM personas p
         JOIN tipos_documento td ON td.id = p.tipo_documento_id
         WHERE p.id = $1 AND p.fecha_eliminacion IS NULL`,
        [id]
    );
    return rows[0];
};

export const actualizarPersona = async (id, datos, db = pool) => {
    const {
        dni,
        nombres, apellido_paterno, apellido_materno,
        sexo, telefono, direccion, observaciones,
    } = datos;

    const actual = await obtenerPersonaPorId(id, db);
    if (!actual) return null;

    // Acepta tipo_documento_id numérico O tipo_documento nombre de texto
    const tipo_documento_id = datos.tipo_documento_id || datos.tipo_documento
        ? await resolverTipoDocIdFromDatos(datos, db)
        : null;
    const { fecha_nacimiento, fecha_fallecimiento } = resolverFechasPersona(actual, datos);

    const { rowCount } = await db.query(
        `UPDATE personas SET
            dni               = COALESCE($1, dni),
            tipo_documento_id = COALESCE($2, tipo_documento_id),
            nombres           = COALESCE($3, nombres),
            apellido_paterno  = COALESCE($4, apellido_paterno),
            apellido_materno  = COALESCE($5, apellido_materno),
            sexo              = COALESCE($6, sexo),
            fecha_nacimiento  = $7,
            fecha_fallecimiento = $8,
            telefono          = COALESCE($9, telefono),
            direccion         = COALESCE($10, direccion),
            observaciones     = COALESCE($11, observaciones)
         WHERE id = $12 AND fecha_eliminacion IS NULL`,
        [
            dni || null, tipo_documento_id || null,
            nombres, apellido_paterno, apellido_materno,
            sexo || null, fecha_nacimiento, fecha_fallecimiento,
            telefono || null, direccion || null, observaciones || null,
            id,
        ]
    );

    if (rowCount === 0) return null;
    return obtenerPersonaPorId(id, db);
};

export const buscarPersonaPorNombres = async (nombres, apellido_paterno, apellido_materno) => {
    const { rows } = await pool.query(
        `SELECT ${PERSONA_COLS}
         FROM personas p
         JOIN tipos_documento td ON td.id = p.tipo_documento_id
         WHERE p.nombres = $1
           AND p.apellido_paterno = $2
           AND p.apellido_materno = $3
           AND p.fecha_eliminacion IS NULL`,
        [nombres, apellido_paterno, apellido_materno]
    );
    return rows;
};

export const eliminarPersona = async (id, usuario_id) => {
    const actasCheck = await pool.query(
        `SELECT COUNT(*) AS total FROM actas
         WHERE (persona_principal_id = $1 OR persona_secundaria_id = $1)
           AND fecha_eliminacion IS NULL`,
        [id]
    );

    const totalActas = parseInt(actasCheck.rows[0].total);
    if (totalActas > 0) {
        throw new Error(
            `No se puede eliminar este ciudadano porque está vinculado a ${totalActas} acta(s) registrada(s). ` +
            "Debe eliminar las actas asociadas primero o contactar al administrador."
        );
    }

    const { rows } = await pool.query(
        `UPDATE personas
         SET fecha_eliminacion = NOW(), usuario_eliminacion = $1
         WHERE id = $2
         RETURNING id`,
        [usuario_id, id]
    );
    return rows[0];
};

export const reactivarPersona = async (id) => {
    const { rowCount } = await pool.query(
        "UPDATE personas SET fecha_eliminacion = NULL WHERE id = $1",
        [id]
    );
    if (rowCount === 0) return null;
    return obtenerPersonaPorId(id);
};

export const listarTiposDocumento = async () => {
    const { rows } = await pool.query("SELECT id, nombre FROM tipos_documento ORDER BY nombre");
    return rows;
};
