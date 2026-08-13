/** Convención histórica del registro: persona sin apellido o sin nombre aún. */
export const SIN_APELLIDO = "S/A";
export const SIN_NOMBRE = "S/N";

export const esSinApellido = (valor) =>
    (valor ?? "").trim().toUpperCase() === SIN_APELLIDO;

export const esSinNombre = (valor) =>
    (valor ?? "").trim().toUpperCase() === SIN_NOMBRE;

/**
 * Sin DNI no se puede distinguir homónimos por nombre cuando el registro
 * usa placeholders S/N o S/A. En esos casos cada acta debe tener su persona.
 */
export const debeOmitirBusquedaPorNombre = (
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    dni,
) => {
    if (dni?.trim()) return false;
    if (esSinNombre(nombres)) return true;
    if (esSinApellido(apellidoPaterno) && esSinApellido(apellidoMaterno)) return true;
    return false;
};
