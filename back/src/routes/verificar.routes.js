import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verificarSolicitud } from "../controllers/verificar.controller.js";

// Rate limit para evitar scraping masivo (20 consultas / minuto por IP)
const verificarLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { valido: false, message: "Demasiadas consultas. Espere un momento e intente nuevamente." },
});

const router = Router();

// Ruta pública — sin middleware auth
router.get("/solicitud/:id", verificarLimiter, verificarSolicitud);

export default router;
