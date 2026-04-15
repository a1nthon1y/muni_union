import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import { generarUsername } from "../utils/generarUsername.js";
/* ==============================
   CREAR USUARIO
============================== */
export const crearUsuario = async ({
  password,
  nombres,
  apellidos,
  rol_id,
  telefono,
  dni,
  permisos = {}
}) => {

  if (!password || !nombres || !apellidos || !rol_id) {
    throw new Error("Datos incompletos");
  }

  // Generar username automáticamente
  const username = await generarUsername({
    nombres,
    apellidos
  });

  const password_hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    `
    INSERT INTO usuarios
      (username, password_hash, nombres, apellidos, rol_id, telefono, dni)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING 
      id,
      username,
      nombres,
      apellidos,
      rol_id,
      telefono,
      dni,
      activo,
      fecha_registro
    `,
    [username, password_hash, nombres, apellidos, rol_id, telefono, dni]
  );

  const usuario = rows[0];

  // Crear fila de permisos (por defecto todo en false salvo lo que venga explícito)
  await pool.query(
    `INSERT INTO usuario_permisos (usuario_id, actas_anular, actas_eliminar, personas_eliminar)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (usuario_id) DO NOTHING`,
    [
      usuario.id,
      !!permisos.actas_anular,
      !!permisos.actas_eliminar,
      !!permisos.personas_eliminar,
    ]
  );

  return usuario;
};


