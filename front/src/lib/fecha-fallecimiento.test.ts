import { describe, expect, test } from "vitest";
import {
    actaCoincideConIdentidad,
    construirNumeroActa,
} from "./digitalizacion-acta";
import { validarOrdenFechas } from "./persona-fechas";

describe("fecha de fallecimiento opcional", () => {
    test("fallecimiento vacío es válido", () => {
        expect(validarOrdenFechas("1990-01-01", "")).toBe(true);
        expect(validarOrdenFechas("", "")).toBe(true);
    });

    test("fallecimiento anterior al nacimiento es inválido", () => {
        expect(validarOrdenFechas("2000-01-01", "1999-12-31")).toBe(false);
    });
});

describe("identidad del acta en digitalización", () => {
    test("construye códigos clásicos y CUI normalizados", () => {
        expect(construirNumeroActa({
            modo: "CLASICO",
            tipoActa: "NACIMIENTO",
            libro: "2",
            numeroActa: "15",
        })).toBe("NAC-L2-15");
        expect(construirNumeroActa({
            modo: "CUI",
            tipoActa: "DEFUNCION",
            libro: "",
            numeroActa: " def-0001 ",
        })).toBe("DEF-0001");
    });

    test("detecta un acta retenida con identidad diferente", () => {
        expect(actaCoincideConIdentidad(
            { numero_acta: "NAC-L1-10", anio: 2026 },
            "NAC-L1-11",
            2026,
        )).toBe(false);
    });

    test("acepta únicamente identidad y año coincidentes", () => {
        expect(actaCoincideConIdentidad(
            { numero_acta: "NAC-L1-10", anio: 2026 },
            "NAC-L1-10",
            2026,
        )).toBe(true);
    });

    test("rechaza un acta retenida para otra persona", () => {
        expect(actaCoincideConIdentidad(
            {
                numero_acta: "NAC-L1-10",
                anio: 2026,
                persona_principal_id: 20,
                persona_secundaria_id: null,
            },
            "NAC-L1-10",
            2026,
            { principalId: 21, secundariaId: null },
        )).toBe(false);
    });
});
