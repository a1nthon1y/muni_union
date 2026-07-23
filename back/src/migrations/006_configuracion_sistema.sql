-- =============================================================================
-- Script 006: Configuración del sistema (dominio / URL pública de verificación)
-- =============================================================================

CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave              VARCHAR(100) PRIMARY KEY,
    valor              TEXT         NOT NULL,
    descripcion        TEXT,
    fecha_registro     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ
);

INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
    'url_verificacion_publica',
    'https://172.16.3.21',
    'URL base impresa en constancias para verificación pública. Puede ser la IP interna o un dominio público (sin barra final).'
)
ON CONFLICT (clave) DO NOTHING;
