import { pool } from "../config/db.js";
import { access } from "node:fs/promises";
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

export const crearConfiguracionLogosService = ({
    db = pool,
    guardarLogo = guardarLogoAtomico,
    archivoExiste = existe,
    baseDir = LOGOS_DIR,
} = {}) => {
    const obtenerConfiguracionLogos = async () => {
        const { rows } = await db.query(
            `SELECT clave, valor, fecha_modificacion
             FROM configuracion_sistema
             WHERE clave IN ('logo_principal', 'logo_blanco')`,
        );
        const porClave = new Map(rows.map((row) => [row.clave, row]));

        const entradas = await Promise.all(
            Object.entries(LOGOS).map(async ([tipo, logo]) => {
                const row = porClave.get(logo.clave);
                return [tipo, {
                    tipo,
                    nombre: logo.filename,
                    ruta: logo.rutaPublica,
                    personalizado: await archivoExiste(obtenerRutaLogo(tipo, baseDir)),
                    fecha_modificacion: row?.fecha_modificacion || null,
                }];
            }),
        );
        return Object.fromEntries(entradas);
    };

    const actualizarLogo = async ({ tipo, file }) => {
        const logo = LOGOS[tipo];
        if (!logo) {
            throw new LogoValidationError("Tipo de logo no válido. Use principal o blanco.");
        }
        if (!file) {
            throw new LogoValidationError(`Seleccione el archivo ${logo.filename}.`);
        }

        await guardarLogo({
            tipo,
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer: file.buffer,
            baseDir,
        });

        const { rows } = await db.query(
            `INSERT INTO configuracion_sistema (clave, valor, descripcion, fecha_modificacion)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (clave) DO UPDATE
               SET valor = EXCLUDED.valor,
                   descripcion = EXCLUDED.descripcion,
                   fecha_modificacion = NOW()
             RETURNING fecha_modificacion`,
            [
                logo.clave,
                logo.rutaPublica,
                `Ruta canónica del ${tipo === "principal" ? "logo principal" : "logo blanco"} institucional.`,
            ],
        );

        return {
            tipo,
            nombre: logo.filename,
            ruta: logo.rutaPublica,
            personalizado: true,
            fecha_modificacion: rows[0]?.fecha_modificacion || null,
        };
    };

    return { obtenerConfiguracionLogos, actualizarLogo };
};

const configuracionLogosService = crearConfiguracionLogosService();

export const obtenerConfiguracionLogos =
    configuracionLogosService.obtenerConfiguracionLogos;
export const actualizarLogo = configuracionLogosService.actualizarLogo;
