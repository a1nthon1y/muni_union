/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: aespinoza }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Login exitoso. Cookies auth_token y refresh_token seteadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       400: { description: Campos faltantes }
 *       401: { description: Credenciales incorrectas }
 *       429: { description: Demasiados intentos }
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar access token usando el refresh token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Nuevos tokens seteados en cookies.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       401: { description: Refresh token inválido o expirado }
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener usuario autenticado actual
 *     tags: [Auth]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       401: { description: No autenticado }
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión (limpia las cookies)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Sesión cerrada }
 *       401: { description: No autenticado }
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, logoutAll, me, refresh } from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos." }
});

// Limitar refreshes para evitar abuso
const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiadas solicitudes de refresco." }
});

const router = Router();
router.post("/login",       loginLimiter,   login);
router.post("/refresh",     refreshLimiter, refresh);
router.post("/logout",      auth,           logout);
router.post("/logout-all",  auth,           logoutAll);  // cierra todas las sesiones activas
router.get("/me",           auth,           me);
export default router;
