import { Router } from "express";
import { body, query } from "express-validator";
import {
    crearActa,
    listarActas,
    obtenerActa,
    actualizarActa,
    eliminarActa,
    anularActa,
    reactivarActa,
    siguienteNumero,
} from "../controllers/actas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();
router.use(auth);

const crearActaValidation = [
    body("persona_principal_id")
        .notEmpty().withMessage("El ciudadano titular es obligatorio.")
        .isInt({ min: 1 }).withMessage("ID de ciudadano inválido."),
    body("tipo_acta")
        .notEmpty().withMessage("El tipo de acta es obligatorio.")
        .isIn(["NACIMIENTO", "MATRIMONIO", "DEFUNCION"])
        .withMessage("Tipo de acta inválido. Debe ser NACIMIENTO, MATRIMONIO o DEFUNCION."),
    body("numero_acta")
        .notEmpty().withMessage("El número de acta es obligatorio."),
    body("anio")
        .notEmpty().withMessage("El año es obligatorio.")
        .isInt({ min: 1900, max: 2100 }).withMessage("Año inválido."),
    body("fecha_acta")
        .notEmpty().withMessage("La fecha del acta es obligatoria.")
        .isDate().withMessage("Formato de fecha inválido (YYYY-MM-DD)."),
];

const siguienteNumeroValidation = [
    query("tipo_acta").notEmpty().isIn(["NACIMIENTO", "MATRIMONIO", "DEFUNCION"])
        .withMessage("tipo_acta inválido."),
    query("anio").notEmpty().isInt({ min: 1900, max: 2100 })
        .withMessage("Año inválido."),
    query("modo").notEmpty().isIn(["CLASICO", "CUI"])
        .withMessage("modo debe ser CLASICO o CUI."),
];

// ── Rutas generales (ADMIN y USER) ───────────────────────────────────────────
// IMPORTANTE: /siguiente-numero debe ir ANTES de /:id
router.get("/siguiente-numero", siguienteNumeroValidation, validate, siguienteNumero);
router.post("/",   crearActaValidation, validate, crearActa);
router.get("/",    listarActas);
router.get("/:id", obtenerActa);
router.put("/:id", actualizarActa);

// Rutas críticas (SOLO ADMIN)
router.patch("/:id/anular",    anularActa);
router.patch("/:id/reactivar", reactivarActa);
router.delete("/:id",          allowRoles(1), eliminarActa);

export default router;
