import {
    actualizarLogo,
    obtenerConfiguracionLogos,
} from "../services/configuracion.service.js";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import {
    LOGOS,
    LOGOS_DIR,
    LogoValidationError,
} from "../services/identidad-visual.service.js";

const tipoDesdeRuta = (ruta) => {
    // Normalizar la ruta para comparar sin extensión
    // Soportar rutas como /uploads/configuracion/logos/Logo_MDUnion.svg
    const nombreArchivo = ruta.split('/').pop();
    const nombreBase = nombreArchivo.replace(/\.(svg|png|jpe?g)$/, "");
    return Object.entries(LOGOS)
        .find(([, logo]) => logo.basename === nombreBase)?.[0];
};

const obtenerContentType = (ruta) => {
    const extension = ruta.split('.').pop().toLowerCase();
    const contentTypes = {
        svg: "image/svg+xml",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
    };
    return contentTypes[extension] || "image/svg+xml";
};

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

    const getLogosPublicController = async (_req, res) => {
        try {
            const configuracion = await getLogos();
            // Devolver solo la información pública (rutas) sin metadatos sensibles
            const publicConfig = {
                principal: {
                    tipo: configuracion.principal.tipo,
                    ruta: configuracion.principal.ruta,
                    personalizado: configuracion.principal.personalizado,
                    fecha_modificacion: configuracion.principal.fecha_modificacion,
                },
                blanco: {
                    tipo: configuracion.blanco.tipo,
                    ruta: configuracion.blanco.ruta,
                    personalizado: configuracion.blanco.personalizado,
                    fecha_modificacion: configuracion.blanco.fecha_modificacion,
                },
            };
            res.json(publicConfig);
        } catch (error) {
            console.error("[configuracion] logos públicos:", error.message);
            // En caso de error, devolver la configuración por defecto con rutas del backend
            res.json({
                principal: {
                    tipo: "principal",
                    ruta: "/uploads/configuracion/logos/Logo_MDUnion.svg",
                    personalizado: false,
                },
                blanco: {
                    tipo: "blanco",
                    ruta: "/uploads/configuracion/logos/Logo_blanco.svg",
                    personalizado: false,
                },
            });
        }
    };

    const putLogoController = async (req, res) => {
        const tipo = req.params?.tipo;
        const logo = LOGOS[tipo];
        if (!logo || !req.file) {
            return res.status(400).json({
                message: logo
                    ? "Seleccione un archivo válido."
                    : "Tipo de logo no válido. Use principal o blanco.",
            });
        }

        try {
            const data = await updateLogo({ tipo, file: req.file });
            return res.json({
                message: `${data.nombre} fue reemplazado correctamente.`,
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

        const logo = LOGOS[tipo];
        if (!logo) {
            return res.status(404).json({ message: "Logo no encontrado" });
        }

        // Priorizar archivos personalizados (no-SVG) sobre el SVG de fábrica
        const extensiones = [".png", ".jpg", ".jpeg", ".svg"];
        let ruta = null;
        
        for (const ext of extensiones) {
            const rutaPosible = path.join(logosDir, `${logo.basename}${ext}`);
            try {
                await accessFile(rutaPosible);
                ruta = rutaPosible;
                break;
            } catch {
                // Continuar con la siguiente extensión
            }
        }

        if (!ruta) {
            return res.status(404).json({ message: "Logo personalizado no disponible" });
        }

        try {
            const contentType = obtenerContentType(ruta);
            res.set({
                "Content-Type": contentType,
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
        getLogosPublic: getLogosPublicController,
        putLogo: putLogoController,
        serveLogo: serveLogoController,
    };
};

const controller = crearConfiguracionController();

export const getLogos = controller.getLogos;
export const getLogosPublic = controller.getLogosPublic;
export const putLogo = controller.putLogo;
export const serveLogo = controller.serveLogo;
