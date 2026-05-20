-- Tabla para persistir refresh tokens (permite invalidación server-side)
-- Ejecutar en la BD de producción antes de desplegar.

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,  -- SHA-256 hex del token JWT
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rt_usuario  ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rt_expires  ON refresh_tokens(expires_at);
