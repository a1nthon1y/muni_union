import * as importacionService from "../services/importacion.service.js";
import { registrarAccion } from "../services/auditoria.service.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import unzipper from "unzipper";
import multer from "multer";
import crypto from "crypto";

const uploadDir = "uploads/documentos";
const tempDir = "uploads/temp_import";

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// ─── Configuración multer ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `import_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`);
    }
});

export const uploadImport = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [".xlsx", ".xls", ".zip"];
        const ext = path.extname(file.originalname).toLowerCase();
        allowed.includes(ext) ? cb(null, true) : cb(new Error(`Tipo no permitido: ${ext}`));
    }
}).fields([
    { name: "excel", maxCount: 1 },
    { name: "zip", maxCount: 1 }
]);

// ─── Helper: Parsear Excel ────────────────────────────────────────────────────
const parsearExcel = (rutaArchivo) => {
    const workbook = XLSX.readFile(rutaArchivo);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // cellDates:true → SheetJS entrega fechas como Date objects (no serial numbers)
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", cellDates: true });

    // Buscar la fila de encabezados (la que contiene "tipo_documento" como subcadena)
    let headerRowIndex = -1;
    for (let i = 0; i < rawRows.length; i++) {
        const rowStr = rawRows[i].map(c => String(c).trim().toLowerCase());
        if (rowStr.some(c => c.includes("tipo_documento") || c === "nombres")) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        throw new Error(
            "No se encontraron encabezados válidos en el Excel. " +
            "Verifique que la primera fila tenga los nombres de columna (tipo_documento, nombres, tipo_acta, etc.)."
        );
    }

    // Limpiar encabezados: quitar "*" (obligatorio), espacios extra y normalizar
    const headers = rawRows[headerRowIndex].map(h => {
        let clean = String(h || "").trim();
        clean = clean.replace(/\*/g, ""); // Quitar todos los asteriscos
        clean = clean.replace(/\(.*\)/g, ""); // Quitar lo que esté en paréntesis
        clean = clean.trim().toLowerCase().replace(/\s+/g, "_");
        return clean;
    });

    console.log("Headers detectados:", headers);

    const dataRows = rawRows.slice(headerRowIndex + 1);

    // Helper: convierte cualquier valor a string limpio
    // Detecta Date objects y los convierte a YYYY-MM-DD antes de perder el tipo
    const toStr = (val) => {
        if (val === null || val === undefined) return "";
        if (val instanceof Date) {
            // Date object -> ISO YYYY-MM-DD (usar UTC para evitar desfase de zona horaria)
            const y = val.getUTCFullYear();
            const m = String(val.getUTCMonth() + 1).padStart(2, "0");
            const d = String(val.getUTCDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        }
        return String(val).trim();
    };

    const parsed = dataRows
        .map((row, idx) => {
            const obj = {};
            headers.forEach((h, i) => { if (h) obj[h] = toStr(row[i]); });
            // Si es la primera fila de datos, logearla para ver si coincide
            if (idx === 0) console.log("Ejemplo de fila parseada:", obj);
            return obj;
        })
        .filter(f => f.nombres || f.apellido_paterno)
        .map(f => {
            if (f.tipo_acta) f.tipo_acta = f.tipo_acta.toUpperCase().trim();
            if (f.sexo) f.sexo = f.sexo.toUpperCase().trim();
            if (f.tipo_documento) f.tipo_documento = f.tipo_documento.trim();
            return f;
        });

    return parsed;
};

// ─── Helper: Extraer ZIP preservando ESTRUCTURA DE CARPETAS ──────────────────
// Soporta dos formas de comprimir en Windows:
//   A) Seleccionas el contenido → ZIP sin carpeta raíz: matrimonios/LIBRO 1/Documento 1.pdf
//   B) Comprimes la carpeta → ZIP con carpeta raíz: prueba/matrimonios/LIBRO 1/Documento 1.pdf
// El sistema detecta el caso B y también guarda sin el prefijo de carpeta raíz.
const extraerZip = async (rutaZip) => {
    const extractDir = path.join(tempDir, `zip_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    await fs.createReadStream(rutaZip)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();

    // Detectar si hay una sola carpeta raíz envolvente
    // Ej: si el ZIP tiene todo dentro de "prueba/", la raíz es "prueba"
    const topItems = fs.readdirSync(extractDir);
    let carpetaRaiz = null;
    if (topItems.length === 1) {
        const topPath = path.join(extractDir, topItems[0]);
        if (fs.statSync(topPath).isDirectory()) {
            carpetaRaiz = topItems[0]; // ej: "prueba"
        }
    }

    const archivosMap = {};   // clave = ruta relativa completa
    const soloNombreMap = {}; // clave = solo nombre del archivo (fallback)

    const walkDir = (dir, rutaRelativa = "") => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = rutaRelativa ? `${rutaRelativa}/${item}` : item;

            if (fs.statSync(fullPath).isDirectory()) {
                walkDir(fullPath, relPath);
            } else {
                const ext = path.extname(item).toLowerCase();
                const tiposPermitidos = [".pdf", ".jpg", ".jpeg", ".png"];
                if (!tiposPermitidos.includes(ext)) continue;

                const mime = ext === ".pdf" ? "application/pdf"
                    : (ext === ".jpg" || ext === ".jpeg") ? "image/jpeg" : "image/png";

                const uniqueName = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
                const destPath = path.join(uploadDir, uniqueName);
                fs.copyFileSync(fullPath, destPath);

                const fileInfo = { originalname: item, path: destPath, mimetype: mime };

                // Clave 1: ruta completa tal como viene en el ZIP
                const claveCompleta = relPath.replace(/\\/g, "/");
                archivosMap[claveCompleta] = fileInfo;

                // Clave 2: si detectamos carpeta raíz envolvente, guardar SIN ese prefijo
                // "prueba/matrimonios/LIBRO 1/Documento 1.pdf" → "matrimonios/LIBRO 1/Documento 1.pdf"
                if (carpetaRaiz) {
                    const claveSinRaiz = claveCompleta.replace(new RegExp(`^${carpetaRaiz}/`), "");
                    if (claveSinRaiz !== claveCompleta) {
                        archivosMap[claveSinRaiz] = fileInfo;
                    }
                }

                // Clave 3: solo el nombre del archivo (último recurso)
                soloNombreMap[item] = fileInfo;
            }
        }
    };
    walkDir(extractDir);

    fs.rmSync(extractDir, { recursive: true, force: true });

    return { archivosMap, soloNombreMap };
};


// ─── Helper: Construir clave de búsqueda de archivo ──────────────────────────
// Busca el archivo usando carpeta_ruta + nombre_archivo_pdf primero,
// y si no lo encuentra usa solo el nombre como respaldo.
export const buscarArchivo = (fila, archivosMap, soloNombreMap) => {
    const nombre = fila.nombre_archivo_pdf?.trim();
    if (!nombre) return null;

    const carpeta = fila.carpeta_ruta?.trim().replace(/\\/g, "/").replace(/\/$/, "");

    // Intento 1: carpeta_ruta + nombre (ruta completa relativa)
    if (carpeta) {
        const claveCompleta = `${carpeta}/${nombre}`;
        if (archivosMap[claveCompleta]) return archivosMap[claveCompleta];
    }

    // Intento 2: Solo el nombre del archivo
    if (soloNombreMap[nombre]) return soloNombreMap[nombre];

    return null;
};

// ─── ENDPOINT PRINCIPAL: Importar ─────────────────────────────────────────────
export const importarMasivo = async (req, res) => {
    const tempFiles = [];

    try {
        if (!req.files?.excel?.[0]) {
            return res.status(400).json({ message: "Se requiere el archivo Excel (.xlsx o .xls)." });
        }

        const rutaExcel = req.files.excel[0].path;
        tempFiles.push(rutaExcel);

        let filas;
        try {
            filas = parsearExcel(rutaExcel);
        } catch (e) {
            return res.status(400).json({ message: `Error al leer el Excel: ${e.message}` });
        }

        if (filas.length === 0) {
            return res.status(400).json({ message: "El Excel no contiene datos válidos. Verifique que las columnas tengan los nombres correctos." });
        }

        // Extraer ZIP si se envió — ahora con soporte de estructura de carpetas
        let archivosMap = {};
        let soloNombreMap = {};
        if (req.files?.zip?.[0]) {
            const rutaZip = req.files.zip[0].path;
            tempFiles.push(rutaZip);
            ({ archivosMap, soloNombreMap } = await extraerZip(rutaZip));
        }

        const resultados = await importacionService.importarActasMasivo(
            filas, archivosMap, soloNombreMap, req.user.id
        );

        const exitosos = resultados.filter(r => r.estado === "OK").length;
        const omitidos = resultados.filter(r => r.estado === "OMITIDO").length;
        const docsVinculados = resultados.filter(r => r.estado === "OMITIDO_DOC").length;
        const errores = resultados.filter(r => r.estado === "ERROR").length;

        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "actas",
            operacion: "IMPORT",
            registro_id: 0,
            ip: req.ip,
            descripcion: `Carga masiva: ${exitosos} nuevas, ${docsVinculados} docs vinculados, ${omitidos} omitidas, ${errores} errores (total ${filas.length})`
        });

        return res.json({
            total: filas.length,
            exitosos,
            omitidos,
            docs_vinculados: docsVinculados,
            errores,
            resultados
        });

    } catch (error) {
        console.error("Error en importación masiva:", error);
        return res.status(500).json({ message: `Error interno: ${error.message}` });
    } finally {
        for (const f of tempFiles) {
            if (fs.existsSync(f)) fs.unlinkSync(f);
        }
    }
};
