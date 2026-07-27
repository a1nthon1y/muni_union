export const validarOrdenFechas = (
    fechaNacimiento?: string | null,
    fechaFallecimiento?: string | null,
): boolean => (
    !fechaNacimiento
    || !fechaFallecimiento
    || fechaFallecimiento >= fechaNacimiento
);

export const MENSAJE_ORDEN_FECHAS =
    "La fecha de fallecimiento no puede ser anterior a la fecha de nacimiento.";

export const normalizarFechaOpcional = (
    valor?: string | null,
): string | null => valor?.trim() || null;
