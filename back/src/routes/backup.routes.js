import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { descargarBackup, infoBackup } from "../controllers/backup.controller.js";

const router = Router();

// Solo administradores (rol_id = 1)
router.use(auth, allowRoles(1));

router.get("/info",     infoBackup);
router.get("/download", descargarBackup);

export default router;
