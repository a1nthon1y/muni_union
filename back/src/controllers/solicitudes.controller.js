import * as solicitudesService from "../services/solicitudes.service.js";
import { registrarAccion } from "../services/auditoria.service.js";

export const crearSolicitante = async (req, res) => {
    try {
        const existente = await solicitudesService.buscarSolicitantePorDni(req.body.dni);
        if (existente) {
            // Si existe, actualizamos sus datos (nombres, apellidos, telf, direccion)
            const actualizado = await solicitudesService.actualizarSolicitante(existente.id, req.body);
            return res.json(actualizado);
        }

        const solicitante = await solicitudesService.crearSolicitante(req.body);
        res.status(201).json(solicitante);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const obtenerSolicitante = async (req, res) => {
    try {
        const solicitante = await solicitudesService.buscarSolicitantePorDni(req.params.dni);
        if (!solicitante) return res.status(404).json({ message: "Solicitante no encontrado" });
        res.json(solicitante);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const crearSolicitud = async (req, res) => {
    try {
        const solicitud = await solicitudesService.crearSolicitud(req.body, req.user.id);

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "solicitudes",
            operacion: "INSERT",
            registro_id: solicitud.id,
            ip: req.ip,
            descripcion: `Se registró nueva solicitud ID: ${solicitud.id} de tipo ${solicitud.tipo_solicitud}`
        });

        res.status(201).json(solicitud);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const listarSolicitudes = async (req, res) => {
    try {
        // Un USER solo puede ver todas si así se requiere para atenderlas, pero el ADMIN puede ver todo.
        // El requerimiento dice "ADMIN puede: Ver todas las solicitudes", "USER puede: Registrar... Atender"
        // Por ahora permitimos a ambos ver pero ADMIN podría tener más filtros.
        const solicitudes = await solicitudesService.listarSolicitudes(req.query);
        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const obtenerSolicitud = async (req, res) => {
    try {
        const solicitud = await solicitudesService.obtenerSolicitudPorId(req.params.id);
        if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const atenderSolicitud = async (req, res) => {
    try {
        const solicitud = await solicitudesService.atenderSolicitud(req.params.id, req.user.id);
        if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "solicitudes",
            operacion: "UPDATE_STATUS",
            registro_id: solicitud.id,
            ip: req.ip,
            descripcion: `Se marcó como ATENDIDA la solicitud ID: ${solicitud.id}`
        });

        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const anularSolicitud = async (req, res) => {
    try {
        const { motivo } = req.body;
        const solicitud = await solicitudesService.anularSolicitud(req.params.id, req.user.id, motivo);
        if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "solicitudes",
            operacion: "UPDATE_STATUS",
            registro_id: solicitud.id,
            ip: req.ip,
            descripcion: `Se anuló la solicitud ID: ${solicitud.id}. Motivo: ${motivo || 'No especificado'}`
        });

        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const eliminarSolicitud = async (req, res) => {
    try {
        const solicitud = await solicitudesService.eliminarSolicitud(req.params.id, req.user.id);
        if (!solicitud) return res.status(404).json({ message: "Solicitud no encontrada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "solicitudes",
            operacion: "DELETE",
            registro_id: req.params.id,
            ip: req.ip,
            descripcion: `Se eliminó definitivamente la solicitud ID: ${req.params.id}`
        });

        res.json({ message: "Solicitud eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
