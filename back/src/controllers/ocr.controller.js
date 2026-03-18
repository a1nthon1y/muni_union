import { extractDataFromPDF } from "../services/ocr.service.js";

export const processOCR = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se ha subido ningún archivo PDF." });
        }

        const buffer = req.file.buffer;
        const result = await extractDataFromPDF(buffer);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Error en OCR Controller:", error);
        res.status(500).json({ 
            message: "Error al procesar el PDF con OCR.",
            error: error.message 
        });
    }
};
