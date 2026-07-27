import test from "node:test";
import assert from "node:assert/strict";
import {
    actualizarPersona,
    crearPersona,
} from "../src/services/personas.service.js";

const datosMinimos = Object.freeze({
    tipo_documento: "DNI",
    dni: "12345678",
    nombres: "ANA",
    apellido_paterno: "QUISPE",
    apellido_materno: "ROJAS",
    sexo: "F",
});

const crearDbPersona = (inicial = null) => {
    let persona = inicial ? { ...inicial } : null;
    const consultas = [];

    return {
        consultas,
        get persona() {
            return persona;
        },
        async query(sql, params = []) {
            consultas.push({ sql, params });

            if (/SELECT id FROM tipos_documento/.test(sql)) {
                return { rows: [{ id: 1 }] };
            }

            if (/INSERT INTO personas/.test(sql)) {
                persona = {
                    id: 99,
                    tipo_documento_id: params[1],
                    dni: params[0],
                    nombres: params[2],
                    apellido_paterno: params[3],
                    apellido_materno: params[4],
                    sexo: params[5],
                    fecha_nacimiento: params[6],
                    fecha_fallecimiento: params[7],
                    telefono: params[8],
                    direccion: params[9],
                    observaciones: params[10],
                };
                return { rows: [{ id: persona.id }] };
            }

            if (/UPDATE personas SET/.test(sql)) {
                persona = {
                    ...persona,
                    fecha_nacimiento: params[6],
                    fecha_fallecimiento: params[7],
                };
                return { rows: [], rowCount: 1 };
            }

            if (/FROM personas p/.test(sql)) {
                return { rows: persona ? [{ ...persona, tipo_documento: "DNI" }] : [] };
            }

            throw new Error(`Consulta no esperada: ${sql}`);
        },
    };
};

test("INSERT funciona cuando fecha_fallecimiento está omitida", async () => {
    const db = crearDbPersona();

    const creada = await crearPersona(datosMinimos, 7, db);

    assert.equal(creada.id, 99);
    assert.equal(creada.fecha_fallecimiento, null);
    const insert = db.consultas.find(({ sql }) => /INSERT INTO personas/.test(sql));
    assert.equal(insert.params[7], null);
});

test("INSERT acepta una fecha de fallecimiento válida", async () => {
    const db = crearDbPersona();

    const creada = await crearPersona({
        ...datosMinimos,
        fecha_nacimiento: "1950-01-01",
        fecha_fallecimiento: "2020-04-03",
    }, 7, db);

    assert.equal(creada.fecha_fallecimiento, "2020-04-03");
});

test("UPDATE conserva fecha omitida y elimina null explícito", async () => {
    const db = crearDbPersona({
        id: 31,
        tipo_documento_id: 1,
        dni: "12345678",
        nombres: "ANA",
        apellido_paterno: "QUISPE",
        apellido_materno: "ROJAS",
        sexo: "F",
        fecha_nacimiento: "1950-01-01",
        fecha_fallecimiento: "2020-04-03",
    });

    const conservada = await actualizarPersona(31, datosMinimos, db);
    assert.equal(conservada.fecha_fallecimiento, "2020-04-03");

    const eliminada = await actualizarPersona(31, {
        ...datosMinimos,
        fecha_fallecimiento: null,
    }, db);
    assert.equal(eliminada.fecha_fallecimiento, null);
});
