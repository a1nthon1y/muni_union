import * as documentosService from "../services/documentos.service.js";
import { registrarAccion } from "../services/auditoria.service.js";
import { pool } from "../config/db.js";
import crypto from "crypto";
import fs from "fs";

export const registrarDocumento = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se ha subido ningún archivo" });
        }

        const { acta_id, observaciones } = req.body;

        if (!acta_id) {
            // Eliminar el archivo si no se proporcionó acta_id para no dejar basura
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "El ID del acta es obligatorio" });
        }

        // --- LÓGICA DE REEMPLAZO: Soft-delete de anteriores (conservar físico para historial) ---
        const docsExistentes = await documentosService.listarDocumentosPorActa(acta_id);
        for (const doc of docsExistentes) {
            // Solo soft-delete en BD — el archivo físico se conserva para que esté disponible
            // en el historial y el usuario pueda consultarlo como referencia.
            await documentosService.eliminarDocumento(doc.id, req.user.id);
        }

        // Leer el archivo para generar un hash
        const fileBuffer = fs.readFileSync(req.file.path);
        const hash_archivo = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        const datosDocumento = {
            acta_id,
            nombre_archivo: req.file.originalname,
            ruta_archivo: req.file.path.replace(/\\/g, "/"), // Normalizar ruta para web
            tipo_archivo: req.file.mimetype.split("/")[1].toUpperCase(),
            hash_archivo,
            observaciones
        };

        const documento = await documentosService.registrarDocumento(datosDocumento, req.user.id);

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "documentos_digitales",
            operacion: "INSERT",
            registro_id: documento.id,
            ip: req.ip,
            descripcion: `Se subió documento: ${documento.nombre_archivo} para acta ID: ${documento.acta_id}`
        });

        res.status(201).json(documento);
    } catch (error) {
        // Si hay error y se subió archivo, intentar borrarlo
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: error.message });
    }
};

export const listarDocumentosPorActa = async (req, res) => {
    try {
        const docs = await documentosService.listarDocumentosPorActa(req.params.actaId);
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /documentos/acta/:actaId/historial
 * Devuelve todos los documentos de un acta (activos + reemplazados),
 * para mostrar el historial de escaneos como referencia.
 */
export const listarHistorialPorActa = async (req, res) => {
    try {
        const docs = await documentosService.listarHistorialDocumentosPorActa(req.params.actaId);
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const eliminarDocumento = async (req, res) => {
    try {
        // Primero obtener la ruta del archivo para borrarlo físicamente
        const { rows } = await pool.query(
            "SELECT ruta_archivo FROM documentos_digitales WHERE id = $1",
            [req.params.id]
        );

        if (rows.length > 0 && rows[0].ruta_archivo) {
            if (fs.existsSync(rows[0].ruta_archivo)) {
                fs.unlinkSync(rows[0].ruta_archivo);
            }
        }

        const resultado = await documentosService.eliminarDocumentoDefinitivo(req.params.id);
        if (!resultado) return res.status(404).json({ message: "Documento no encontrado" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "documentos_digitales",
            operacion: "DELETE_LOGIC",
            registro_id: req.params.id,
            ip: req.ip,
            descripcion: `Se eliminó documento ID: ${req.params.id}`
        });

        res.json({ message: "Documento eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const restaurarDocumento = async (req, res) => {
    try {
        const documentoRestaurado = await documentosService.restaurarDocumento(req.params.id, req.user.id);

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "documentos_digitales",
            operacion: "UPDATE",
            registro_id: req.params.id,
            ip: req.ip,
            descripcion: `Se restauró escaneo previo ID: ${req.params.id} como documento activo para acta ID: ${documentoRestaurado.acta_id}`
        });

        res.json({ message: "Documento restaurado correctamente como activo", documento: documentoRestaurado });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
