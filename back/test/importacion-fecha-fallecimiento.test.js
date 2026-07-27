import test from "node:test";
import assert from "node:assert/strict";
import { importarActasMasivo } from "../src/services/importacion.service.js";

const crearDbImportacion = () => {
    const consultas = [];
    const client = {
        consultas,
        async query(sql, params = []) {
            consultas.push({ sql, params });

            if (/SELECT id, UPPER\(nombre\)/.test(sql)) {
                return { rows: [{ id: 1, nombre: "DNI" }] };
            }
            if (/FROM personas\s+WHERE dni/.test(sql)) {
                return {
                    rows: [{
                        id: 31,
                        dni: "12345678",
                        tipo_documento_id: 1,
                        fecha_nacimiento: "1950-01-01",
                        fecha_fallecimiento: null,
                    }],
                };
            }
            if (/UPDATE personas SET/.test(sql)) {
                return { rows: [], rowCount: 1 };
            }
            if (/SELECT a\.id/.test(sql)) {
                return { rows: [] };
            }
            if (/INSERT INTO actas/.test(sql)) {
                return { rows: [{ id: 88 }] };
            }
            if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) {
                return { rows: [] };
            }

            throw new Error(`Consulta no esperada: ${sql}`);
        },
        release() {},
    };

    return {
        client,
        async connect() {
            return client;
        },
    };
};

test("DNI actualiza fecha de fallecimiento durante importación", async () => {
    const db = crearDbImportacion();

    const resultado = await importarActasMasivo([
        {
            dni: "12345678",
            tipo_documento: "DNI",
            nombres: "ANA",
            apellido_paterno: "QUISPE",
            apellido_materno: "ROJAS",
            sexo: "F",
            fecha_nacimiento: "1950-01-01",
            fecha_fallecimiento: "2020-04-03",
            tipo_acta: "DEFUNCION",
            fecha_acta: "2020-04-03",
            cui: "DEF-0001",
        },
    ], {}, {}, 7, db);

    assert.equal(resultado[0].estado, "OK");
    const actualizacion = db.client.consultas.find(
        ({ sql }) => /UPDATE personas SET/.test(sql),
    );
    assert.ok(actualizacion, "Debe actualizar a la persona encontrada por DNI");
    assert.equal(actualizacion.params[2], "2020-04-03");
    assert.equal(actualizacion.params.at(-1), 31);
});

test("fecha importada inválida genera ERROR sin insertar", async () => {
    const db = crearDbImportacion();

    const resultado = await importarActasMasivo([
        {
            dni: "12345678",
            nombres: "ANA",
            apellido_paterno: "QUISPE",
            apellido_materno: "ROJAS",
            tipo_acta: "DEFUNCION",
            fecha_acta: "2020-04-03",
            fecha_fallecimiento: "fecha desconocida",
            cui: "DEF-0002",
        },
    ], {}, {}, 7, db);

    assert.equal(resultado[0].estado, "ERROR");
    assert.match(resultado[0].error, /fecha_fallecimiento inválida/i);
    assert.equal(
        db.client.consultas.some(({ sql }) => /INSERT INTO actas/.test(sql)),
        false,
    );
});
