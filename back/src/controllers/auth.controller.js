import {
    autenticarUsuario,
    generarTokens,
    verificarRefreshToken,
    verificarRefreshEnBD,
    guardarRefreshToken,
    revocarRefreshToken,
    revocarTodosLosTokens,
    obtenerUsuarioPorId,
} from "../services/auth.service.js";
import { registrarAccion } from "../services/auditoria.service.js";

const IS_PROD = process.env.NODE_ENV === "production";

const ACCESS_COOKIE  = "auth_token";
const REFRESH_COOKIE = "refresh_token";

const accessCookieOpts = () => ({
    httpOnly: true,
    sameSite: IS_PROD ? "strict" : "lax",
    secure:   IS_PROD,
    maxAge:   60 * 60 * 1000, // 1 hora
});

const refreshCookieOpts = () => ({
    httpOnly: true,
    sameSite: IS_PROD ? "strict" : "lax",
    secure:   IS_PROD,
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 días
    path:     "/api/auth",
});

const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie(ACCESS_COOKIE,  accessToken,  accessCookieOpts());
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOpts());
};

const clearAuthCookies = (res) => {
    res.clearCookie(ACCESS_COOKIE,  { ...accessCookieOpts(),  maxAge: 0 });
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOpts(), maxAge: 0 });
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
        }

        const { accessToken, refreshToken, usuario } = await autenticarUsuario(username, password);
        setAuthCookies(res, accessToken, refreshToken);

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: usuario.id,
            tabla_afectada: "usuarios",
            operacion: "LOGIN",
            registro_id: usuario.id,
            ip: req.ip,
            descripcion: `Inicio de sesión: ${usuario.username}`,
        });

        res.json({ usuario });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

export const refresh = async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ message: "Refresh token requerido" });

    try {
        // 1. Verificar firma JWT
        const { id } = verificarRefreshToken(token);

        // 2. Verificar que el token existe y no fue revocado en BD
        const registroBD = await verificarRefreshEnBD(token);
        if (!registroBD) {
            clearAuthCookies(res);
            return res.status(401).json({ message: "Sesión expirada o revocada. Inicie sesión nuevamente." });
        }

        // 3. Verificar que el usuario sigue activo
        const usuario = await obtenerUsuarioPorId(id);
        if (!usuario) {
            clearAuthCookies(res);
            return res.status(401).json({ message: "Usuario no encontrado o inactivo" });
        }

        // 4. Revocar token anterior y generar nuevos (rotación)
        await revocarRefreshToken(token);
        const payload = { id: usuario.id, rol_id: usuario.rol_id, rol: usuario.rol };
        const { accessToken, refreshToken: newRefresh } = generarTokens(payload);
        await guardarRefreshToken(usuario.id, newRefresh);

        setAuthCookies(res, accessToken, newRefresh);
        res.json({ usuario });
    } catch {
        clearAuthCookies(res);
        res.status(401).json({ message: "Refresh token inválido o expirado. Inicie sesión nuevamente." });
    }
};

export const logout = async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
        await revocarRefreshToken(token).catch(() => {});
    }
    clearAuthCookies(res);

    req.auditHandled = true;
        await registrarAccion({
        usuario_id: req.user.id,
        tabla_afectada: "usuarios",
        operacion: "LOGOUT",
        registro_id: req.user.id,
        ip: req.ip,
            descripcion: `Cierre de sesión (usuario ID: ${req.user.id})`,
    });

    res.json({ message: "Sesión cerrada correctamente" });
};

// Cerrar TODAS las sesiones activas del usuario (útil para admin o cambio de contraseña)
export const logoutAll = async (req, res) => {
    try {
        await revocarTodosLosTokens(req.user.id);
        clearAuthCookies(res);

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "usuarios",
            operacion: "LOGOUT_ALL",
            registro_id: req.user.id,
            ip: req.ip,
            descripcion: `Cierre de TODAS las sesiones activas (usuario ID: ${req.user.id})`,
        });

        res.json({ message: "Todas las sesiones cerradas correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al cerrar sesiones" });
    }
};

export const me = async (req, res) => {
    try {
        const usuario = await obtenerUsuarioPorId(req.user.id);
        if (!usuario) return res.status(401).json({ message: "Usuario no encontrado o inactivo" });
        res.json({ usuario });
    } catch {
        res.status(500).json({ message: "Error al obtener sesión" });
    }
};
