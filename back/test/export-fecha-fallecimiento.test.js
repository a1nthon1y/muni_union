import test from "node:test";
import assert from "node:assert/strict";
import {
    mapearActaExcel,
    mapearPersonaExcel,
} from "../src/services/export.service.js";

test("Excel de Personas deja vacío un fallecimiento omitido", () => {
    const fila = mapearPersonaExcel({
        id: 1,
        dni: "12345678",
        nombres: "ANA",
        apellido_paterno: "QUISPE",
        apellido_materno: "ROJAS",
        sexo: "F",
        fecha_nacimiento: "1950-01-02",
        fecha_fallecimiento: null,
    });

    assert.equal(fila["Fecha Nac."], "02/01/1950");
    assert.equal(fila["Fecha Fallecimiento"], "");
});

test("Excel de Personas exporta fecha de fallecimiento sin desfase", () => {
    const fila = mapearPersonaExcel({
        id: 1,
        nombres: "ANA",
        apellido_paterno: "QUISPE",
        apellido_materno: "ROJAS",
        sexo: "F",
        fecha_fallecimiento: "2020-04-03T00:00:00.000Z",
    });

    assert.equal(fila["Fecha Fallecimiento"], "03/04/2020");
});

test("Excel de Actas incluye fechas del titular", () => {
    const fila = mapearActaExcel({
        id: 5,
        tipo_acta: "DEFUNCION",
        numero_acta: "DEF-0001",
        anio: 2020,
        nombres: "ANA",
        apellido_paterno: "QUISPE",
        apellido_materno: "ROJAS",
        fecha_nacimiento: "1950-01-02",
        fecha_fallecimiento: "2020-04-03",
        fecha_acta: "2020-04-03",
        fecha_registro: "2020-04-03T12:00:00-05:00",
    });

    assert.equal(fila["Fecha Nac. Titular"], "02/01/1950");
    assert.equal(fila["Fecha Fallecimiento Titular"], "03/04/2020");
});

test("Excel de matrimonios incluye fechas del cónyuge", () => {
    const fila = mapearActaExcel({
        id: 6,
        tipo_acta: "MATRIMONIO",
        numero_acta: "MAT-L1-1",
        anio: 2000,
        nombres: "ANA",
        apellido_paterno: "QUISPE",
        apellido_materno: "ROJAS",
        p2_nombres: "LUIS",
        p2_apellido_paterno: "PEREZ",
        p2_apellido_materno: "SOTO",
        p2_fecha_nacimiento: "1948-05-06",
        p2_fecha_fallecimiento: "2021-07-08",
        fecha_acta: "2000-01-01",
        fecha_registro: "2000-01-01T12:00:00-05:00",
    });

    assert.equal(fila["Fecha Nac. Cónyuge"], "06/05/1948");
    assert.equal(fila["Fecha Fallecimiento Cónyuge"], "08/07/2021");
});
