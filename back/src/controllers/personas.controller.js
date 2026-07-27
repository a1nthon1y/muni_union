import * as personasService from "../services/personas.service.js";
import { registrarAccion } from "../services/auditoria.service.js";
import { FechaPersonaValidationError } from "../services/persona-fechas.service.js";

export const crearPersona = async (req, res) => {
    try {
        const persona = await personasService.crearPersona(req.body, req.user.id);

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "personas",
            operacion: "INSERT",
            registro_id: persona.id,
            ip: req.ip,
            descripcion: `Se registró a la persona: ${persona.apellido_paterno} ${persona.nombres}`
        });

        res.status(201).json(persona);
    } catch (error) {
        if (error instanceof FechaPersonaValidationError) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

export const listarPersonas = async (req, res) => {
    try {
        const resultado = await personasService.listarPersonas(req.query);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const obtenerPersona = async (req, res) => {
    try {
        const persona = await personasService.obtenerPersonaPorId(req.params.id);
        if (!persona) return res.status(404).json({ message: "Persona no encontrada" });
        res.json(persona);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const actualizarPersona = async (req, res) => {
    try {
        const persona = await personasService.actualizarPersona(req.params.id, req.body);
        if (!persona) return res.status(404).json({ message: "Persona no encontrada o eliminada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "personas",
            operacion: "UPDATE",
            registro_id: persona.id,
            ip: req.ip,
            descripcion: `Se actualizó datos de la persona ID: ${persona.id}`
        });

        res.json(persona);
    } catch (error) {
        if (error instanceof FechaPersonaValidationError) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

export const eliminarPersona = async (req, res) => {
    try {
        const resultado = await personasService.eliminarPersona(req.params.id, req.user.id);
        if (!resultado) return res.status(404).json({ message: "Persona no encontrada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "personas",
            operacion: "DELETE_LOGIC",
            registro_id: req.params.id,
            ip: req.ip,
            descripcion: `Eliminación lógica de persona ID: ${req.params.id}`
        });

        res.json({ message: "Persona eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const reactivarPersona = async (req, res) => {
    try {
        const persona = await personasService.reactivarPersona(req.params.id);
        if (!persona) return res.status(404).json({ message: "Persona no encontrada" });

        req.auditHandled = true;
        await registrarAccion({
            usuario_id: req.user.id,
            tabla_afectada: "personas",
            operacion: "REACTIVATE",
            registro_id: persona.id,
            ip: req.ip,
            descripcion: `Se reactivó a la persona ID: ${persona.id}`
        });

        res.json({ message: "Persona reactivada correctamente", persona });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const buscarDuplicados = async (req, res) => {
    try {
        const { nombres, apellido_paterno, apellido_materno } = req.query;
        if (!nombres || !apellido_paterno || !apellido_materno) {
            return res.status(400).json({ message: "Faltan datos para la búsqueda" });
        }
        const personas = await personasService.buscarPersonaPorNombres(nombres, apellido_paterno, apellido_materno);
        res.json(personas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const listarTiposDocumento = async (req, res) => {
    try {
        const tipos = await personasService.listarTiposDocumento();
        res.json(tipos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
