import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../config/db.js";

const ACCESS_EXPIRES  = "1h";
const REFRESH_EXPIRES = "7d";
const REFRESH_MS      = 7 * 24 * 60 * 60 * 1000;

// SHA-256 del token — nunca almacenar el JWT en texto plano
const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

// ── Generación ───────────────────────────────────────────────────
export const generarTokens = (payload) => {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign(
        { id: payload.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_EXPIRES }
    );
    return { accessToken, refreshToken };
};

// ── Verificación ─────────────────────────────────────────────────
export const verificarAccessToken  = (token) => jwt.verify(token, process.env.JWT_SECRET);
export const verificarRefreshToken = (token) => jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

// ── Persistencia de refresh tokens ──────────────────────────────
export const guardarRefreshToken = async (usuarioId, token) => {
    const hash      = hashToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_MS);
    await pool.query(
        `INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (token_hash) DO NOTHING`,
        [usuarioId, hash, expiresAt]
    );
};

export const verificarRefreshEnBD = async (token) => {
    const hash = hashToken(token);
    const { rows } = await pool.query(
        `SELECT id, usuario_id FROM refresh_tokens
         WHERE token_hash = $1 AND expires_at > NOW()`,
        [hash]
    );
    return rows[0] ?? null;   // null = token no existe o ya expiró/fue revocado
};

export const revocarRefreshToken = async (token) => {
    const hash = hashToken(token);
    await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [hash]);
};

export const revocarTodosLosTokens = async (usuarioId) => {
    await pool.query(`DELETE FROM refresh_tokens WHERE usuario_id = $1`, [usuarioId]);
};

// Limpieza periódica de tokens expirados (llamar una vez al arrancar el servidor)
export const limpiarTokensExpirados = async () => {
    const { rowCount } = await pool.query(
        `DELETE FROM refresh_tokens WHERE expires_at < NOW()`
    );
    return rowCount;
};

// ── Usuarios ─────────────────────────────────────────────────────
export const obtenerUsuarioPorId = async (id) => {
    const { rows } = await pool.query(
        `SELECT u.id, u.username, u.nombres, u.apellidos, u.telefono,
                u.activo, u.rol_id, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE u.id = $1 AND u.fecha_eliminacion IS NULL AND u.activo = true`,
        [id]
    );
    return rows[0] ?? null;
};

export const autenticarUsuario = async (username, password) => {
    const { rows } = await pool.query(
        `SELECT u.id, u.username, u.password_hash, u.nombres, u.apellidos,
                u.telefono, u.activo, u.rol_id, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE u.username = $1 AND u.fecha_eliminacion IS NULL`,
        [username]
    );

    if (rows.length === 0) throw new Error("Usuario o contraseña incorrectos.");

    const usuario = rows[0];

    if (!await bcrypt.compare(password, usuario.password_hash)) {
        throw new Error("Usuario o contraseña incorrectos.");
    }

    if (!usuario.activo) {
        throw new Error("La cuenta se encuentra inactiva. Contacte al administrador.");
    }

    const payload = { id: usuario.id, rol_id: usuario.rol_id, rol: usuario.rol };
    const { accessToken, refreshToken } = generarTokens(payload);

    // Persistir refresh token en BD
    await guardarRefreshToken(usuario.id, refreshToken);

    return {
        accessToken,
        refreshToken,
        usuario: {
            id:        usuario.id,
            username:  usuario.username,
            nombres:   usuario.nombres,
            apellidos: usuario.apellidos,
            telefono:  usuario.telefono,
            rol_id:    usuario.rol_id,
            rol:       usuario.rol,
            activo:    usuario.activo,
        },
    };
};
