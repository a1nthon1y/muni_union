-- =============================================================================
-- Script 007: Sustituir configuración heredada de URL por identidad visual
-- Idempotente para instalaciones existentes
-- =============================================================================

CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave              VARCHAR(100) PRIMARY KEY,
    valor              TEXT         NOT NULL,
    descripcion        TEXT,
    fecha_registro     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ
);

DELETE FROM configuracion_sistema
WHERE clave = 'url_verificacion_publica';

INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES
    (
        'logo_principal',
        '/Logo_MDUnion.svg',
        'Ruta canónica del logo principal institucional.'
    ),
    (
        'logo_blanco',
        '/Logo_blanco.svg',
        'Ruta canónica del logo blanco institucional.'
    )
ON CONFLICT (clave) DO UPDATE
SET valor = EXCLUDED.valor,
    descripcion = EXCLUDED.descripcion;
