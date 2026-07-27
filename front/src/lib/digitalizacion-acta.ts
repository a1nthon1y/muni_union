type IdentidadActaInput = {
    modo: "CLASICO" | "CUI";
    tipoActa: "NACIMIENTO" | "MATRIMONIO" | "DEFUNCION";
    libro?: string;
    numeroActa: string;
};

type ActaIdentificable = {
    numero_acta: string;
    anio: number;
    persona_principal_id?: number;
    persona_secundaria_id?: number | null;
};

type PersonasEsperadas = {
    principalId: number;
    secundariaId?: number | null;
};

const PREFIJOS = Object.freeze({
    NACIMIENTO: "NAC",
    MATRIMONIO: "MAT",
    DEFUNCION: "DEF",
});

export const construirNumeroActa = ({
    modo,
    tipoActa,
    libro = "",
    numeroActa,
}: IdentidadActaInput): string => (
    modo === "CUI"
        ? numeroActa.trim().toUpperCase()
        : `${PREFIJOS[tipoActa]}-L${libro.trim()}-${numeroActa.trim()}`.toUpperCase()
);

export const actaCoincideConIdentidad = (
    acta: ActaIdentificable | null | undefined,
    numeroActa: string,
    anio: number,
    personas?: PersonasEsperadas,
): boolean => (
    !!acta
    && acta.numero_acta.trim().toUpperCase() === numeroActa.trim().toUpperCase()
    && Number(acta.anio) === Number(anio)
    && (
        !personas
        || (
            Number(acta.persona_principal_id) === Number(personas.principalId)
            && Number(acta.persona_secundaria_id ?? 0)
                === Number(personas.secundariaId ?? 0)
        )
    )
);
