import { access, stat } from "node:fs/promises";
import path from "node:path";
import {
    guardarLogoAtomico,
    LOGOS,
    LOGOS_DIR,
    LogoValidationError,
    obtenerRutaLogo,
} from "./identidad-visual.service.js";

const existe = async (ruta) => {
    try {
        await access(ruta);
        return true;
    } catch {
        return false;
    }
};

const fechaModificacionArchivo = async (ruta) => {
    try {
        const info = await stat(ruta);
        return info.mtime.toISOString();
    } catch {
        return null;
    }
};

const armarEstadoLogos = async ({ archivoExiste, baseDir }) => {
    const entradas = await Promise.all(
        Object.entries(LOGOS).map(async ([tipo, logo]) => {
            // Buscar primero extensiones no-SVG (indican archivo subido por el usuario)
            const extensionesPersonalizadas = [".png", ".jpg", ".jpeg"];
            let rutaPersonalizada = null;

            for (const ext of extensionesPersonalizadas) {
                const ruta = path.join(baseDir, `${logo.basename}${ext}`);
                if (await archivoExiste(ruta)) {
                    rutaPersonalizada = ruta;
                    break;
                }
            }

            // Si hay un archivo personalizado (no SVG), usarlo
            if (rutaPersonalizada) {
                const extension = rutaPersonalizada.match(/\.(svg|png|jpe?g)$/)?.[0] || ".svg";
                const nombreArchivo = `${logo.basename}${extension}`;
                const rutaPublica = `/uploads/configuracion/logos/${nombreArchivo}`;
                return [tipo, {
                    tipo,
                    nombre: nombreArchivo,
                    ruta: rutaPublica,
                    personalizado: true,
                    fecha_modificacion: await fechaModificacionArchivo(rutaPersonalizada),
                }];
            }

            // Si solo existe SVG, puede ser el original o uno subido como SVG
            // Lo consideramos predeterminado (no personalizado) por convención
            const rutaSvg = path.join(baseDir, `${logo.basename}.svg`);
            const svgExiste = await archivoExiste(rutaSvg);
            const nombreArchivo = `${logo.basename}.svg`;
            const rutaPublica = `/uploads/configuracion/logos/${nombreArchivo}`;

            return [tipo, {
                tipo,
                nombre: nombreArchivo,
                ruta: rutaPublica,
                personalizado: false,
                fecha_modificacion: svgExiste
                    ? await fechaModificacionArchivo(rutaSvg)
                    : null,
            }];
        }),
    );
    return Object.fromEntries(entradas);
};

export const crearConfiguracionLogosService = ({
    guardarLogo = guardarLogoAtomico,
    archivoExiste = existe,
    baseDir = LOGOS_DIR,
} = {}) => {
    const obtenerConfiguracionLogos = async () => (
        armarEstadoLogos({ archivoExiste, baseDir })
    );

    const actualizarLogo = async ({ tipo, file }) => {
        const logo = LOGOS[tipo];
        if (!logo) {
            throw new LogoValidationError("Tipo de logo no válido. Use principal o blanco.");
        }
        if (!file) {
            throw new LogoValidationError("Seleccione un archivo SVG válido.");
        }

        const ruta = await guardarLogo({
            tipo,
            mimetype: file.mimetype,
            buffer: file.buffer,
            baseDir,
        });

        // Obtener la extensión correcta del archivo guardado
        const extension = ruta.match(/\.(svg|png|jpe?g)$/)?.[0] || ".svg";
        const nombreArchivo = `${logo.basename}${extension}`;
        // Usar siempre la ruta pública bajo /uploads/... (consistente con armarEstadoLogos)
        const rutaPublica = `/uploads/configuracion/logos/${nombreArchivo}`;

        // Eliminar otros formatos personalizados obsoletos para evitar conflictos de prioridad
        const otrasExtensiones = [".png", ".jpg", ".jpeg"].filter(ext => ext !== extension);
        const { rm } = await import("node:fs/promises");
        for (const ext of otrasExtensiones) {
            const rutaObsoleta = path.join(baseDir, `${logo.basename}${ext}`);
            await rm(rutaObsoleta, { force: true }).catch(() => {});
        }

        return {
            tipo,
            nombre: nombreArchivo,
            ruta: rutaPublica,
            personalizado: true,
            fecha_modificacion: await fechaModificacionArchivo(ruta),
        };
    };

    return { obtenerConfiguracionLogos, actualizarLogo };
};

const configuracionLogosService = crearConfiguracionLogosService();

export const obtenerConfiguracionLogos =
    configuracionLogosService.obtenerConfiguracionLogos;
export const actualizarLogo = configuracionLogosService.actualizarLogo;
