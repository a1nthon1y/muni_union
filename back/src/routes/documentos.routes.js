import { Router } from "express";
import {
    registrarDocumento,
    listarDocumentosPorActa,
    listarHistorialPorActa,
    eliminarDocumento,
    restaurarDocumento
} from "../controllers/documentos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireOperador } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(auth);

router.post("/", requireOperador, upload.single("archivo"), registrarDocumento);

router.get("/acta/:actaId", listarDocumentosPorActa);
router.get("/acta/:actaId/historial", listarHistorialPorActa);

router.put("/:id/restaurar", requireOperador, restaurarDocumento);
router.delete("/:id", requireOperador, eliminarDocumento);

export default router;
