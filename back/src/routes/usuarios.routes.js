import { Router } from "express";
import { body } from "express-validator";
import {
    crearUsuario,
    listarUsuarios,
    obtenerUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario,
    eliminarUsuario,
    cambiarMiPassword
} from "../controllers/usuarios.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const crearUsuarioRules = [
    body("nombres").trim().notEmpty().withMessage("Nombres obligatorio"),
    body("apellidos").trim().notEmpty().withMessage("Apellidos obligatorio"),
    body("password")
        .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("rol_id")
        .isInt({ min: 1 }).withMessage("Rol inválido"),
];

const passwordRules = [
    body("passwordActual").notEmpty().withMessage("La contraseña actual es obligatoria"),
    body("passwordNuevo")
        .isLength({ min: 6 }).withMessage("La nueva contraseña debe tener al menos 6 caracteres"),
];

const router = Router();
router.use(auth);

router.patch("/perfil/password", passwordRules, validate, cambiarMiPassword);

router.use(allowRoles(1));

router.post("/",            crearUsuarioRules, validate, crearUsuario);
router.get("/",             listarUsuarios);
router.get("/:id",          obtenerUsuario);
router.put("/:id",          actualizarUsuario);
router.patch("/:id/estado", cambiarEstadoUsuario);
router.delete("/:id",       eliminarUsuario);

export default router;
