import {
    actualizarLogo,
    obtenerConfiguracionLogos,
} from "../services/configuracion.service.js";
import { access } from "node:fs/promises";
import {
    LOGOS,
    LOGOS_DIR,
    LogoValidationError,
    obtenerRutaLogo,
} from "../services/identidad-visual.service.js";

const tipoDesdeRuta = (ruta) => Object.entries(LOGOS)
    .find(([, logo]) => logo.rutaPublica === ruta)?.[0];

export const crearConfiguracionController = ({
    getLogos = obtenerConfiguracionLogos,
    updateLogo = actualizarLogo,
    accessFile = access,
    logosDir = LOGOS_DIR,
} = {}) => {
    const getLogosController = async (_req, res) => {
        try {
            res.json(await getLogos());
        } catch (error) {
            console.error("[configuracion] logos:", error.message);
            res.status(500).json({ message: "Error al obtener la identidad visual" });
        }
    };

    const putLogoController = async (req, res) => {
        const tipo = req.params?.tipo;
        const logo = LOGOS[tipo];
        if (!logo || !req.file) {
            const nombre = logo?.filename || "correspondiente";
            return res.status(400).json({
                message: logo
                    ? `Seleccione el archivo ${nombre}.`
                    : "Tipo de logo no válido. Use principal o blanco.",
            });
        }

        try {
            const data = await updateLogo({ tipo, file: req.file });
            return res.json({
                message: `${logo.filename} fue reemplazado correctamente.`,
                ...data,
            });
        } catch (error) {
            if (error instanceof LogoValidationError) {
                return res.status(400).json({ message: error.message });
            }
            console.error(`[configuracion] actualizar ${tipo}:`, error.message);
            return res.status(500).json({
                message: "No se pudo reemplazar el logo. El archivo anterior continúa disponible.",
            });
        }
    };

    const serveLogoController = async (req, res) => {
        const tipo = tipoDesdeRuta(req.path);
        if (!tipo) {
            return res.status(404).json({ message: "Logo no encontrado" });
        }

        const ruta = obtenerRutaLogo(tipo, logosDir);
        try {
            await accessFile(ruta);
            res.set({
                "Content-Type": "image/svg+xml",
                "Cache-Control": "no-store, max-age=0",
                "X-Content-Type-Options": "nosniff",
            });
            return res.sendFile(ruta);
        } catch {
            return res.status(404).json({ message: "Logo personalizado no disponible" });
        }
    };

    return {
        getLogos: getLogosController,
        putLogo: putLogoController,
        serveLogo: serveLogoController,
    };
};

const controller = crearConfiguracionController();

export const getLogos = controller.getLogos;
export const putLogo = controller.putLogo;
export const serveLogo = controller.serveLogo;
