import { verificarAccessToken } from "../services/auth.service.js";

export const auth = (req, res, next) => {
    // 1. Cookie httpOnly (flujo normal del navegador)
    let token = req.cookies?.auth_token;

    // 2. Fallback: Authorization header (Postman / herramientas de dev)
    if (!token) {
        const header = req.headers.authorization;
        if (header?.startsWith("Bearer ")) token = header.split(" ")[1];
    }

    if (!token) return res.status(401).json({ message: "Token requerido" });

    try {
        req.user = verificarAccessToken(token);
        next();
    } catch {
        // 401 con código específico para que el frontend sepa que debe refrescar
        return res.status(401).json({ message: "Token inválido o expirado", code: "TOKEN_EXPIRED" });
    }
};
