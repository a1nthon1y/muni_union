import path from "node:path";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export const LOGOS = Object.freeze({
    principal: Object.freeze({
        clave: "logo_principal",
        filename: "Logo_MDUnion.svg",
        rutaPublica: "/Logo_MDUnion.svg",
    }),
    blanco: Object.freeze({
        clave: "logo_blanco",
        filename: "Logo_blanco.svg",
        rutaPublica: "/Logo_blanco.svg",
    }),
});

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

const obtenerDefinicion = (tipo) => {
    const logo = LOGOS[tipo];
    if (!logo) {
        throw new LogoValidationError("Tipo de logo no válido.");
    }
    return logo;
};

export const validarLogoSvg = ({
    tipo,
    originalname,
    mimetype,
    buffer,
}) => {
    const logo = obtenerDefinicion(tipo);

    if (originalname !== logo.filename) {
        throw new LogoValidationError(`El archivo debe llamarse exactamente ${logo.filename}.`);
    }
    if (mimetype && mimetype !== "image/svg+xml") {
        throw new LogoValidationError("Solo se acepta un archivo SVG con tipo image/svg+xml.");
    }
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new LogoValidationError("El archivo SVG está vacío.");
    }
    if (buffer.length > MAX_LOGO_BYTES) {
        throw new LogoValidationError("El archivo SVG no puede superar 2 MB.");
    }

    const contenido = buffer.toString("utf8");
    if (!/<svg(?:\s|>)/i.test(contenido)
        || PATRONES_ACTIVOS.some((patron) => patron.test(contenido))) {
        throw new LogoValidationError(
            "SVG no permitido: contiene estructura inválida o contenido activo.",
        );
    }

    return logo;
};

export const obtenerRutaLogo = (tipo, baseDir = LOGOS_DIR) => {
    const logo = obtenerDefinicion(tipo);
    return path.join(baseDir, logo.filename);
};

export const guardarLogoAtomico = async ({
    tipo,
    originalname,
    mimetype,
    buffer,
    baseDir = LOGOS_DIR,
}) => {
    const logo = validarLogoSvg({ tipo, originalname, mimetype, buffer });
    await mkdir(baseDir, { recursive: true });

    const destino = path.join(baseDir, logo.filename);
    const temporal = path.join(baseDir, `.${logo.filename}.${randomUUID()}.tmp`);

    try {
        await writeFile(temporal, buffer, { mode: 0o644, flag: "wx" });
        await rename(temporal, destino);
        return destino;
    } catch (error) {
        await rm(temporal, { force: true }).catch(() => {});
        throw error;
    }
};
