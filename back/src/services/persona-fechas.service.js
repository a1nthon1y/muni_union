const tieneCampo = (objeto, campo) => (
    Object.prototype.hasOwnProperty.call(objeto ?? {}, campo)
);

const ETIQUETAS = Object.freeze({
    fecha_nacimiento: "La fecha de nacimiento",
    fecha_fallecimiento: "La fecha de fallecimiento",
});

export class FechaPersonaValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "FechaPersonaValidationError";
    }
}

export const normalizarFechaPersona = (valor, campo) => {
    if (valor === null || valor === undefined || valor === "") return null;

    const texto = valor instanceof Date
        ? valor.toISOString().slice(0, 10)
        : String(valor).trim();
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

    if (!coincidencia) {
        throw new FechaPersonaValidationError(
            `${ETIQUETAS[campo] ?? "La fecha"} no es válida. Use el formato YYYY-MM-DD.`,
        );
    }

    const [, anioTexto, mesTexto, diaTexto] = coincidencia;
    const anio = Number(anioTexto);
    const mes = Number(mesTexto);
    const dia = Number(diaTexto);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));

    if (
        fecha.getUTCFullYear() !== anio
        || fecha.getUTCMonth() !== mes - 1
        || fecha.getUTCDate() !== dia
    ) {
        throw new FechaPersonaValidationError(
            `${ETIQUETAS[campo] ?? "La fecha"} no es válida.`,
        );
    }

    return texto;
};

export const resolverFechasPersona = (actual, cambios = {}) => {
    const fecha_nacimiento = normalizarFechaPersona(
        tieneCampo(cambios, "fecha_nacimiento")
            ? cambios.fecha_nacimiento
            : actual?.fecha_nacimiento,
        "fecha_nacimiento",
    );
    const fecha_fallecimiento = normalizarFechaPersona(
        tieneCampo(cambios, "fecha_fallecimiento")
            ? cambios.fecha_fallecimiento
            : actual?.fecha_fallecimiento,
        "fecha_fallecimiento",
    );

    if (
        fecha_nacimiento
        && fecha_fallecimiento
        && fecha_fallecimiento < fecha_nacimiento
    ) {
        throw new FechaPersonaValidationError(
            "La fecha de fallecimiento no puede ser anterior a la fecha de nacimiento.",
        );
    }

    return { fecha_nacimiento, fecha_fallecimiento };
};
