import { pool } from "../config/db.js";

export const crearPersona = async (datos, usuario_id) => {
    const { dni, tipo_documento, nombres, apellido_paterno, apellido_materno, sexo, fecha_nacimiento, telefono, direccion, observaciones } = datos;

    const { rows } = await pool.query(
        `
    INSERT INTO personas 
      (dni, tipo_documento, nombres, apellido_paterno, apellido_materno, sexo, fecha_nacimiento, telefono, direccion, observaciones, usuario_registro)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
    `,
        [dni || null, tipo_documento || 'DNI', nombres, apellido_paterno, apellido_materno, sexo, fecha_nacimiento || null, telefono, direccion, observaciones, usuario_id]
    );

    return rows[0];
};

export const listarPersonas = async (filtros = {}) => {
    const { termino, limit = 10, offset = 0 } = filtros;
    let query = `
    FROM personas 
    WHERE fecha_eliminacion IS NULL
  `;
    const params = [];

    if (termino) {
        query += ` AND (
      dni LIKE $1 OR 
      nombres ILIKE $1 OR 
      apellido_paterno ILIKE $1 OR 
      apellido_materno ILIKE $1 OR
      (apellido_paterno || ' ' || apellido_materno) ILIKE $1 OR
      (apellido_paterno || ' ' || apellido_materno || ' ' || nombres) ILIKE $1 OR
      (nombres || ' ' || apellido_paterno || ' ' || apellido_materno) ILIKE $1 OR
      (apellido_paterno || ' ' || nombres) ILIKE $1
    )`;
        params.push(`%${termino}%`);
    }

    // Obtener total
    const totalRes = await pool.query(`SELECT COUNT(*) as total ${query}`, params);
    const total = parseInt(totalRes.rows[0].total);

    // Obtener datos
    const dataRes = await pool.query(
        `SELECT * ${query} ORDER BY apellido_paterno, apellido_materno, nombres LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
    );

    return { data: dataRes.rows, total };
};

export const obtenerPersonaPorId = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM personas WHERE id = $1 AND fecha_eliminacion IS NULL",
        [id]
    );
    return rows[0];
};

export const actualizarPersona = async (id, datos, usuario_id) => {
    const { dni, tipo_documento, nombres, apellido_paterno, apellido_materno, sexo, fecha_nacimiento, telefono, direccion, observaciones } = datos;

    const { rows } = await pool.query(
        `
    UPDATE personas 
    SET 
      dni = COALESCE($1, dni),
      tipo_documento = COALESCE($2, tipo_documento),
      nombres = COALESCE($3, nombres),
      apellido_paterno = COALESCE($4, apellido_paterno),
      apellido_materno = COALESCE($5, apellido_materno),
      sexo = COALESCE($6, sexo),
      fecha_nacimiento = COALESCE($7, fecha_nacimiento),
      telefono = COALESCE($8, telefono),
      direccion = COALESCE($9, direccion),
      observaciones = COALESCE($10, observaciones)
    WHERE id = $11 AND fecha_eliminacion IS NULL
    RETURNING *
    `,
        [dni || null, tipo_documento, nombres, apellido_paterno, apellido_materno, sexo, fecha_nacimiento || null, telefono, direccion, observaciones, id]
    );

    return rows[0];
};

export const buscarPersonaPorNombres = async (nombres, apellido_paterno, apellido_materno) => {
    const { rows } = await pool.query(
        `
    SELECT * FROM personas 
    WHERE nombres = $1 
      AND apellido_paterno = $2 
      AND apellido_materno = $3 
      AND fecha_eliminacion IS NULL
    `,
        [nombres, apellido_paterno, apellido_materno]
    );
    return rows;
};

export const eliminarPersona = async (id, usuario_id) => {
    // Verificar si la persona tiene actas asociadas
    const actasCheck = await pool.query(
        "SELECT COUNT(*) as total FROM actas WHERE persona_principal_id = $1 AND fecha_eliminacion IS NULL",
        [id]
    );

    const totalActas = parseInt(actasCheck.rows[0].total);

    if (totalActas > 0) {
        throw new Error(
            `No se puede eliminar este ciudadano porque tiene ${totalActas} acta(s) registrada(s). Debe eliminar las actas asociadas primero o contactar al administrador.`
        );
    }

    // Proceder con eliminación lógica
    const { rows } = await pool.query(
        `
    UPDATE personas 
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

export const reactivarPersona = async (id, usuario_id) => {
    const { rows } = await pool.query(
        `
    UPDATE personas 
    SET 
      fecha_eliminacion = NULL
    WHERE id = $1
    RETURNING *
    `,
        [id]
    );
    return rows[0];
};

export const listarTiposDocumento = async () => {
    const { rows } = await pool.query("SELECT * FROM tipos_documento ORDER BY nombre");
    return rows;
};
