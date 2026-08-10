import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { uploadLogo } from "../middlewares/logo-upload.middleware.js";
import { getLogos, putLogo, getLogosPublic } from "../controllers/configuracion.controller.js";

const router = Router();

// Ruta pública para obtener las rutas de logos (sin autenticación)
router.get("/logos/public", getLogosPublic);

// Rutas protegidas para gestión de logos
router.use(auth, allowRoles(1));
router.get("/logos", getLogos);
router.put("/logos/:tipo", uploadLogo, putLogo);

export default router;
