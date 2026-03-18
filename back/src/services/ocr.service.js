import { OpenAI } from "openai";
import dotenv from "dotenv";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();

let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "dummy_key",
    });
} catch (e) {
    console.warn("Advertencia: OPENAI_API_KEY no configurado.");
}

/**
 * Procesa un PDF para extraer datos de un acta (Nacimiento, Matrimonio, Defunción)
 */
export const extractDataFromPDF = async (buffer) => {
    try {
        // 1. Extraer texto del PDF
        const data = await pdf(buffer);
        const text = data.text;

        if (!text || text.trim().length < 10) {
            throw new Error("El PDF parece estar vacío o ser un escaneo sin texto (OCR de imagen requerido).");
        }

        // 2. Enviar a OpenAI para estructurar los datos
        const prompt = `
            Eres un experto en registros civiles de Perú. Tu tarea es extraer información estructurada de este texto proveniente de un acta (Partida) de Nacimiento, Matrimonio o Defunción. 
            
            TEXTO EXTRAÍDO:
            """
            ${text}
            """

            REGLAS:
            1. Identifica el tipo de acta (NACIMIENTO, MATRIMONIO, DEFUNCION).
            2. Extrae nombres, apellidos, DNI, fecha de nacimiento/suceso, libro, folio y número de acta si están presentes.
            3. Devuelve los nombres y apellidos siempre en MAYÚSCULAS.
            4. Devuelve las fechas en formato YYYY-MM-DD.
            5. Si no encuentras un dato, pon null.
            6. RESPONDE ÚNICAMENTE EN FORMATO JSON.

            FORMATO DE SALIDA (JSON):
            {
                "tipo_acta": "NACIMIENTO | MATRIMONIO | DEFUNCION",
                "nombres": "...",
                "apellido_paterno": "...",
                "apellido_materno": "...",
                "dni": "...",
                "fecha_evento": "YYYY-MM-DD",
                "sexo": "M | F",
                "libro": "...",
                "folio": "...",
                "numero_acta": "...",
                "anio": "..."
            }
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Eres un extractor de datos de documentos oficiales peruanos." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;

    } catch (error) {
        console.error("Error en OCR Service:", error);
        throw error;
    }
};
