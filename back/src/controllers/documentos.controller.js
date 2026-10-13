import * as documentosService from "../services/documentos.service.js";
import { registrarAccion } from "../services/auditoria.service.js";
import { pool } from "../config/db.js";
import crypto from "crypto";
import fs from "fs";

import path from "path";

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

        // --- LÓGICA DE REEMPLAZO LIMPIO: Eliminar físicamente del disco y de BD archivos anteriores ---
        // para garantizar que no quede basura acumulada en el servidor y mantener 1 acta = 1 archivo vigente
        const { rows: docsAnteriores } = await pool.query(
            "SELECT id, ruta_archivo, nombre_archivo FROM documentos_digitales WHERE acta_id = $1",
            [acta_id]
        );
        for (const doc of docsAnteriores) {
            if (doc.ruta_archivo) {
                const resolvedPath = path.resolve(doc.ruta_archivo);
                if (fs.existsSync(resolvedPath)) {
                    try {
                        fs.unlinkSync(resolvedPath);
                    } catch (err) {
                        console.warn(`No se pudo eliminar archivo físico anterior ${resolvedPath}:`, err.message);
                    }
                }
            }
            await documentosService.eliminarDocumentoDefinitivo(doc.id);
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

        const descripcionAuditoria = docsAnteriores.length > 0
            ? `Se reemplazó documento para acta ID: ${documento.acta_id}. Nuevo archivo: ${documento.nombre_archivo} (se liberó espacio eliminando archivo anterior del disco).`
            : `Se subió documento: ${documento.nombre_archivo} para acta ID: ${documento.acta_id}`;

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "documentos_digitales",
            operacion: docsAnteriores.length > 0 ? "UPDATE" : "INSERT",
            registro_id: documento.id,
            req,
            ip: req.clientIp || req.ip,
            descripcion: descripcionAuditoria
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
            req,
            ip: req.clientIp || req.ip,
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
            req,
            ip: req.clientIp || req.ip,
            descripcion: `Se restauró escaneo previo ID: ${req.params.id} como documento activo para acta ID: ${documentoRestaurado.acta_id}`
        });

        res.json({ message: "Documento restaurado correctamente como activo", documento: documentoRestaurado });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
