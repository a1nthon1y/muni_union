import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
    crearConfiguracionLogosService,
} from "../src/services/configuracion.service.js";

const svgSeguro = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');

test("la configuración devuelve únicamente los dos logos canónicos", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));
    await writeFile(path.join(dir, "Logo_MDUnion.svg"), svgSeguro);
    const service = crearConfiguracionLogosService({ baseDir: dir });

    const resultado = await service.obtenerConfiguracionLogos();

    assert.deepEqual(Object.keys(resultado).sort(), ["blanco", "principal"]);
    assert.equal(resultado.principal.nombre, "Logo_MDUnion.svg");
    assert.equal(resultado.principal.ruta, "/uploads/configuracion/logos/Logo_MDUnion.svg");
    // SVG se considera predeterminado (del sistema), no personalizado
    assert.equal(resultado.principal.personalizado, false);
    assert.equal(resultado.blanco.personalizado, false);
    assert.equal(resultado.blanco.fecha_modificacion, null);
});

test("la configuración detecta logos en diferentes formatos", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));
    await writeFile(path.join(dir, "Logo_MDUnion.png"), Buffer.alloc(100));
    await writeFile(path.join(dir, "Logo_blanco.jpg"), Buffer.alloc(100));
    const service = crearConfiguracionLogosService({ baseDir: dir });

    const resultado = await service.obtenerConfiguracionLogos();

    assert.equal(resultado.principal.nombre, "Logo_MDUnion.png");
    assert.equal(resultado.principal.ruta, "/uploads/configuracion/logos/Logo_MDUnion.png");
    assert.equal(resultado.principal.personalizado, true);
    assert.equal(resultado.blanco.nombre, "Logo_blanco.jpg");
    assert.equal(resultado.blanco.ruta, "/uploads/configuracion/logos/Logo_blanco.jpg");
    assert.equal(resultado.blanco.personalizado, true);
});

test("actualizar un logo con diferentes formatos", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));
    
    // Test con PNG
    const pngBuffer = Buffer.alloc(100);
    const pngService = crearConfiguracionLogosService({
        guardarLogo: async (archivo) => {
            const destino = path.join(dir, "Logo_blanco.png");
            await writeFile(destino, pngBuffer);
            return destino;
        },
        baseDir: dir,
    });

    const resultadoPng = await pngService.actualizarLogo({
        tipo: "blanco",
        file: {
            mimetype: "image/png",
            buffer: pngBuffer,
        },
    });

    assert.equal(resultadoPng.tipo, "blanco");
    assert.equal(resultadoPng.personalizado, true);
    assert.ok(resultadoPng.fecha_modificacion);
    
    // Test con JPEG
    const jpegBuffer = Buffer.alloc(100);
    const jpegService = crearConfiguracionLogosService({
        guardarLogo: async (archivo) => {
            const destino = path.join(dir, "Logo_blanco.jpg");
            await writeFile(destino, jpegBuffer);
            return destino;
        },
        baseDir: dir,
    });

    const resultadoJpeg = await jpegService.actualizarLogo({
        tipo: "blanco",
        file: {
            mimetype: "image/jpeg",
            buffer: jpegBuffer,
        },
    });

    assert.equal(resultadoJpeg.tipo, "blanco");
    assert.equal(resultadoJpeg.personalizado, true);
    assert.ok(resultadoJpeg.fecha_modificacion);
});

test("no actualiza metadatos cuando falla el almacenamiento", async () => {
    const service = crearConfiguracionLogosService({
        guardarLogo: async () => {
            throw new Error("NFS no disponible");
        },
        baseDir: "/tmp/logos",
    });

    await assert.rejects(
        service.actualizarLogo({
            tipo: "principal",
            file: {
                mimetype: "image/svg+xml",
                buffer: svgSeguro,
            },
        }),
        /NFS no disponible/,
    );
});
