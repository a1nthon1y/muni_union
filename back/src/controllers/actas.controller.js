import * as actasService from "../services/actas.service.js";
import { registrarAccion } from "../services/auditoria.service.js";

const DB_CODES = new Set(["23502","23503","23505","22P02"]);

const handleError = (res, error) => {
    if (DB_CODES.has(error.code)) {
        const msgs = {
            "23502": "Faltan campos obligatorios.",
            "23503": "La persona referenciada no existe.",
            "23505": "Ya existe un acta con ese número y año.",
            "22P02": "Formato de datos inválido.",
        };
        return res.status(400).json({ message: msgs[error.code] });
    }
    // Errores de negocio (mensajes propios del servicio)
    res.status(400).json({ message: error.message });
};

export const crearActa = async (req, res) => {
    try {
        const acta = await actasService.crearActa(req.body, req.user.id);

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "actas",
            operacion: "INSERT",
            registro_id: acta.id,
            ip: req.ip,
            descripcion: `Se registró acta de ${acta.tipo_acta} Nro: ${acta.numero_acta}-${acta.anio}`
        });

        res.status(201).json(acta);
    } catch (error) {
        handleError(res, error);
    }
};

export const listarActas = async (req, res) => {
    try {
        const actas = await actasService.listarActas(req.query);
        res.json(actas);
    } catch (error) {
        res.status(500).json({ message: "Error al listar actas." });
    }
};

export const obtenerActa = async (req, res) => {
    try {
        const acta = await actasService.obtenerActaPorId(req.params.id);
        if (!acta) return res.status(404).json({ message: "Acta no encontrada" });
        res.json(acta);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener acta." });
    }
};

export const actualizarActa = async (req, res) => {
    try {
        const acta = await actasService.actualizarActa(req.params.id, req.body);
        if (!acta) return res.status(404).json({ message: "Acta no encontrada o eliminada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "actas",
            operacion: "UPDATE",
            registro_id: acta.id,
            ip: req.ip,
            descripcion: `Se actualizó acta ID: ${acta.id}`
        });

        res.json(acta);
    } catch (error) {
        handleError(res, error);
    }
};

export const anularActa = async (req, res) => {
    try {
        const { motivo } = req.body;
        if (!motivo || motivo.trim() === '') {
            return res.status(400).json({ message: "Debe indicar el motivo de anulación" });
        }

        const acta = await actasService.cambiarEstadoActa(req.params.id, 'ANULADO', req.user.id, motivo.trim());
        if (!acta) return res.status(404).json({ message: "Acta no encontrada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "actas",
            operacion: "UPDATE_STATUS",
            registro_id: acta.id,
            ip: req.ip,
            descripcion: `Se anuló el acta ID: ${acta.id}. Motivo: ${motivo.trim()}`
        });

        res.json({ message: "Acta anulada correctamente", acta });
    } catch (error) {
        handleError(res, error);
    }
};

export const reactivarActa = async (req, res) => {
    try {
        const acta = await actasService.reactivarActa(req.params.id);
        if (!acta) return res.status(404).json({ message: "Acta no encontrada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "actas",
            operacion: "REACTIVATE",
            registro_id: acta.id,
            ip: req.ip,
            descripcion: `Se reactivó el acta ID: ${acta.id}`
        });

        res.json({ message: "Acta reactivada correctamente", acta });
    } catch (error) {
        handleError(res, error);
    }
};

export const eliminarActa = async (req, res) => {
    try {
        const resultado = await actasService.eliminarActa(req.params.id, req.user.id);
        if (!resultado) return res.status(404).json({ message: "Acta no encontrada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "actas",
            operacion: "DELETE_LOGIC",
            registro_id: req.params.id,
            ip: req.ip,
            descripcion: `Eliminación lógica de acta ID: ${req.params.id}`
        });

        res.json({ message: "Acta eliminada correctamente" });
    } catch (error) {
        handleError(res, error);
    }
};

export const siguienteNumero = async (req, res) => {
    try {
        const { tipo_acta, anio, modo, libro } = req.query;
        if (modo === "CLASICO" && !libro?.trim()) {
            return res.status(400).json({ message: "El número de libro es obligatorio en modo Clásico." });
        }
        const result = await actasService.obtenerSiguienteNumero({ tipo_acta, anio, modo, libro });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Error al calcular el siguiente número" });
    }
};
