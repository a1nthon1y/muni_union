import { describe, expect, test } from "vitest";
import { validarArchivoLogo } from "./logo-institucional";

describe("validarArchivoLogo", () => {
    test("acepta SVG con nombre canónico", () => {
        const file = new File(["<svg/>"], "Logo_MDUnion.svg", {
            type: "image/svg+xml",
        });
        expect(validarArchivoLogo(file, "Logo_MDUnion.svg")).toBeNull();
    });

    test("rechaza nombre distinto", () => {
        const file = new File(["<svg/>"], "mi-logo.svg", {
            type: "image/svg+xml",
        });
        expect(validarArchivoLogo(file, "Logo_MDUnion.svg")).toMatch(
            /Logo_MDUnion\.svg/,
        );
    });

    test("rechaza formato distinto de SVG", () => {
        const file = new File(["data"], "Logo_MDUnion.svg", {
            type: "image/png",
        });
        expect(validarArchivoLogo(file, "Logo_MDUnion.svg")).toMatch(
            /Formato incorrecto/,
        );
    });
});
