export const LOGOS_INSTITUCIONALES = {
    principal: {
        titulo: "Logo principal",
        nombreArchivo: "Logo_MDUnion.svg",
        rutaPublica: "/Logo_MDUnion.svg",
        uso:
            "Acceso al sistema, portal de verificación e impresión de actas y solicitudes.",
    },
    blanco: {
        titulo: "Logo para menú (fondo oscuro)",
        nombreArchivo: "Logo_blanco.svg",
        rutaPublica: "/Logo_blanco.svg",
        uso: "Menú lateral del sistema (expandido y contraído).",
    },
} as const;

export type LogoInstitucionalTipo = keyof typeof LOGOS_INSTITUCIONALES;

export type LogoEstadoBasico = {
    tipo: LogoInstitucionalTipo;
    nombre: typeof LOGOS_INSTITUCIONALES.principal.nombreArchivo
        | typeof LOGOS_INSTITUCIONALES.blanco.nombreArchivo;
    ruta: typeof LOGOS_INSTITUCIONALES.principal.rutaPublica
        | typeof LOGOS_INSTITUCIONALES.blanco.rutaPublica;
    personalizado: boolean;
    fecha_modificacion: string | null;
};

export const logosInstitucionalesPorDefecto = (): Record<
    LogoInstitucionalTipo,
    LogoEstadoBasico
> => ({
    principal: {
        tipo: "principal",
        nombre: LOGOS_INSTITUCIONALES.principal.nombreArchivo,
        ruta: LOGOS_INSTITUCIONALES.principal.rutaPublica,
        personalizado: false,
        fecha_modificacion: null,
    },
    blanco: {
        tipo: "blanco",
        nombre: LOGOS_INSTITUCIONALES.blanco.nombreArchivo,
        ruta: LOGOS_INSTITUCIONALES.blanco.rutaPublica,
        personalizado: false,
        fecha_modificacion: null,
    },
});

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const validarArchivoLogo = (
    file: File,
    nombreEsperado: string,
): string | null => {
    if (file.name !== nombreEsperado) {
        return `Nombre incorrecto. El archivo debe llamarse exactamente ${nombreEsperado}.`;
    }
    if (!file.name.toLowerCase().endsWith(".svg")) {
        return "Formato incorrecto. Solo se acepta archivo SVG (.svg).";
    }
    if (file.type && file.type !== "image/svg+xml") {
        return "Formato incorrecto. Solo se acepta SVG con tipo image/svg+xml.";
    }
    if (file.size === 0) {
        return "El archivo está vacío.";
    }
    if (file.size > MAX_LOGO_BYTES) {
        return "El archivo supera el tamaño máximo permitido (2 MB).";
    }
    return null;
};
