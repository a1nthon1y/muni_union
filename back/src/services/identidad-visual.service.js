import path from "node:path";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export const LOGOS = Object.freeze({
    principal: Object.freeze({
        clave: "logo_principal",
        basename: "Logo_MDUnion",
        rutaPublica: "/Logo_MDUnion",
    }),
    blanco: Object.freeze({
        clave: "logo_blanco",
        basename: "Logo_blanco",
        rutaPublica: "/Logo_blanco",
    }),
});

const EXTENSIONES_MIME = {
    "image/svg+xml": ".svg",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
};

export const LOGOS_DIR = process.env.LOGOS_DIR
    || path.resolve(process.cwd(), "uploads/configuracion/logos");

export class LogoValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "LogoValidationError";
    }
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const PATRONES_ACTIVOS = [
    /<!DOCTYPE/i,
    /<!ENTITY/i,
    /<script\b/i,
    /<foreignObject\b/i,
    /<\?xml-stylesheet\b/i,
    /\son[a-z]+\s*=/i,
    /javascript\s*:/i,
    /@import\b/i,
    /(?:href|xlink:href)\s*=\s*["']\s*(?!#)/i,
    /url\(\s*["']?\s*(?:https?:|\/\/|javascript:)/i,
];

const FORMATOS_VALIDOS = new Set([
    "image/svg+xml",
    "image/png",
    "image/jpeg",
    "image/jpg",
]);

const obtenerDefinicion = (tipo) => {
    const logo = LOGOS[tipo];
    if (!logo) {
        throw new LogoValidationError("Tipo de logo no válido.");
    }
    return logo;
};

export const validarLogo = ({
    tipo,
    mimetype,
    buffer,
}) => {
    const logo = obtenerDefinicion(tipo);

    if (mimetype && !FORMATOS_VALIDOS.has(mimetype)) {
        throw new LogoValidationError(
            "Solo se aceptan archivos SVG, PNG o JPEG.",
        );
    }
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new LogoValidationError("El archivo está vacío.");
    }
    if (buffer.length > MAX_LOGO_BYTES) {
        throw new LogoValidationError("El archivo no puede superar 2 MB.");
    }

    // Solo validar contenido SVG para archivos SVG
    if (mimetype === "image/svg+xml") {
        const contenido = buffer.toString("utf8");
        if (!/<svg(?:\s|>)/i.test(contenido)
            || PATRONES_ACTIVOS.some((patron) => patron.test(contenido))) {
            throw new LogoValidationError(
                "SVG no permitido: contiene estructura inválida o contenido activo.",
            );
        }
    }

    return logo;
};

// Mantener el nombre anterior por compatibilidad
export const validarLogoSvg = validarLogo;

export const obtenerRutaLogo = (tipo, baseDir = LOGOS_DIR) => {
    const logo = obtenerDefinicion(tipo);
    // Por defecto busca la versión SVG, pero esto se podría extender
    // para buscar cualquier formato disponible
    return path.join(baseDir, `${logo.basename}.svg`);
};

export const guardarLogoAtomico = async ({
    tipo,
    mimetype,
    buffer,
    baseDir = LOGOS_DIR,
}) => {
    const logo = validarLogo({ tipo, mimetype, buffer });
    await mkdir(baseDir, { recursive: true });

    // Determinar la extensión correcta según el tipo MIME
    const extension = EXTENSIONES_MIME[mimetype] || ".svg";
    const nombreArchivo = `${logo.basename}${extension}`;
    
    const destino = path.join(baseDir, nombreArchivo);
    const temporal = path.join(baseDir, `.${nombreArchivo}.${randomUUID()}.tmp`);

    try {
        await writeFile(temporal, buffer, { mode: 0o644, flag: "wx" });
        await rename(temporal, destino);
        return destino;
    } catch (error) {
        await rm(temporal, { force: true }).catch(() => {});
        throw error;
    }
};
