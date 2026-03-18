import { pool } from "../config/db.js";

export const crearActa = async (datos, usuario_id) => {
    const { tipo_acta, numero_acta, anio, persona_principal_id, fecha_acta, observaciones } = datos;

    const { rows } = await pool.query(
        `
    INSERT INTO actas 
      (tipo_acta, numero_acta, anio, persona_principal_id, fecha_acta, observaciones, usuario_registro)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
        [tipo_acta, numero_acta, anio, persona_principal_id, fecha_acta, observaciones, usuario_id]
    );

    return rows[0];
};

export const listarActas = async (filtros = {}) => {
    const { q, tipo, anio, dni, numero, page = 1, limit = 10 } = filtros;
    const offset = (page - 1) * limit;

    let queryBase = `
    FROM actas a
    INNER JOIN personas p ON a.persona_principal_id = p.id
    WHERE a.fecha_eliminacion IS NULL
  `;
    const params = [];

    if (q) {
        params.push(`%${q}%`);
        queryBase += ` AND (
          a.numero_acta ILIKE $${params.length} OR
          p.dni LIKE $${params.length} OR
          p.nombres ILIKE $${params.length} OR
          p.apellido_paterno ILIKE $${params.length} OR
          p.apellido_materno ILIKE $${params.length} OR
          (p.apellido_paterno || ' ' || p.apellido_materno) ILIKE $${params.length} OR
          (p.apellido_paterno || ' ' || p.apellido_materno || ' ' || p.nombres) ILIKE $${params.length} OR
          (p.nombres || ' ' || p.apellido_paterno || ' ' || p.apellido_materno) ILIKE $${params.length} OR
          (p.apellido_paterno || ' ' || p.nombres) ILIKE $${params.length}
        )`;
    }

    if (tipo) {
        params.push(tipo);
        queryBase += ` AND a.tipo_acta = $${params.length}`;
    }
    if (anio) {
        params.push(anio);
        queryBase += ` AND a.anio = $${params.length}`;
    }
    if (numero) {
        params.push(`%${numero}%`);
        queryBase += ` AND a.numero_acta ILIKE $${params.length}`;
    }
    if (dni) {
        params.push(`%${dni}%`);
        queryBase += ` AND (
            p.dni LIKE $${params.length} OR 
            p.nombres ILIKE $${params.length} OR 
            p.apellido_paterno ILIKE $${params.length} OR 
            p.apellido_materno ILIKE $${params.length} OR
            (p.apellido_paterno || ' ' || p.apellido_materno) ILIKE $${params.length} OR
            (p.apellido_paterno || ' ' || p.apellido_materno || ' ' || p.nombres) ILIKE $${params.length} OR
            (p.nombres || ' ' || p.apellido_paterno || ' ' || p.apellido_materno) ILIKE $${params.length} OR
            (p.apellido_paterno || ' ' || p.nombres) ILIKE $${params.length}
        )`;
    }

    // Consulta para el total de registros (para paginación)
    const countQuery = `SELECT COUNT(*) as total ${queryBase}`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].total);

    // Consulta para los datos paginados (subquery para evitar duplicados)
    const dataQuery = `
    SELECT 
      a.*,
      p.nombres, p.apellido_paterno, p.apellido_materno, p.dni, p.sexo, p.fecha_nacimiento,
      p.telefono, p.direccion,
      EXISTS(SELECT 1 FROM documentos_digitales d WHERE d.acta_id = a.id AND d.fecha_eliminacion IS NULL)::BOOLEAN as tiene_documento,
      (SELECT d.tipo_archivo FROM documentos_digitales d WHERE d.acta_id = a.id AND d.fecha_eliminacion IS NULL ORDER BY d.fecha_registro DESC LIMIT 1) as tipo_documento,
      (SELECT d.ruta_archivo FROM documentos_digitales d WHERE d.acta_id = a.id AND d.fecha_eliminacion IS NULL ORDER BY d.fecha_registro DESC LIMIT 1) as ruta_archivo
    ${queryBase}
    ORDER BY a.fecha_registro DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

    params.push(parseInt(limit), parseInt(offset));
    const { rows } = await pool.query(dataQuery, params);

    return {
        data: rows,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const obtenerActaPorId = async (id) => {
    const { rows } = await pool.query(
        `
    SELECT 
      a.*, 
      p.nombres, p.apellido_paterno, p.apellido_materno, p.dni, p.sexo, p.fecha_nacimiento,
      p.telefono, p.direccion,
      d.nombre_archivo, d.tipo_archivo, d.ruta_archivo
    FROM actas a
    JOIN personas p ON a.persona_principal_id = p.id
    LEFT JOIN documentos_digitales d ON a.id = d.acta_id
    WHERE a.id = $1 AND a.fecha_eliminacion IS NULL
    `,
        [id]
    );
    return rows[0];
};

export const actualizarActa = async (id, datos, usuario_id) => {
    const { tipo_acta, numero_acta, anio, persona_principal_id, fecha_acta, estado, observaciones } = datos;

    const { rows } = await pool.query(
        `
    UPDATE actas 
    SET 
      tipo_acta = COALESCE($1, tipo_acta),
      numero_acta = COALESCE($2, numero_acta),
      anio = COALESCE($3, anio),
      persona_principal_id = COALESCE($4, persona_principal_id),
      fecha_acta = COALESCE($5, fecha_acta),
      estado = COALESCE($6, estado),
      observaciones = COALESCE($7, observaciones)
    WHERE id = $8 AND fecha_eliminacion IS NULL
    RETURNING *
    `,
        [tipo_acta, numero_acta, anio, persona_principal_id, fecha_acta, estado, observaciones, id]
    );

    return rows[0];
};

export const eliminarActa = async (id, usuario_id) => {
    // 1. Buscar documento digital asociado
    const docResult = await pool.query(
        `SELECT id, ruta_archivo FROM documentos_digitales 
         WHERE acta_id = $1 AND fecha_eliminacion IS NULL`,
        [id]
    );

    // 2. Si hay documento, marcarlo como eliminado y borrar archivo físico
    if (docResult.rows.length > 0) {
        const doc = docResult.rows[0];

        // Soft delete del registro en documentos_digitales
        await pool.query(
            `UPDATE documentos_digitales 
             SET fecha_eliminacion = NOW(), usuario_eliminacion = $1 
             WHERE acta_id = $2`,
            [usuario_id, id]
        );

        // Borrar archivo físico del disco
        if (doc.ruta_archivo) {
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.default.resolve(doc.ruta_archivo);
            try {
                if (fs.default.existsSync(filePath)) {
                    fs.default.unlinkSync(filePath);
                }
            } catch (err) {
                console.error('Error al borrar archivo físico:', err.message);
            }
        }
    }

    // 3. Soft delete del acta
    const { rows } = await pool.query(
        `
    UPDATE actas 
    SET 
      fecha_eliminacion = NOW(), 
      usuario_eliminacion = $1
    WHERE id = $2
    RETURNING id
    `,
        [usuario_id, id]
    );
    return rows[0];
};

export const cambiarEstadoActa = async (id, estado, usuario_id, motivo = null) => {
    let query, params;

    if (motivo) {
        query = `
    UPDATE actas 
    SET 
      estado = $1,
      observaciones = CASE 
        WHEN observaciones IS NULL OR observaciones = '' THEN $2
        ELSE observaciones || E'\n' || $2
      END
    WHERE id = $3 AND fecha_eliminacion IS NULL
    RETURNING *
    `;
        params = [estado, `[ANULADO] ${motivo}`, id];
    } else {
        query = `
    UPDATE actas 
    SET 
      estado = $1
    WHERE id = $2 AND fecha_eliminacion IS NULL
    RETURNING *
    `;
        params = [estado, id];
    }

    const { rows } = await pool.query(query, params);
    return rows[0];
};

export const reactivarActa = async (id, usuario_id) => {
    const { rows } = await pool.query(
        `
    UPDATE actas 
    SET 
      fecha_eliminacion = NULL, 
      estado = 'ACTIVO'
    WHERE id = $1
    RETURNING *
    `,
        [id]
    );
    return rows[0];
};
