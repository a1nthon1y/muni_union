import { describe, expect, it } from "vitest";
import {
    esSinApellido,
    esSinNombre,
    sanitizarApellido,
    sanitizarDocumento,
    sanitizarNombre,
    sanitizarNombres,
    SIN_APELLIDO,
    SIN_NOMBRE,
    validarApellido,
    validarDocumento,
    validarNombres,
    validarNumeroActa,
    validarTelefono,
} from "./form-validators";

describe("form-validators", () => {
    it("sanitiza nombres eliminando números y símbolos", () => {
        expect(sanitizarNombre("23R23Q")).toBe("RQ");
        expect(sanitizarNombre("maría-josé")).toBe("MARÍAJOSÉ");
    });

    it("valida DNI de 8 dígitos", () => {
        expect(validarDocumento("DNI", "12345678")).toBeNull();
        expect(validarDocumento("DNI", "1321312")).toMatch(/8 dígitos/);
        expect(validarDocumento("DNI", "")).toBeNull();
    });

    it("valida CUI numérico acotado", () => {
        expect(validarNumeroActa("CUI", "12345678")).toBeNull();
        expect(validarNumeroActa("CUI", "22")).toMatch(/6 y 12/);
        expect(validarNumeroActa("CUI", "2".repeat(50))).toMatch(/6 y 12/);
    });

    it("valida folio clásico", () => {
        expect(validarNumeroActa("CLASICO", "45")).toBeNull();
        expect(validarNumeroActa("CLASICO", "abc")).toMatch(/solo números/);
    });

    it("sanitiza documento según tipo", () => {
        expect(sanitizarDocumento("12abc34", "DNI")).toBe("1234");
        expect(sanitizarDocumento("X123", "PASAPORTE")).toBe("X123");
    });

    it("valida teléfono peruano", () => {
        expect(validarTelefono("987654321")).toBeNull();
        expect(validarTelefono("rq23r")).toMatch(/7 a 9/);
    });

    it("acepta convención S/A y S/N", () => {
        expect(validarApellido(SIN_APELLIDO, "Ap. paterno")).toBeNull();
        expect(validarNombres(SIN_NOMBRE)).toBeNull();
        expect(esSinApellido("s/a")).toBe(true);
        expect(esSinNombre("S/N")).toBe(true);
    });

    it("sanitiza apellidos permitiendo S/A", () => {
        expect(sanitizarApellido("s/a")).toBe(SIN_APELLIDO);
        expect(sanitizarNombres("s/n")).toBe(SIN_NOMBRE);
    });
});
