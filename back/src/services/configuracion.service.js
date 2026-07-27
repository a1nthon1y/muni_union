import { access, stat } from "node:fs/promises";
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
            const rutaFisica = obtenerRutaLogo(tipo, baseDir);
            const personalizado = await archivoExiste(rutaFisica);
            return [tipo, {
                tipo,
                nombre: logo.filename,
                ruta: logo.rutaPublica,
                personalizado,
                fecha_modificacion: personalizado
                    ? await fechaModificacionArchivo(rutaFisica)
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
            throw new LogoValidationError(`Seleccione el archivo ${logo.filename}.`);
        }

        const ruta = await guardarLogo({
            tipo,
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer: file.buffer,
            baseDir,
        });

        return {
            tipo,
            nombre: logo.filename,
            ruta: logo.rutaPublica,
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
