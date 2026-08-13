/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Estadísticas y exportaciones
 */

/**
 * @swagger
 * /reportes/resumen:
 *   get:
 *     summary: Estadísticas generales del dashboard
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalActas:              { type: integer }
 *                 totalPersonas:           { type: integer }
 *                 solicitudesPendientes:   { type: integer }
 *                 solicitudesAtendidas:    { type: integer }
 *                 solicitudesMes:          { type: integer }
 *                 totalUsuarios:           { type: integer }
 */

/**
 * @swagger
 * /reportes/ingresos:
 *   get:
 *     summary: Ingresos monetarios mensuales (solo admin)
 *     tags: [Reportes]
 *     responses:
 *       200: { description: Array de totales por mes }
 *       403: { description: Sin permisos }
 */

/**
 * @swagger
 * /reportes/export/actas:
 *   get:
 *     summary: Exportar actas a Excel
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Archivo Excel (.xlsx)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 */

import { Router } from "express";
import {
    getResumenDashboard,
    getEvolucionActas,
    getEstadoSolicitudes,
    getIngresos,
    exportActas,
    exportPersonas,
    exportSolicitudes,
    exportAuditoria
} from "../controllers/reportes.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);

// Estadísticas generales para el dashboard (Admin y Trabajador)
router.get("/resumen", getResumenDashboard);
router.get("/actas-evolucion", getEvolucionActas);
router.get("/solicitudes-estados", getEstadoSolicitudes);

// Datos financieros (Solo ADMIN)
router.get("/ingresos", allowRoles(1), getIngresos);

// Rutas de Exportación EXCEL (Admin y Registrador — no CONSULTA)
router.get("/export/actas", allowRoles(1, 2), exportActas);
router.get("/export/personas", allowRoles(1, 2), exportPersonas);
router.get("/export/solicitudes", allowRoles(1, 2), exportSolicitudes);

// Exportación Auditoría (Solo ADMIN)
router.get("/export/auditoria", allowRoles(1), exportAuditoria);

export default router;
