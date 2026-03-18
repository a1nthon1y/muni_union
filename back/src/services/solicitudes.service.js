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
    const { rows } = await pool.query("SELECT * FROM solicitantes WHERE dni = $1", [dni]);
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
    const { estado, q, limit = 10, offset = 0 } = filtros;
    let query = `
    FROM solicitudes s
    JOIN solicitantes sl ON s.solicitante_id = sl.id
    LEFT JOIN usuarios ua ON s.usuario_atencion = ua.id
    WHERE 1=1
  `;
    const params = [];

    if (estado) {
        params.push(estado);
        query += ` AND s.estado = $${params.length}`;
    }

    if (q) {
        params.push(`%${q}%`);
        query += ` AND (
            CAST(s.id AS TEXT) LIKE $${params.length} OR
            sl.dni LIKE $${params.length} OR
            sl.nombres ILIKE $${params.length} OR
            sl.apellidos ILIKE $${params.length} OR
            (sl.nombres || ' ' || sl.apellidos) ILIKE $${params.length} OR
            (sl.apellidos || ' ' || sl.nombres) ILIKE $${params.length}
        )`;
    }

    // Obtener total
    const totalRes = await pool.query(`SELECT COUNT(*) as total ${query}`, params);
    const total = parseInt(totalRes.rows[0].total);

    // Obtener datos
    const dataRes = await pool.query(
        `SELECT s.*, 
                sl.nombres as solicitante_nombres, sl.apellidos as solicitante_apellidos, sl.dni as solicitante_dni, sl.telefono as solicitante_telefono, sl.direccion as solicitante_direccion,
                ua.nombres as usuario_atencion_nombres, ua.apellidos as usuario_atencion_apellidos
         ${query} 
         ORDER BY s.fecha_solicitud DESC 
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
    );

    return { data: dataRes.rows, total };
};

export const obtenerSolicitudPorId = async (id) => {
    const { rows: cabecera } = await pool.query(
        `SELECT 
            s.*, 
            sl.nombres as solicitante_nombres, sl.apellidos as solicitante_apellidos, sl.dni as solicitante_dni, sl.telefono as solicitante_telefono, sl.direccion as solicitante_direccion,
            ua.nombres as usuario_atencion_nombres, ua.apellidos as usuario_atencion_apellidos
         FROM solicitudes s 
         JOIN solicitantes sl ON s.solicitante_id = sl.id 
         LEFT JOIN usuarios ua ON s.usuario_atencion = ua.id
         WHERE s.id = $1`,
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
     WHERE id = $2 RETURNING *`,
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
     WHERE id = $3 RETURNING *`,
        [usuario_id, motivo ? `[ANULACIÓN] ${motivo}` : '[ANULACIÓN SIN MOTIVO]', id]
    );
    return rows[0];
};

export const eliminarSolicitud = async (id) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // 1. Borrar detalles primero por integridad referencial
        await client.query("DELETE FROM detalle_solicitud WHERE solicitud_id = $1", [id]);
        // 2. Borrar cabecera
        const { rows } = await client.query("DELETE FROM solicitudes WHERE id = $1 RETURNING *", [id]);
        await client.query("COMMIT");
        return rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
