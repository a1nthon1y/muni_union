import { describe, expect, test } from "vitest";
import { validarArchivoLogo } from "./logo-institucional";

describe("validarArchivoLogo", () => {
    test("acepta SVG con cualquier nombre", () => {
        const file = new File(["<svg/>"], "mi-logo.svg", {
            type: "image/svg+xml",
        });
        expect(validarArchivoLogo(file)).toBeNull();
    });

    test("acepta PNG válido", () => {
        const file = new File(["data"], "logo.png", {
            type: "image/png",
        });
        expect(validarArchivoLogo(file)).toBeNull();
    });

    test("acepta JPEG válido", () => {
        const file = new File(["data"], "logo.jpg", {
            type: "image/jpeg",
        });
        expect(validarArchivoLogo(file)).toBeNull();
    });

    test("acepta SVG con nombre canónico", () => {
        const file = new File(["<svg/>"], "Logo_MDUnion.svg", {
            type: "image/svg+xml",
        });
        expect(validarArchivoLogo(file)).toBeNull();
    });

    test("rechaza formato no válido", () => {
        const file = new File(["data"], "logo.gif", {
            type: "image/gif",
        });
        expect(validarArchivoLogo(file)).toMatch(
            /Formato incorrecto/,
        );
    });
});
