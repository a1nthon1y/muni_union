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
    originalname: "Logo_MDUnion.svg",
    mimetype: "image/svg+xml",
    buffer: svgSeguro,
    ...overrides,
});

test("acepta el SVG principal con nombre canónico", () => {
    assert.doesNotThrow(() => validarLogoSvg(archivoPrincipal()));
});

test("acepta el SVG blanco con su nombre canónico", () => {
    assert.doesNotThrow(() => validarLogoSvg({
        tipo: "blanco",
        originalname: "Logo_blanco.svg",
        mimetype: "image/svg+xml",
        buffer: svgSeguro,
    }));
});

test("rechaza un nombre distinto del canónico", () => {
    assert.throws(
        () => validarLogoSvg(archivoPrincipal({ originalname: "otro.svg" })),
        /Logo_MDUnion\.svg/,
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

test("guarda el logo usando el nombre canónico", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));

    const ruta = await guardarLogoAtomico({
        ...archivoPrincipal(),
        baseDir: dir,
    });

    assert.equal(ruta, path.join(dir, "Logo_MDUnion.svg"));
    assert.deepEqual(await readFile(ruta), svgSeguro);
    assert.equal(obtenerRutaLogo("principal", dir), ruta);
});

test("un reemplazo inválido conserva el archivo anterior", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));
    const vigente = path.join(dir, "Logo_MDUnion.svg");
    await writeFile(vigente, "<svg id='anterior'/>");

    await assert.rejects(
        guardarLogoAtomico({
            ...archivoPrincipal({ buffer: Buffer.alloc(0) }),
            baseDir: dir,
        }),
        /vacío/,
    );

    assert.equal(await readFile(vigente, "utf8"), "<svg id='anterior'/>");
});
