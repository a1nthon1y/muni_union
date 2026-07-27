-- =============================================================================
-- Script 008: Fecha de fallecimiento opcional para personas
-- Idempotente para instalaciones existentes
-- =============================================================================

ALTER TABLE personas
ADD COLUMN IF NOT EXISTS fecha_fallecimiento DATE;
