import {
    obtenerConfiguracion,
    actualizarUrlVerificacion,
} from "../services/configuracion.service.js";

export const getConfiguracion = async (req, res) => {
    try {
        const data = await obtenerConfiguracion();
        res.json(data);
    } catch (err) {
        console.error("[configuracion] get:", err.message);
        res.status(500).json({ message: "Error al obtener la configuración" });
    }
};

export const putUrlVerificacion = async (req, res) => {
    try {
        const data = await actualizarUrlVerificacion(req.body?.url_verificacion_publica);
        res.json({
            message: "URL pública de verificación actualizada",
            ...data,
        });
    } catch (err) {
        const status = err.message?.includes("URL") ? 400 : 500;
        res.status(status).json({ message: err.message || "Error al guardar la configuración" });
    }
};
