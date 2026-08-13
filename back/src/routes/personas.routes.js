/**
 * @swagger
 * tags:
 *   name: Personas
 *   description: Ciudadanos registrados en el sistema
 */

/**
 * @swagger
 * /personas:
 *   get:
 *     summary: Listar personas (paginado)
 *     tags: [Personas]
 *     parameters:
 *       - in: query
 *         name: termino
 *         schema: { type: string }
 *         description: Búsqueda por nombre, apellido o DNI
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Persona' }
 *       401: { description: No autenticado }
 *   post:
 *     summary: Registrar nueva persona
 *     tags: [Personas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Persona' }
 *     responses:
 *       201: { description: Persona creada }
 *       400: { $ref: '#/components/schemas/ErrorValidacion' }
 *       401: { description: No autenticado }
 */

/**
 * @swagger
 * /personas/{id}:
 *   get:
 *     summary: Obtener persona por ID
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Persona' }
 *       404: { description: No encontrada }
 *   put:
 *     summary: Actualizar persona
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Persona' }
 *     responses:
 *       200: { description: Actualizado }
 *       400: { $ref: '#/components/schemas/ErrorValidacion' }
 *   delete:
 *     summary: Eliminar persona (soft delete, solo admin)
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Eliminado }
 *       403: { description: Sin permisos }
 */

/**
 * @swagger
 * /personas/tipos-documento:
 *   get:
 *     summary: Listar tipos de documento disponibles
 *     tags: [Personas]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:     { type: integer }
 *                   nombre: { type: string }
 */

import { Router } from "express";
import { body } from "express-validator";
import {
    crearPersona,
    listarPersonas,
    obtenerPersona,
    actualizarPersona,
    eliminarPersona,
    reactivarPersona,
    buscarDuplicados,
    listarTiposDocumento,
    fusionarPersonas
} from "../controllers/personas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles, requireOperador } from "../middlewares/role.middleware.js";
import { requirePermiso } from "../middlewares/permisos.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const personaRules = [
    body("nombres")
        .trim().notEmpty().withMessage("El nombre es obligatorio")
        .isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    body("apellido_paterno")
        .trim().notEmpty().withMessage("El apellido paterno es obligatorio")
        .isLength({ max: 100 }),
    body("apellido_materno")
        .trim().notEmpty().withMessage("El apellido materno es obligatorio")
        .isLength({ max: 100 }),
    body("sexo")
        .optional({ nullable: true })
        .isIn(["M", "F"]).withMessage("Sexo debe ser M o F"),
    body("dni")
        .optional({ nullable: true })
        .isLength({ max: 20 }).withMessage("DNI/CE máximo 20 caracteres"),
    body("tipo_documento_id")
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage("Tipo de documento inválido"),
    body("fecha_nacimiento")
        .optional({ nullable: true })
        .isDate({ format: "YYYY-MM-DD" }).withMessage("Fecha inválida, use YYYY-MM-DD"),
    body("fecha_fallecimiento")
        .optional({ nullable: true })
        .isDate({ format: "YYYY-MM-DD", strictMode: true })
        .withMessage("Fecha de fallecimiento inválida, use YYYY-MM-DD"),
];

const router = Router();
router.use(auth);

router.post("/",    requireOperador, personaRules, validate, crearPersona);
router.get("/",     listarPersonas);
router.get("/tipos-documento",  listarTiposDocumento);
router.get("/buscar-duplicados", buscarDuplicados);
router.get("/:id",  obtenerPersona);
router.put("/:id",  requireOperador, requirePermiso("personas_modificar"), personaRules, validate, actualizarPersona);

router.patch("/:id/reactivar", allowRoles(1),                      reactivarPersona);
router.delete("/:id",          requireOperador, requirePermiso("personas_eliminar"), eliminarPersona);
router.post("/:id/fusionar",   requireOperador, requirePermiso("personas_modificar"), fusionarPersonas);

export default router;
