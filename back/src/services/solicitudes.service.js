import { pool } from "../config/db.js";

/* ---------------- SOLICITANTES ---------------- */
export const crearSolicitante = async (datos) => {
    const { dni, nombres, apellidos, telefono, direccion } = datos;
    const { rows } = await pool.query(
        `INSERT INTO solicitantes (dni, nombres, apellidos, telefono, direccion) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [dni, nombres, apellidos, telefono, direccion]
    );
    return rows[0];
};

export const buscarSolicitantePorDni = async (dni) => {
    const { rows } = await pool.query(
        "SELECT id, dni, nombres, apellidos, telefono, direccion FROM solicitantes WHERE dni = $1",
        [dni]
    );
    return rows[0];
};

export const actualizarSolicitante = async (id, datos) => {
    const { nombres, apellidos, telefono, direccion } = datos;
    const { rows } = await pool.query(
        `UPDATE solicitantes 
     SET nombres = $1, apellidos = $2, telefono = $3, direccion = $4
     WHERE id = $5 RETURNING *`,
        [nombres, apellidos, telefono, direccion, id]
    );
    return rows[0];
};

/* ---------------- SOLICITUDES ---------------- */
export const crearSolicitud = async (datos, usuario_id) => {
    const { solicitante_id, tipo_solicitud, observaciones, detalles } = datos;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Insertar Cabecera
        const resSolicitud = await client.query(
            `INSERT INTO solicitudes (solicitante_id, tipo_solicitud, observaciones, usuario_registro) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [solicitante_id, tipo_solicitud, observaciones, usuario_id]
        );
        const solicitud = resSolicitud.rows[0];

        // 2. Insertar Detalle (si aplica)
        if (detalles && detalles.length > 0) {
            for (const item of detalles) {
                await client.query(
                    `INSERT INTO detalle_solicitud (solicitud_id, acta_id, cantidad, precio_unitario, total)
           VALUES ($1, $2, $3, $4, $5)`,
                    [solicitud.id, item.acta_id, item.cantidad || 1, item.precio_unitario || 0, (item.cantidad || 1) * (item.precio_unitario || 0)]
                );
            }
        }

        await client.query("COMMIT");
        return solicitud;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const listarSolicitudes = async (filtros = {}) => {
    const { estado, q, fecha_desde, fecha_hasta, page = 1, limit = 10 } = filtros;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
    FROM solicitudes s
    JOIN solicitantes sl ON s.solicitante_id = sl.id
    LEFT JOIN usuarios ua ON s.usuario_atencion = ua.id
    WHERE s.fecha_eliminacion IS NULL
  `;
    const params = [];

    if (estado) {
        params.push(estado);
        query += ` AND s.estado = $${params.length}`;
    }

    if (q) {
        // Búsqueda por ID exacto si el término es numérico, o texto en nombre/DNI
        if (/^\d+$/.test(q.trim())) {
            params.push(parseInt(q.trim()));
            query += ` AND s.id = $${params.length}`;
        } else {
            params.push(`%${q}%`);
            query += ` AND (
                sl.dni ILIKE $${params.length} OR
                sl.nombres ILIKE $${params.length} OR
                sl.apellidos ILIKE $${params.length} OR
                (sl.nombres || ' ' || sl.apellidos) ILIKE $${params.length} OR
                (sl.apellidos || ' ' || sl.nombres) ILIKE $${params.length}
            )`;
        }
    }

    if (fecha_desde) {
        params.push(fecha_desde);
        query += ` AND s.fecha_solicitud >= $${params.length}`;
    }

    if (fecha_hasta) {
        params.push(fecha_hasta);
        query += ` AND s.fecha_solicitud <= $${params.length}::date + INTERVAL '1 day'`;
    }

    const total = parseInt(
        (await pool.query(`SELECT COUNT(*) as total ${query}`, params)).rows[0].total
    );

    const dataRes = await pool.query(
        `SELECT s.*,
                sl.nombres as solicitante_nombres, sl.apellidos as solicitante_apellidos,
                sl.dni as solicitante_dni, sl.telefono as solicitante_telefono, sl.direccion as solicitante_direccion,
                ua.nombres as usuario_atencion_nombres, ua.apellidos as usuario_atencion_apellidos
         ${query}
         ORDER BY s.fecha_solicitud DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, parseInt(limit), offset]
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

export const obtenerSolicitudPorId = async (id) => {
    const { rows: cabecera } = await pool.query(
        `SELECT
            s.*,
            sl.nombres as solicitante_nombres, sl.apellidos as solicitante_apellidos,
            sl.dni as solicitante_dni, sl.telefono as solicitante_telefono, sl.direccion as solicitante_direccion,
            ua.nombres as usuario_atencion_nombres, ua.apellidos as usuario_atencion_apellidos
         FROM solicitudes s
         JOIN solicitantes sl ON s.solicitante_id = sl.id
         LEFT JOIN usuarios ua ON s.usuario_atencion = ua.id
         WHERE s.id = $1 AND s.fecha_eliminacion IS NULL`,
        [id]
    );

    if (cabecera.length === 0) return null;

    const { rows: detalles } = await pool.query(
        `SELECT d.*, a.tipo_acta, a.numero_acta, a.anio, doc.ruta_archivo, doc.tipo_archivo
     FROM detalle_solicitud d
     LEFT JOIN actas a ON d.acta_id = a.id
     LEFT JOIN documentos_digitales doc ON a.id = doc.acta_id AND doc.fecha_eliminacion IS NULL
     WHERE d.solicitud_id = $1`,
        [id]
    );

    return { ...cabecera[0], detalles };
};

export const atenderSolicitud = async (id, usuario_id) => {
    const { rows } = await pool.query(
        `UPDATE solicitudes
         SET estado = 'ATENDIDO', fecha_atencion = NOW(), usuario_atencion = $1
         WHERE id = $2 AND fecha_eliminacion IS NULL
         RETURNING *`,
        [usuario_id, id]
    );
    return rows[0];
};

export const anularSolicitud = async (id, usuario_id, motivo = "") => {
    const { rows } = await pool.query(
        `UPDATE solicitudes
         SET estado = 'ANULADO',
             fecha_atencion = NOW(),
             usuario_atencion = $1,
             observaciones = CASE
                WHEN observaciones IS NULL OR observaciones = '' THEN $2
                ELSE observaciones || E'\n' || $2
             END
         WHERE id = $3 AND fecha_eliminacion IS NULL
         RETURNING *`,
        [usuario_id, motivo ? `[ANULACIÓN] ${motivo}` : '[ANULACIÓN SIN MOTIVO]', id]
    );
    return rows[0];
};

export const eliminarSolicitud = async (id, usuario_id) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // Soft delete en detalle
        await client.query(
            "UPDATE detalle_solicitud SET fecha_eliminacion = NOW() WHERE solicitud_id = $1",
            [id]
        );
        // Soft delete en cabecera
        const { rows } = await client.query(
            `UPDATE solicitudes 
             SET fecha_eliminacion = NOW(), usuario_eliminacion = $1
             WHERE id = $2 AND fecha_eliminacion IS NULL
             RETURNING *`,
            [usuario_id, id]
        );
        await client.query("COMMIT");
        return rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
