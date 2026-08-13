/** Validaciones y sanitización compartidas para formularios del registro civil. */

/** Convención histórica del registro: persona sin apellido o sin nombre aún. */
export const SIN_APELLIDO = "S/A";
export const SIN_NOMBRE = "S/N";

export const REGEX_NOMBRE = /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]*$/i;
export const REGEX_DNI = /^\d{8}$/;
export const REGEX_CUI = /^\d{6,12}$/;
export const REGEX_FOLIO = /^\d{1,6}$/;
export const REGEX_LIBRO = /^\d{1,4}$/;
export const REGEX_TELEFONO = /^\d{7,9}$/;
export const REGEX_DOC_ALFANUM = /^[A-Z0-9-]{4,15}$/i;

const hoyEnLima = (): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());

export const esSinApellido = (valor?: string): boolean =>
    (valor ?? "").trim().toUpperCase() === SIN_APELLIDO;

export const esSinNombre = (valor?: string): boolean =>
    (valor ?? "").trim().toUpperCase() === SIN_NOMBRE;

export const sanitizarNombre = (valor: string): string =>
    valor.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, "").toUpperCase();

/** Permite escribir S/A manualmente mientras se tipea. */
export const sanitizarApellido = (valor: string): string => {
    const t = valor.trim().toUpperCase();
    if (t === "S" || t === "S/" || t === SIN_APELLIDO) {
        return t === SIN_APELLIDO ? SIN_APELLIDO : t.replace(/[^S/A]/g, "");
    }
    return sanitizarNombre(valor);
};

/** Permite escribir S/N manualmente mientras se tipea. */
export const sanitizarNombres = (valor: string): string => {
    const t = valor.trim().toUpperCase();
    if (t === "S" || t === "S/" || t === SIN_NOMBRE) {
        return t === SIN_NOMBRE ? SIN_NOMBRE : t.replace(/[^S/N]/g, "");
    }
    return sanitizarNombre(valor);
};

export const sanitizarSoloDigitos = (valor: string, maxLen?: number): string => {
    const digitos = valor.replace(/\D/g, "");
    return maxLen != null ? digitos.slice(0, maxLen) : digitos;
};

export const sanitizarDocumento = (valor: string, tipoDocumento: string): string => {
    const tipo = tipoDocumento.toUpperCase();
    if (tipo.includes("SIN DOCUMENTO")) return "";
    if (tipo === "DNI") return sanitizarSoloDigitos(valor, 8);
    if (tipo.includes("LIBRETA")) return sanitizarSoloDigitos(valor, 15);
    return valor.replace(/[^A-Z0-9-]/gi, "").toUpperCase().slice(0, 15);
};

export const maxLengthDocumento = (tipoDocumento: string): number => {
    const tipo = tipoDocumento.toUpperCase();
    if (tipo === "DNI") return 8;
    if (tipo.includes("SIN DOCUMENTO")) return 0;
    return 15;
};

export const validarDocumento = (
    tipoDocumento: string,
    numero?: string,
): string | null => {
    const tipo = (tipoDocumento || "DNI").toUpperCase();
    const n = (numero ?? "").trim();

    if (tipo.includes("SIN DOCUMENTO")) {
        return n ? "No ingrese número si el tipo es Sin documento" : null;
    }
    if (!n) return null;

    if (tipo === "DNI") {
        return REGEX_DNI.test(n) ? null : "El DNI debe tener exactamente 8 dígitos";
    }
    if (tipo.includes("CARNET")) {
        return REGEX_DOC_ALFANUM.test(n)
            ? null
            : "Carnet extranjería: 4 a 15 caracteres alfanuméricos";
    }
    if (tipo.includes("PASAPORTE")) {
        return REGEX_DOC_ALFANUM.test(n)
            ? null
            : "Pasaporte: 4 a 15 caracteres alfanuméricos";
    }
    if (tipo.includes("PART") || tipo.includes("NACIMIENTO")) {
        return REGEX_DOC_ALFANUM.test(n)
            ? null
            : "Partida de nacimiento: 4 a 15 caracteres alfanuméricos";
    }
    if (tipo.includes("LIBRETA")) {
        return /^\d{4,15}$/.test(n)
            ? null
            : "Libreta electoral: 4 a 15 dígitos";
    }

    return n.length <= 15 ? null : "Máximo 15 caracteres";
};

export const validarNumeroActa = (
    modo: "CLASICO" | "CUI",
    numero: string,
): string | null => {
    const n = numero.trim();
    if (!n) return "Campo obligatorio";

    if (modo === "CUI") {
        return REGEX_CUI.test(n)
            ? null
            : "CUI: ingrese entre 6 y 12 dígitos (código RENIEC)";
    }

    return REGEX_FOLIO.test(n)
        ? null
        : "N° de acta: solo números, máximo 6 dígitos";
};

export const validarLibro = (libro?: string): string | null => {
    const n = (libro ?? "").trim();
    if (!n) return "Libro es obligatorio en modo clásico";
    return REGEX_LIBRO.test(n) ? null : "Libro: solo números, 1 a 4 dígitos";
};

export const validarTelefono = (telefono?: string): string | null => {
    const n = (telefono ?? "").trim();
    if (!n) return null;
    return REGEX_TELEFONO.test(n) ? null : "Teléfono: 7 a 9 dígitos numéricos";
};

export const validarFechaNoFutura = (
    fecha?: string,
    etiqueta = "La fecha",
): string | null => {
    const n = (fecha ?? "").trim();
    if (!n) return null;
    return n > hoyEnLima()
        ? `${etiqueta} no puede ser posterior a hoy`
        : null;
};

export const validarApellido = (
    valor: string | undefined,
    etiqueta: string,
): string | null => {
    const n = (valor ?? "").trim();
    if (!n) return `${etiqueta} es obligatorio (marque «Sin apellido» o ingrese S/A)`;
    if (esSinApellido(n)) return null;
    if (n.length < 2) return `${etiqueta}: mínimo 2 caracteres`;
    if (n.length > 80) return `${etiqueta}: máximo 80 caracteres`;
    return REGEX_NOMBRE.test(n) ? null : `${etiqueta}: solo letras y espacios`;
};

export const validarNombres = (valor: string | undefined): string | null => {
    const n = (valor ?? "").trim();
    if (!n) return "Nombres es obligatorio (marque «Sin nombre» o ingrese S/N)";
    if (esSinNombre(n)) return null;
    if (n.length < 2) return "Nombres: mínimo 2 caracteres";
    if (n.length > 80) return "Nombres: máximo 80 caracteres";
    return REGEX_NOMBRE.test(n) ? null : "Nombres: solo letras y espacios";
};

/** @deprecated Usar validarApellido o validarNombres según el campo. */
export const validarNombrePersona = (
    valor: string | undefined,
    etiqueta: string,
    obligatorio = true,
): string | null => {
    if (etiqueta.toLowerCase().includes("nombre") && !etiqueta.toLowerCase().includes("ap.")) {
        return obligatorio ? validarNombres(valor) : (valor?.trim() ? validarNombres(valor) : null);
    }
    return obligatorio ? validarApellido(valor, etiqueta) : (valor?.trim() ? validarApellido(valor, etiqueta) : null);
};
