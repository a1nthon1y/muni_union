import test from "node:test";
import assert from "node:assert/strict";
import { normalizarColumnasImportacion } from "../src/services/importacion-columns.js";
import { importarActasMasivo } from "../src/services/importacion.service.js";

test("fecha_defuncion se mapea a fecha_fallecimiento", () => {
    const fila = normalizarColumnasImportacion({
        fecha_defuncion: "2020-04-03",
        nombres: "ANA",
    });
    assert.equal(fila.fecha_fallecimiento, "2020-04-03");
    assert.equal(fila.fecha_defuncion, "2020-04-03");
});

test("fecha_fallecimiento canónica tiene prioridad sobre alias", () => {
    const fila = normalizarColumnasImportacion({
        fecha_defuncion: "2020-01-01",
        fecha_fallecimiento: "2020-04-03",
    });
    assert.equal(fila.fecha_fallecimiento, "2020-04-03");
});

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
                return { rows: [{ id: 99, tiene_documento: true }] };
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

test("acta duplicada conserva actualización de persona (backfill fechas)", async () => {
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
            fecha_defuncion: "2020-04-03",
            tipo_acta: "DEFUNCION",
            fecha_acta: "2020-04-03",
            cui: "DEF-0001",
        },
    ], {}, {}, 7, db);

    assert.equal(resultado[0].estado, "OMITIDO");
    const actualizacion = db.client.consultas.find(
        ({ sql }) => /UPDATE personas SET/.test(sql),
    );
    assert.ok(actualizacion, "Debe actualizar persona aunque el acta ya exista");
    assert.equal(actualizacion.params[2], "2020-04-03");
    assert.equal(
        db.client.consultas.some(({ sql }) => sql === "COMMIT"),
        true,
        "Debe confirmar la transacción",
    );
    assert.equal(
        db.client.consultas.some(({ sql }) => sql === "ROLLBACK"),
        false,
        "No debe deshacer la actualización de persona",
    );
});
