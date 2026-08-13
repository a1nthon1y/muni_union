-- =============================================================================
-- SISTEMA DE REGISTRO CIVIL — MUNICIPALIDAD DISTRITAL DE LA UNIÓN
-- Script 009: Campo es_homonimo para personas
-- Versión: 1.0.0
-- Descripción: Agrega columna booleana para marcar homónimos intencionales
--              (ciudadanos con mismo nombre pero DNI diferente, confirmados por oficial)
-- =============================================================================

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS es_homonimo BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice parcial para consultar homónimos rápido
CREATE INDEX IF NOT EXISTS idx_personas_es_homonimo ON personas(es_homonimo) WHERE es_homonimo = TRUE;

-- Comentario para documentación
COMMENT ON COLUMN personas.es_homonimo IS 'TRUE = Oficial confirmó que es persona diferente con mismo nombre (homónimo legítimo). FALSE = Registro normal.';