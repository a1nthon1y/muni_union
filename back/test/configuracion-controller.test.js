import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
    crearConfiguracionController,
} from "../src/controllers/configuracion.controller.js";

const crearResponse = () => {
    const response = {
        statusCode: 200,
        headers: {},
        body: undefined,
        sentFile: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        set(headers) {
            Object.assign(this.headers, headers);
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
        sendFile(file) {
            this.sentFile = file;
            return this;
        },
    };
    return response;
};

test("GET de configuración responde con ambos logos", async () => {
    const controller = crearConfiguracionController({
        getLogos: async () => ({ principal: {}, blanco: {} }),
    });
    const res = crearResponse();

    await controller.getLogos({}, res);

    assert.deepEqual(res.body, { principal: {}, blanco: {} });
});

test("PUT rechaza una carga sin archivo", async () => {
    const controller = crearConfiguracionController({
        updateLogo: async () => {
            throw new Error("No debe ejecutarse");
        },
    });
    const res = crearResponse();

    await controller.putLogo({ params: { tipo: "principal" } }, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /válido/);
});

test("la ruta pública entrega el archivo personalizado sin caché", async () => {
    const controller = crearConfiguracionController({
        accessFile: async () => {},
        logosDir: "/tmp/logos",
    });
    const res = crearResponse();

    await controller.serveLogo({ path: "/uploads/configuracion/logos/Logo_blanco.svg" }, res);

    assert.equal(res.sentFile, path.join("/tmp/logos", "Logo_blanco.png"));
    assert.equal(res.headers["Content-Type"], "image/png");
    assert.equal(res.headers["Cache-Control"], "no-store, max-age=0");
    assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
});

test("la ruta pública responde 404 cuando no existe versión personalizada", async () => {
    const controller = crearConfiguracionController({
        accessFile: async () => {
            const error = new Error("No existe");
            error.code = "ENOENT";
            throw error;
        },
        logosDir: "/tmp/logos",
    });
    const res = crearResponse();

    await controller.serveLogo({ path: "/uploads/configuracion/logos/Logo_MDUnion.svg" }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Logo personalizado no disponible");
});
