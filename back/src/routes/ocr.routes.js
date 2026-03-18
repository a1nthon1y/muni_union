import { Router } from "express";
import multer from "multer";
import { processOCR } from "../controllers/ocr.controller.js";
import { auth as verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Ruta para procesar un PDF con OCR (Vision/OpenAI)
router.post("/process", verifyToken, upload.single("pdf"), processOCR);

export default router;
