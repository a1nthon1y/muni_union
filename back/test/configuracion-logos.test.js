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
    assert.equal(resultado.principal.ruta, "/Logo_MDUnion.svg");
    assert.equal(resultado.principal.personalizado, true);
    assert.ok(resultado.principal.fecha_modificacion);
    assert.equal(resultado.blanco.personalizado, false);
    assert.equal(resultado.blanco.fecha_modificacion, null);
});

test("actualizar un logo conserva la ruta canónica y registra su fecha", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));
    const guardados = [];
    const service = crearConfiguracionLogosService({
        guardarLogo: async (archivo) => {
            guardados.push(archivo);
            const destino = path.join(dir, "Logo_blanco.svg");
            await writeFile(destino, svgSeguro);
            return destino;
        },
        baseDir: dir,
    });

    const resultado = await service.actualizarLogo({
        tipo: "blanco",
        file: {
            originalname: "Logo_blanco.svg",
            mimetype: "image/svg+xml",
            buffer: svgSeguro,
        },
    });

    assert.equal(resultado.ruta, "/Logo_blanco.svg");
    assert.equal(resultado.nombre, "Logo_blanco.svg");
    assert.equal(resultado.personalizado, true);
    assert.ok(resultado.fecha_modificacion);
    assert.equal(guardados[0].tipo, "blanco");
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
                originalname: "Logo_MDUnion.svg",
                mimetype: "image/svg+xml",
                buffer: svgSeguro,
            },
        }),
        /NFS no disponible/,
    );
});
