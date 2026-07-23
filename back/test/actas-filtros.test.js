import test from "node:test";
import assert from "node:assert/strict";
import { construirFiltrosActas } from "../src/services/actas-filtros.js";

test("un código de acta completo usa coincidencia exacta", () => {
    const { clausulas, params } = construirFiltrosActas({ numero: " nac-l1-1 " });

    assert.deepEqual(params, ["NAC-L1-1"]);
    assert.deepEqual(clausulas, ["UPPER(a.numero_acta) = $1"]);
});

test("un folio numérico compara el folio completo, no una coincidencia parcial", () => {
    const { clausulas, params } = construirFiltrosActas({ numero: "1" });

    assert.deepEqual(params, ["1"]);
    assert.deepEqual(clausulas, [
        "(split_part(a.numero_acta, '-', 3) = $1 OR a.numero_acta = $1)",
    ]);
});

test("el filtro libro compara exactamente el segmento L del código", () => {
    const { clausulas, params } = construirFiltrosActas({ libro: "2" });

    assert.deepEqual(params, ["L2"]);
    assert.deepEqual(clausulas, ["split_part(a.numero_acta, '-', 2) = $1"]);
});
