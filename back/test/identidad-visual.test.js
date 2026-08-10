import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
    guardarLogoAtomico,
    obtenerRutaLogo,
    validarLogoSvg,
} from "../src/services/identidad-visual.service.js";

const svgSeguro = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
);

const archivoPrincipal = (overrides = {}) => ({
    tipo: "principal",
    mimetype: "image/svg+xml",
    buffer: svgSeguro,
    ...overrides,
});

test("acepta el SVG principal con cualquier nombre", () => {
    assert.doesNotThrow(() => validarLogoSvg(archivoPrincipal()));
});

test("acepta el SVG blanco con cualquier nombre", () => {
    assert.doesNotThrow(() => validarLogoSvg({
        tipo: "blanco",
        mimetype: "image/svg+xml",
        buffer: svgSeguro,
    }));
});

test("acepta PNG válido", () => {
    assert.doesNotThrow(() => validarLogoSvg({
        tipo: "principal",
        mimetype: "image/png",
        buffer: Buffer.alloc(100), // Datos PNG simulados
    }));
});

test("acepta JPEG válido", () => {
    assert.doesNotThrow(() => validarLogoSvg({
        tipo: "principal",
        mimetype: "image/jpeg",
        buffer: Buffer.alloc(100), // Datos JPEG simulados
    }));
});

test("rechaza formato no válido", () => {
    assert.throws(
        () => validarLogoSvg({
            tipo: "principal",
            mimetype: "image/gif",
            buffer: Buffer.alloc(100),
        }),
        /Solo se aceptan archivos SVG, PNG o JPEG/,
    );
});

test("rechaza un archivo que excede 2 MB", () => {
    assert.throws(
        () => validarLogoSvg(archivoPrincipal({ buffer: Buffer.alloc(2 * 1024 * 1024 + 1) })),
        /2 MB/,
    );
});

for (const contenido of [
    "<svg><script>alert(1)</script></svg>",
    '<svg onload="alert(1)"></svg>',
    '<svg><a href="javascript:alert(1)"/></svg>',
    '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>',
    '<svg><image href="https://externo.example/logo.png"/></svg>',
    '<svg><style>@import "https://externo.example/estilo.css";</style></svg>',
    '<svg><image href="data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;"/></svg>',
]) {
    test(`rechaza contenido SVG activo: ${contenido.slice(0, 24)}`, () => {
        assert.throws(
            () => validarLogoSvg(archivoPrincipal({ buffer: Buffer.from(contenido) })),
            /SVG no permitido/,
        );
    });
}

test("guarda el logo con la extensión correcta según el tipo", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));

    // Test SVG
    const rutaSvg = await guardarLogoAtomico({
        tipo: "principal",
        mimetype: "image/svg+xml",
        buffer: svgSeguro,
        baseDir: dir,
    });
    assert.equal(rutaSvg, path.join(dir, "Logo_MDUnion.svg"));

    // Test PNG
    const pngBuffer = Buffer.alloc(100);
    const rutaPng = await guardarLogoAtomico({
        tipo: "principal",
        mimetype: "image/png",
        buffer: pngBuffer,
        baseDir: dir,
    });
    assert.equal(rutaPng, path.join(dir, "Logo_MDUnion.png"));

    // Test JPEG
    const jpegBuffer = Buffer.alloc(100);
    const rutaJpeg = await guardarLogoAtomico({
        tipo: "principal",
        mimetype: "image/jpeg",
        buffer: jpegBuffer,
        baseDir: dir,
    });
    assert.equal(rutaJpeg, path.join(dir, "Logo_MDUnion.jpg"));
});

test("un reemplazo inválido conserva el archivo anterior", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));
    const vigente = path.join(dir, "Logo_MDUnion.svg");
    await writeFile(vigente, "<svg id='anterior'/>");

    await assert.rejects(
        guardarLogoAtomico({
            tipo: "principal",
            mimetype: "image/svg+xml",
            buffer: Buffer.alloc(0),
            baseDir: dir,
        }),
        /vacío/,
    );

    assert.equal(await readFile(vigente, "utf8"), "<svg id='anterior'/>");
});
