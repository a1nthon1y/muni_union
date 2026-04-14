import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Asegurar que la carpeta de subidas existe
const uploadDir = "uploads/documentos";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generar un nombre único para evitar colisiones
        const uniqueSuffix = crypto.randomBytes(8).toString("hex");
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Tipos permitidos: PDF, Imagenes
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Tipo de archivo no permitido. Solo se aceptan PDF y fotos (JPG/PNG)."), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB — suficiente para PDFs escaneados de alta calidad
    }
});
