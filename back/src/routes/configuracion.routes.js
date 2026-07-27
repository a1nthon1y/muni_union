import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { uploadLogo } from "../middlewares/logo-upload.middleware.js";
import { getLogos, putLogo } from "../controllers/configuracion.controller.js";

const router = Router();

router.use(auth, allowRoles(1));

router.get("/logos", getLogos);
router.put("/logos/:tipo", uploadLogo, putLogo);

export default router;
