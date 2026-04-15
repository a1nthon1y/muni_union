-- ─────────────────────────────────────────────────────────────────────────────
-- Migración 004: Permisos de modificación por módulo
-- Se añaden columnas a usuario_permisos con DEFAULT TRUE para que los usuarios
-- existentes mantengan su capacidad de edición actual (retrocompatible).
-- Los nuevos usuarios recibirán el valor que el admin configure en el formulario.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE usuario_permisos
    ADD COLUMN IF NOT EXISTS actas_modificar    BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS personas_modificar BOOLEAN NOT NULL DEFAULT TRUE;
