/** Alias de columnas Excel → nombres canónicos del importador masivo. */
export const ALIAS_COLUMNAS_IMPORTACION = {
    fecha_defuncion: "fecha_fallecimiento",
    fecha_de_fallecimiento: "fecha_fallecimiento",
    f_fallecimiento: "fecha_fallecimiento",
    f_fallec: "fecha_fallecimiento",
    conyuge_fecha_defuncion: "conyuge_fecha_fallecimiento",
    conyuge_fecha_de_fallecimiento: "conyuge_fecha_fallecimiento",
};

export const normalizarColumnasImportacion = (fila) => {
    if (!fila || typeof fila !== "object") return fila;

    const out = { ...fila };
    for (const [alias, canon] of Object.entries(ALIAS_COLUMNAS_IMPORTACION)) {
        const aliasVal = out[alias];
        const canonVal = out[canon];
        const aliasTieneValor = aliasVal !== undefined && aliasVal !== null && String(aliasVal).trim() !== "";
        const canonVacio = canonVal === undefined || canonVal === null || String(canonVal).trim() === "";
        if (aliasTieneValor && canonVacio) {
            out[canon] = aliasVal;
        }
    }
    return out;
};
