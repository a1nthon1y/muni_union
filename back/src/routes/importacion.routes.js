import { Router } from "express";
import { importarMasivo, uploadImport } from "../controllers/importacion.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireOperador } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);

// Administradores y registradores pueden importar; CONSULTA no
router.post("/", requireOperador, uploadImport, importarMasivo);

export default router;
