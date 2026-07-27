import test from "node:test";
import assert from "node:assert/strict";
import {
    FechaPersonaValidationError,
    resolverFechasPersona,
} from "../src/services/persona-fechas.service.js";

test("permite insertar sin fecha de fallecimiento", () => {
    assert.deepEqual(
        resolverFechasPersona(null, {
            fecha_nacimiento: "1990-01-01",
        }),
        {
            fecha_nacimiento: "1990-01-01",
            fecha_fallecimiento: null,
        },
    );
});

test("permite insertar sin ninguna fecha", () => {
    assert.deepEqual(resolverFechasPersona(null, {}), {
        fecha_nacimiento: null,
        fecha_fallecimiento: null,
    });
});

test("conserva una fecha omitida al actualizar", () => {
    assert.deepEqual(
        resolverFechasPersona(
            {
                fecha_nacimiento: "1990-01-01",
                fecha_fallecimiento: "2020-01-01",
            },
            { nombres: "ANA" },
        ),
        {
            fecha_nacimiento: "1990-01-01",
            fecha_fallecimiento: "2020-01-01",
        },
    );
});

test("permite eliminar fecha de fallecimiento con null explícito", () => {
    assert.deepEqual(
        resolverFechasPersona(
            {
                fecha_nacimiento: "1990-01-01",
                fecha_fallecimiento: "2020-01-01",
            },
            { fecha_fallecimiento: null },
        ),
        {
            fecha_nacimiento: "1990-01-01",
            fecha_fallecimiento: null,
        },
    );
});

test("rechaza fecha de fallecimiento anterior al nacimiento", () => {
    assert.throws(
        () => resolverFechasPersona(null, {
            fecha_nacimiento: "2000-01-01",
            fecha_fallecimiento: "1999-12-31",
        }),
        (error) => (
            error instanceof FechaPersonaValidationError
            && /no puede ser anterior/.test(error.message)
        ),
    );
});

test("rechaza una fecha con formato o calendario inválido", () => {
    assert.throws(
        () => resolverFechasPersona(null, {
            fecha_fallecimiento: "2026-02-31",
        }),
        /fecha de fallecimiento no es válida/i,
    );
});
