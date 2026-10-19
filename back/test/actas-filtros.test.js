import test from "node:test";
import assert from "node:assert/strict";
import { construirFiltrosActas } from "../src/services/actas-filtros.js";

test("un código de acta completo incluye el código exacto y sus sufijos derivados", () => {
    const { clausulas, params } = construirFiltrosActas({ numero: " nac-l1-1 " });

    assert.deepEqual(params, ["NAC-L1-1", "NAC-L1-1-%"]);
    assert.deepEqual(clausulas, ["(UPPER(a.numero_acta) = $1 OR UPPER(a.numero_acta) LIKE $2)"]);
});

test("un folio numérico compara el folio y sus derivados con sufijo", () => {
    const { clausulas, params } = construirFiltrosActas({ numero: "1" });

    assert.deepEqual(params, ["1", "1-%"]);
    assert.deepEqual(clausulas, [
        "(split_part(a.numero_acta, '-', 3) = $1 OR split_part(a.numero_acta, '-', 3) LIKE $2 OR a.numero_acta = $1)",
    ]);
});

test("un folio con sufijo como 154-A busca por coincidencia exacta o sufijo", () => {
    const { clausulas, params } = construirFiltrosActas({ numero: "154-A" });

    assert.deepEqual(params, ["%-154-A", "154-A"]);
    assert.deepEqual(clausulas, [
        "(UPPER(a.numero_acta) LIKE $1 OR UPPER(a.numero_acta) = $2)",
    ]);
});

test("el filtro libro compara el segmento L del código de forma normalizada", () => {
    const { clausulas, params } = construirFiltrosActas({ libro: "2" });

    assert.deepEqual(params, ["L2", "2"]);
    assert.match(clausulas[0], /split_part\(a\.numero_acta, '-', 2\)/);
});

test("cada palabra del ciudadano se busca de forma independiente", () => {
    const { clausulas, params } = construirFiltrosActas({
        q: "  QUISPE   RAMOS juan ",
    });

    assert.deepEqual(params, ["%QUISPE%", "%RAMOS%", "%juan%"]);
    assert.equal(clausulas.length, 3);
    assert.match(clausulas[0], /p\.apellido_paterno/);
    assert.match(clausulas[0], /p2\.apellido_paterno/);
});

test("persona_id incluye titular y cónyuge por ID exacto", () => {
    const { clausulas, params } = construirFiltrosActas({ persona_id: "42" });

    assert.deepEqual(params, [42]);
    assert.deepEqual(clausulas, [
        "(a.persona_principal_id = $1 OR a.persona_secundaria_id = $1)",
    ]);
});

test("persona_id inválido no agrega un filtro", () => {
    const { clausulas, params } = construirFiltrosActas({ persona_id: "abc" });

    assert.deepEqual({ clausulas, params }, { clausulas: [], params: [] });
});
