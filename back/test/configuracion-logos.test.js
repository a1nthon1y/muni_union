import test from "node:test";
import assert from "node:assert/strict";
import {
    crearConfiguracionLogosService,
} from "../src/services/configuracion.service.js";

const svgSeguro = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');

const crearDb = (rows = []) => {
    const consultas = [];
    return {
        consultas,
        async query(sql, params) {
            consultas.push({ sql, params });
            return { rows };
        },
    };
};

test("la configuración devuelve únicamente los dos logos canónicos", async () => {
    const db = crearDb([
        {
            clave: "logo_principal",
            valor: "/Logo_MDUnion.svg",
            fecha_modificacion: "2026-07-26T20:00:00-05:00",
        },
        {
            clave: "logo_blanco",
            valor: "/Logo_blanco.svg",
            fecha_modificacion: null,
        },
    ]);
    const service = crearConfiguracionLogosService({
        db,
        archivoExiste: async (ruta) => ruta.endsWith("Logo_MDUnion.svg"),
        baseDir: "/tmp/logos",
    });

    const resultado = await service.obtenerConfiguracionLogos();

    assert.deepEqual(Object.keys(resultado).sort(), ["blanco", "principal"]);
    assert.deepEqual(resultado.principal, {
        tipo: "principal",
        nombre: "Logo_MDUnion.svg",
        ruta: "/Logo_MDUnion.svg",
        personalizado: true,
        fecha_modificacion: "2026-07-26T20:00:00-05:00",
    });
    assert.equal(resultado.blanco.personalizado, false);
    assert.match(db.consultas[0].sql, /logo_principal/);
    assert.doesNotMatch(db.consultas[0].sql, /url_verificacion_publica/);
});

test("actualizar un logo conserva la ruta canónica y registra su fecha", async () => {
    const fecha = "2026-07-26T21:00:00-05:00";
    const db = crearDb([{ fecha_modificacion: fecha }]);
    const guardados = [];
    const service = crearConfiguracionLogosService({
        db,
        guardarLogo: async (archivo) => guardados.push(archivo),
        baseDir: "/tmp/logos",
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
    assert.equal(resultado.fecha_modificacion, fecha);
    assert.equal(guardados[0].tipo, "blanco");
    assert.deepEqual(db.consultas[0].params.slice(0, 2), [
        "logo_blanco",
        "/Logo_blanco.svg",
    ]);
});

test("no actualiza metadatos cuando falla el almacenamiento", async () => {
    const db = crearDb();
    const service = crearConfiguracionLogosService({
        db,
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
    assert.equal(db.consultas.length, 0);
});
