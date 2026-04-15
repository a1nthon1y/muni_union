-- ─────────────────────────────────────────────────────────────────────────────
-- Migración 003: Permisos granulares por módulo para usuarios REGISTRADOR
-- Ejecutar una sola vez en la BD (Neon o on-premise).
-- Es idempotente (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuario_permisos (
    usuario_id        INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    actas_anular      BOOLEAN NOT NULL DEFAULT FALSE,
    actas_eliminar    BOOLEAN NOT NULL DEFAULT FALSE,
    personas_eliminar BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear fila de permisos para todos los usuarios existentes que aún no tengan una
INSERT INTO usuario_permisos (usuario_id)
SELECT id FROM usuarios
WHERE fecha_eliminacion IS NULL
ON CONFLICT (usuario_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_usuario_permisos_usuario
    ON usuario_permisos (usuario_id);
