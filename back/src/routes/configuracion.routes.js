import { Router } from "express";
import { body } from "express-validator";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    getConfiguracion,
    putUrlVerificacion,
} from "../controllers/configuracion.controller.js";

const router = Router();

router.use(auth);

// Lectura: cualquier usuario autenticado (necesaria para imprimir constancias)
router.get("/", getConfiguracion);

// Escritura: solo administrador
router.put(
    "/url-verificacion",
    allowRoles(1),
    body("url_verificacion_publica")
        .notEmpty().withMessage("La URL pública es obligatoria.")
        .isString().withMessage("La URL debe ser texto."),
    validate,
    putUrlVerificacion
);

export default router;
