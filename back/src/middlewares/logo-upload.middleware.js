import multer from "multer";
import { LogoValidationError } from "../services/identidad-visual.service.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        // Validar solo por tipo MIME, no por nombre de archivo
        const tipoValido = !file.mimetype || [
            "image/svg+xml",
            "image/png",
            "image/jpeg",
            "image/jpg",
        ].includes(file.mimetype);
        
        if (!tipoValido) {
            return callback(
                new LogoValidationError("Solo se aceptan archivos SVG, PNG o JPEG."),
                false,
            );
        }
        return callback(null, true);
    },
});

export const uploadLogo = (req, res, next) => {
    upload.single("logo")(req, res, (error) => {
        if (!error) {
            return next();
        }
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                message: "El archivo no puede superar 2 MB.",
            });
        }
        if (error instanceof LogoValidationError) {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    });
};
