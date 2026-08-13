import { Router } from "express";
import {
    crearSolicitante,
    crearSolicitud,
    listarSolicitudes,
    obtenerSolicitud,
    atenderSolicitud,
    anularSolicitud,
    eliminarSolicitud,
    obtenerSolicitante
} from "../controllers/solicitudes.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireOperador } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);

router.post("/solicitantes", requireOperador, crearSolicitante);
router.get("/solicitantes/:dni", obtenerSolicitante);
router.post("/", requireOperador, crearSolicitud);
router.get("/", listarSolicitudes);
router.get("/:id", obtenerSolicitud);
router.patch("/:id/atender", requireOperador, atenderSolicitud);
router.patch("/:id/anular", requireOperador, anularSolicitud);
router.delete("/:id", requireOperador, eliminarSolicitud);

export default router;
