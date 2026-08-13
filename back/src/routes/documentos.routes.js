import { Router } from "express";
import {
    registrarDocumento,
    listarDocumentosPorActa,
    eliminarDocumento
} from "../controllers/documentos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireOperador } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(auth);

router.post("/", requireOperador, upload.single("archivo"), registrarDocumento);

router.get("/acta/:actaId", listarDocumentosPorActa);

router.delete("/:id", requireOperador, eliminarDocumento);

export default router;
