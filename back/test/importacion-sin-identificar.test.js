import test from "node:test";
import assert from "node:assert/strict";
import {
    debeOmitirBusquedaPorNombre,
    esSinApellido,
    esSinNombre,
} from "../src/services/importacion-persona-identidad.js";
import { importarActasMasivo } from "../src/services/importacion.service.js";

test("detecta placeholders S/N y S/A", () => {
    assert.equal(esSinNombre("s/n"), true);
    assert.equal(esSinApellido("S/A"), true);
    assert.equal(esSinNombre("JUAN"), false);
});

test("debeOmitirBusquedaPorNombre cuando no hay DNI y los nombres no identifican", () => {
    assert.equal(
        debeOmitirBusquedaPorNombre("S/N", "S/A", "S/A", null),
        true,
    );
    assert.equal(
        debeOmitirBusquedaPorNombre("S/N", "GARCIA", "LOPEZ", null),
        true,
    );
    assert.equal(
        debeOmitirBusquedaPorNombre("MARIA", "S/A", "S/A", null),
        true,
    );
    assert.equal(
        debeOmitirBusquedaPorNombre("MARIA", "GARCIA", "S/A", null),
        false,
    );
    assert.equal(
        debeOmitirBusquedaPorNombre("S/N", "S/A", "S/A", "12345678"),
        false,
    );
});

const crearDbSinIdentificar = () => {
    const consultas = [];
    let personaInsertCount = 0;

    const client = {
        consultas,
        async query(sql, params = []) {
            consultas.push({ sql, params });

            if (/SELECT id, UPPER\(nombre\)/.test(sql)) {
                return { rows: [{ id: 1, nombre: "DNI" }] };
            }
            if (/FROM actas a/.test(sql)) {
                return { rows: [] };
            }
            if (/FROM personas\s+WHERE UPPER\(nombres\)/.test(sql)) {
                throw new Error("No debe buscar persona por nombre sin identificar");
            }
            if (/INSERT INTO personas/.test(sql)) {
                personaInsertCount += 1;
                return { rows: [{ id: 1000 + personaInsertCount }] };
            }
            if (/INSERT INTO actas/.test(sql)) {
                return { rows: [{ id: 2000 + personaInsertCount }] };
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
        get personaInsertCount() {
            return personaInsertCount;
        },
        async connect() {
            return client;
        },
    };
};

test("importación crea una persona distinta por cada acta S/N S/A S/A sin DNI", async () => {
    const db = crearDbSinIdentificar();
    const filaBase = {
        nombres: "S/N",
        apellido_paterno: "S/A",
        apellido_materno: "S/A",
        sexo: "M",
        tipo_acta: "DEFUNCION",
        fecha_acta: "1963-03-15",
        fecha_fallecimiento: "1963-03-10",
        anio: 1963,
        libro: 9,
    };

    const resultado = await importarActasMasivo([
        { ...filaBase, numero_acta: 16 },
        { ...filaBase, numero_acta: 19, fecha_fallecimiento: "1963-04-01" },
    ], {}, {}, 7, db);

    assert.deepEqual(
        resultado.map((r) => r.estado),
        ["OK", "OK"],
    );
    assert.equal(db.personaInsertCount, 2);
});

test("reimportación usa persona del acta existente sin actualizar fechas", async () => {
    const consultas = [];
    const client = {
        consultas,
        async query(sql, params = []) {
            consultas.push({ sql, params });

            if (/SELECT id, UPPER\(nombre\)/.test(sql)) {
                return { rows: [{ id: 1, nombre: "DNI" }] };
            }
            if (/FROM actas a/.test(sql)) {
                return {
                    rows: [{
                        id: 501,
                        persona_principal_id: 13861,
                        tiene_documento: true,
                    }],
                };
            }
            if (/FROM personas\s+WHERE id = \$1/.test(sql)) {
                return {
                    rows: [{
                        id: 13861,
                        dni: null,
                        tipo_documento_id: 1,
                        fecha_nacimiento: null,
                        fecha_fallecimiento: null,
                    }],
                };
            }
            if (/FROM personas\s+WHERE UPPER\(nombres\)/.test(sql)) {
                throw new Error("No debe buscar por nombre si el acta ya existe");
            }
            if (/UPDATE personas SET/.test(sql)) {
                return { rows: [], rowCount: 1 };
            }
            if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) {
                return { rows: [] };
            }

            throw new Error(`Consulta no esperada: ${sql}`);
        },
        release() {},
    };

    const db = {
        async connect() {
            return client;
        },
    };

    const resultado = await importarActasMasivo([
        {
            nombres: "S/N",
            apellido_paterno: "S/A",
            apellido_materno: "S/A",
            sexo: "M",
            tipo_acta: "DEFUNCION",
            fecha_acta: "1963-03-15",
            fecha_fallecimiento: "1963-03-10",
            anio: 1963,
            libro: 9,
            numero_acta: 16,
        },
    ], {}, {}, 7, db);

    assert.equal(resultado[0].estado, "OMITIDO");
    assert.equal(
        consultas.some(({ sql }) => /UPDATE personas SET/.test(sql)),
        false,
        "Reimportación no debe modificar fechas de la persona existente",
    );
});