/* ==============================
   LISTAR USUARIOS
============================== */
export const listarUsuarios = async (filtros = {}) => {
  const { q, page = 1, limit = 10 } = filtros;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = " WHERE u.fecha_eliminacion IS NULL";
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    whereClause += ` AND (
      u.username ILIKE $1 OR
      u.nombres ILIKE $1 OR
      u.apellidos ILIKE $1 OR
      u.dni ILIKE $1 OR
      (u.nombres || ' ' || u.apellidos) ILIKE $1 OR
      (u.apellidos || ' ' || u.nombres) ILIKE $1
    )`;
  }

  const queryBase = `
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    LEFT JOIN usuario_permisos up ON up.usuario_id = u.id
    ${whereClause}
  `;

  const total = parseInt(
    (await pool.query(`SELECT COUNT(*) as total ${queryBase}`, params)).rows[0].total
  );

  const dataQuery = `
    SELECT
      u.id,
      u.username,
      u.nombres,
      u.apellidos,
      u.rol_id,
      r.nombre AS rol,
      u.telefono,
      u.dni,
      u.activo,
      u.fecha_registro,
      COALESCE(up.actas_anular, false)      AS actas_anular,
      COALESCE(up.actas_eliminar, false)    AS actas_eliminar,
      COALESCE(up.personas_eliminar, false) AS personas_eliminar
    ${queryBase}
    ORDER BY u.apellidos, u.nombres
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const dataRes = await pool.query(dataQuery, [...params, parseInt(limit), offset]);

  const data = dataRes.rows.map(({ actas_anular, actas_eliminar, personas_eliminar, ...u }) => ({
    ...u,
    permisos: { actas_anular, actas_eliminar, personas_eliminar },
  }));

  return {
    data,
    total,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/* ==============================
   OBTENER USUARIO POR ID
============================== */
export const obtenerUsuario = async (id) => {
  const { rows } = await pool.query(
    `
    SELECT 
      u.id,
      u.username,
      u.nombres,
      u.apellidos,
      u.rol_id,
      r.nombre AS rol,
      u.telefono,
      u.dni,
      u.activo,
      u.fecha_registro,
      COALESCE(up.actas_anular, false)      AS actas_anular,
      COALESCE(up.actas_eliminar, false)    AS actas_eliminar,
      COALESCE(up.personas_eliminar, false) AS personas_eliminar
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    LEFT JOIN usuario_permisos up ON up.usuario_id = u.id
    WHERE u.id = $1
      AND u.fecha_eliminacion IS NULL
    `,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  const { actas_anular, actas_eliminar, personas_eliminar, ...usuario } = rows[0];
  return { ...usuario, permisos: { actas_anular, actas_eliminar, personas_eliminar } };
};

/* ==============================
   ACTUALIZAR USUARIO
============================== */
export const actualizarUsuario = async (
  id,
  datos
) => {
  const { username, password, nombres, apellidos, rol_id, telefono, dni, permisos } = datos;

  const usuarioExistente = await pool.query(
    "SELECT * FROM usuarios WHERE id = $1 AND fecha_eliminacion IS NULL",
    [id]
  );

  if (usuarioExistente.rowCount === 0) {
    throw new Error("Usuario no existe");
  }

  let password_hash = usuarioExistente.rows[0].password_hash;
  if (password && password.trim() !== "") {
    password_hash = await bcrypt.hash(password, 10);
  }

  // Lógica de sincronización de username
  let finalUsername = username || usuarioExistente.rows[0].username;
  const oldUser = usuarioExistente.rows[0];

  const nombresCambiados = nombres && nombres.toUpperCase() !== oldUser.nombres;
  const apellidosCambiados = apellidos && apellidos.toUpperCase() !== oldUser.apellidos;

  // Si se cambiaron nombres/apellidos y el username enviado es igual al anterior
  // (significa que no se editó manualmente el username), lo regeneramos.
  if ((nombresCambiados || apellidosCambiados) && username === oldUser.username) {
    finalUsername = await generarUsername({
      nombres: nombres || oldUser.nombres,
      apellidos: apellidos || oldUser.apellidos,
      excludeId: id
    });
  } else if (username && username !== oldUser.username) {
    // Si el usuario cambió el username manualmente, validamos que no exista
    const existe = await pool.query(
      "SELECT 1 FROM usuarios WHERE username = $1 AND id != $2",
      [username, id]
    );
    if (existe.rowCount > 0) {
      throw new Error("El nombre de usuario ya está en uso por otra persona");
    }
    finalUsername = username;
  }

  const { rows } = await pool.query(
    `
    UPDATE usuarios
    SET 
      username = $1,
      password_hash = $2,
      nombres = COALESCE($3, nombres),
      apellidos = COALESCE($4, apellidos),
      rol_id = COALESCE($5, rol_id),
      telefono = $6,
      dni = $7,
      fecha_modificacion = NOW()
    WHERE id = $8
    RETURNING 
      id,
      username,
      nombres,
      apellidos,
      rol_id,
      telefono,
      dni,
      activo,
      fecha_modificacion
    `,
    [
      finalUsername,
      password_hash,
      nombres || null,
      apellidos || null,
      rol_id || null,
      telefono || null,
      dni || null,
      id
    ]
  );

  // UPSERT de permisos si vienen en la petición
  if (permisos !== undefined) {
    await pool.query(
      `INSERT INTO usuario_permisos (usuario_id, actas_anular, actas_eliminar, personas_eliminar, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (usuario_id) DO UPDATE
         SET actas_anular      = EXCLUDED.actas_anular,
             actas_eliminar    = EXCLUDED.actas_eliminar,
             personas_eliminar = EXCLUDED.personas_eliminar,
             updated_at        = NOW()`,
      [
        id,
        !!permisos.actas_anular,
        !!permisos.actas_eliminar,
        !!permisos.personas_eliminar,
      ]
    );
  }

  return rows[0];
};

/* ==============================
   CAMBIAR ESTADO (ACTIVO / INACTIVO)
============================== */
export const cambiarEstadoUsuario = async (id, activo) => {
  const { rows } = await pool.query(
    `
    UPDATE usuarios
    SET 
      activo = $1,
      fecha_modificacion = NOW()
    WHERE id = $2
      AND fecha_eliminacion IS NULL
    RETURNING id, username, activo
    `,
    [activo, id]
  );

  if (rows.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  return rows[0];
};

/* ==============================
   ELIMINACIÓN LÓGICA
============================== */
export const eliminarUsuario = async (id) => {
  const { rows } = await pool.query(
    `
    UPDATE usuarios
    SET 
      fecha_eliminacion = NOW(),
      activo = FALSE
    WHERE id = $1
    RETURNING id, username
    `,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  return rows[0];
};
/* ==============================
   ACTUALIZAR MI PASSWORD (CON VALIDACIÓN)
============================== */
export const actualizarMiPassword = async (id, passwordActual, passwordNuevo) => {
  const { rows } = await pool.query(
    "SELECT password_hash FROM usuarios WHERE id = $1 AND fecha_eliminacion IS NULL",
    [id]
  );

  if (rows.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  const { password_hash } = rows[0];

  const match = await bcrypt.compare(passwordActual, password_hash);
  if (!match) {
    throw new Error("La contraseña actual es incorrecta");
  }

  const nuevoHash = await bcrypt.hash(passwordNuevo, 10);

  await pool.query(
    "UPDATE usuarios SET password_hash = $1, fecha_modificacion = NOW() WHERE id = $2",
    [nuevoHash, id]
  );

  return { message: "Contraseña actualizada correctamente" };
};
