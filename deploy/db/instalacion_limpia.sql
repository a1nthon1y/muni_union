-- ═══════════════════════════════════════════════════════════════════
--  INSTALACIÓN LIMPIA — Sistema de Registro Civil
--  Municipalidad Distrital La Unión
--
--  Este script crea toda la estructura + datos mínimos del sistema:
--    ✔ Todas las tablas y relaciones
--    ✔ Extensiones necesarias (pg_trgm)
--    ✔ Índices de rendimiento
--    ✔ Roles del sistema (ADMIN, USER)
--    ✔ Tipos de documento
--    ✔ UN SOLO usuario administrador (contraseña inicial: 123456)
--
--  NO incluye:
--    ✘ Personas registradas en desarrollo
--    ✘ Actas de prueba
--    ✘ Solicitudes de prueba
--    ✘ Datos de auditoría de desarrollo
--    ✘ Refresh tokens antiguos
--
--  Ejecutar en la VM PostgreSQL (.23):
--    psql -h 172.16.3.23 -U app_user -d registro_muni_union -f instalacion_limpia.sql
-- ═══════════════════════════════════════════════════════════════════

-- Seguridad: verificar que estamos en la base correcta
DO $$
BEGIN
  IF current_database() != 'registro_muni_union' THEN
    RAISE EXCEPTION 'ERROR: Conectado a la base incorrecta: %. Conéctate a registro_muni_union', current_database();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- PASO 1: Extensiones
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ─────────────────────────────────────────────────────────────────
-- PASO 2: Tablas de Catálogo
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tipos_documento (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- ─────────────────────────────────────────────────────────────────
-- PASO 3: Usuarios y Seguridad
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id                 SERIAL PRIMARY KEY,
    username           VARCHAR(50)  NOT NULL UNIQUE,
    password_hash      TEXT         NOT NULL,
    nombres            VARCHAR(100) NOT NULL,
    apellidos          VARCHAR(100) NOT NULL,
    rol_id             INTEGER      NOT NULL REFERENCES roles(id),
    dni                VARCHAR(15),
    telefono           VARCHAR(20),
    activo             BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro     TIMESTAMP    NOT NULL DEFAULT NOW(),
    fecha_modificacion TIMESTAMP,
    fecha_eliminacion  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuario_permisos (
    usuario_id         INTEGER   NOT NULL PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    actas_anular       BOOLEAN   NOT NULL DEFAULT FALSE,
    actas_eliminar     BOOLEAN   NOT NULL DEFAULT FALSE,
    actas_modificar    BOOLEAN   NOT NULL DEFAULT TRUE,
    personas_eliminar  BOOLEAN   NOT NULL DEFAULT FALSE,
    personas_modificar BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- PASO 4: Personas (ciudadanos)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personas (
    id                SERIAL PRIMARY KEY,
    tipo_documento_id INTEGER      NOT NULL DEFAULT 1 REFERENCES tipos_documento(id),
    dni               VARCHAR(20),
    nombres           VARCHAR(100) NOT NULL,
    apellido_paterno  VARCHAR(100) NOT NULL,
    apellido_materno  VARCHAR(100) NOT NULL,
    sexo              CHAR(1)      CHECK (sexo IN ('M', 'F')),
    fecha_nacimiento  DATE,
    fecha_fallecimiento DATE,
    telefono          VARCHAR(20),
    direccion         TEXT,
    observaciones     TEXT,
    usuario_registro  INTEGER      REFERENCES usuarios(id),
    fecha_registro    TIMESTAMP    NOT NULL DEFAULT NOW(),
    usuario_eliminacion INTEGER    REFERENCES usuarios(id),
    fecha_eliminacion TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────
-- PASO 5: Actas Civiles
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS actas (
    id                    SERIAL PRIMARY KEY,
    tipo_acta             VARCHAR(20)  NOT NULL
                              CHECK (tipo_acta IN ('NACIMIENTO', 'MATRIMONIO', 'DEFUNCION')),
    numero_acta           VARCHAR(30)  NOT NULL,
    anio                  INTEGER      NOT NULL,
    persona_principal_id  INTEGER      NOT NULL REFERENCES personas(id),
    persona_secundaria_id INTEGER      REFERENCES personas(id),
    fecha_acta            DATE         NOT NULL,
    estado                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'
                              CHECK (estado IN ('ACTIVO', 'ANULADO', 'OBSERVADO')),
    observaciones         TEXT,
    usuario_registro      INTEGER      REFERENCES usuarios(id),
    fecha_registro        TIMESTAMP    NOT NULL DEFAULT NOW(),
    usuario_eliminacion   INTEGER      REFERENCES usuarios(id),
    fecha_eliminacion     TIMESTAMP,
    CONSTRAINT chk_matrimonio_segunda_persona
        CHECK (tipo_acta <> 'MATRIMONIO' OR persona_secundaria_id IS NOT NULL),
    UNIQUE (numero_acta, anio)
);

-- ─────────────────────────────────────────────────────────────────
-- PASO 6: Documentos Digitales (PDFs de actas)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos_digitales (
    id                  SERIAL PRIMARY KEY,
    acta_id             INTEGER   NOT NULL REFERENCES actas(id),
    nombre_archivo      TEXT      NOT NULL,
    ruta_archivo        TEXT      NOT NULL,
    tipo_archivo        VARCHAR(10),
    hash_archivo        TEXT,
    usuario_registro    INTEGER   REFERENCES usuarios(id),
    fecha_registro      TIMESTAMP NOT NULL DEFAULT NOW(),
    usuario_eliminacion INTEGER   REFERENCES usuarios(id),
    fecha_eliminacion   TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────
-- PASO 7: Solicitudes de Copias Certificadas
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS solicitantes (
    id             SERIAL PRIMARY KEY,
    dni            VARCHAR(20)  NOT NULL,
    nombres        VARCHAR(100) NOT NULL,
    apellidos      VARCHAR(150) NOT NULL,
    telefono       VARCHAR(20),
    direccion      TEXT,
    fecha_registro TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitudes (
    id                  SERIAL PRIMARY KEY,
    solicitante_id      INTEGER      NOT NULL REFERENCES solicitantes(id),
    tipo_solicitud      VARCHAR(30)  NOT NULL,
    estado              VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                            CHECK (estado IN ('PENDIENTE', 'ATENDIDO', 'ANULADO')),
    observaciones       TEXT,
    usuario_registro    INTEGER      REFERENCES usuarios(id),
    fecha_solicitud     TIMESTAMP    NOT NULL DEFAULT NOW(),
    usuario_atencion    INTEGER      REFERENCES usuarios(id),
    fecha_atencion      TIMESTAMP,
    usuario_eliminacion INTEGER      REFERENCES usuarios(id),
    fecha_eliminacion   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_solicitud (
    id                SERIAL PRIMARY KEY,
    solicitud_id      INTEGER        NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    acta_id           INTEGER        REFERENCES actas(id),
    cantidad          INTEGER        NOT NULL DEFAULT 1,
    precio_unitario   NUMERIC(8,2),
    total             NUMERIC(8,2),
    fecha_eliminacion TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────
-- PASO 8: Auditoría
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria (
    id             SERIAL PRIMARY KEY,
    usuario_id     INTEGER      REFERENCES usuarios(id),
    tabla_afectada VARCHAR(50)  NOT NULL,
    operacion      VARCHAR(20)  NOT NULL,
    registro_id    INTEGER      NOT NULL DEFAULT 0,
    descripcion    TEXT,
    ip             VARCHAR(50),
    fecha          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- PASO 9: Índices de rendimiento
-- ─────────────────────────────────────────────────────────────────
-- Búsqueda fuzzy en personas
CREATE INDEX IF NOT EXISTS idx_personas_nombres_trgm
    ON personas USING GIN (nombres gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_personas_ap_paterno_trgm
    ON personas USING GIN (apellido_paterno gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_personas_ap_materno_trgm
    ON personas USING GIN (apellido_materno gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_personas_dni
    ON personas (dni) WHERE dni IS NOT NULL;

-- Actas
CREATE INDEX IF NOT EXISTS idx_actas_tipo_anio
    ON actas (tipo_acta, anio);
CREATE INDEX IF NOT EXISTS idx_actas_fecha
    ON actas (fecha_acta);
CREATE INDEX IF NOT EXISTS idx_actas_persona_principal
    ON actas (persona_principal_id);
CREATE INDEX IF NOT EXISTS idx_actas_estado
    ON actas (estado) WHERE fecha_eliminacion IS NULL;

-- Auditoría
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario
    ON auditoria (usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha
    ON auditoria (fecha DESC);

-- Refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario
    ON refresh_tokens (usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
    ON refresh_tokens (expires_at);

-- ─────────────────────────────────────────────────────────────────
-- PASO 10: Datos iniciales del sistema
-- ─────────────────────────────────────────────────────────────────

-- Roles
INSERT INTO roles (id, nombre) VALUES
    (1, 'ADMIN'),
    (2, 'USER'),
    (3, 'CONSULTA')
ON CONFLICT (id) DO NOTHING;

-- Tipos de documento de identidad
INSERT INTO tipos_documento (id, nombre) VALUES
    (1, 'DNI'),
    (2, 'CARNET EXTR.'),
    (3, 'PASAPORTE'),
    (4, 'PART. NACIMIENTO'),
    (5, 'LIBRETA ELECTORAL'),
    (6, 'SIN DOCUMENTO')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- PASO 11: Usuario administrador único
-- ─────────────────────────────────────────────────────────────────
-- ⚠ CONTRASEÑA POR DEFECTO: 123456
-- ⚠ CAMBIAR INMEDIATAMENTE después del primer inicio de sesión
-- Hash bcrypt (10 rounds) para "123456" — mismo valor que 005_seed_data.sql
INSERT INTO usuarios (username, password_hash, nombres, apellidos, rol_id, activo)
VALUES (
    'aespinoza',
    '$2b$10$kmk7JEi4q3MKV5lNYUCcN.ZdxkT7Rm5SAHszpqdhGee4q9X7Sy3JS',
    'ADMINISTRADOR',
    'DEL SISTEMA',
    1,
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Permisos completos para el administrador
INSERT INTO usuario_permisos (
    usuario_id,
    actas_anular, actas_eliminar, actas_modificar,
    personas_eliminar, personas_modificar
)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE
FROM usuarios WHERE username = 'aespinoza'
ON CONFLICT (usuario_id) DO NOTHING;

-- Identidad visual configurable
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave              VARCHAR(100) PRIMARY KEY,
    valor              TEXT         NOT NULL,
    descripcion        TEXT,
    fecha_registro     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ
);

INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES
    ('logo_principal', '/Logo_MDUnion.svg', 'Ruta canónica del logo principal institucional.'),
    ('logo_blanco', '/Logo_blanco.svg', 'Ruta canónica del logo blanco institucional.')
ON CONFLICT (clave) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_tablas   INTEGER;
  v_usuarios INTEGER;
  v_roles    INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tablas
    FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  SELECT COUNT(*) INTO v_usuarios FROM usuarios WHERE fecha_eliminacion IS NULL;
  SELECT COUNT(*) INTO v_roles    FROM roles;

  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '  INSTALACIÓN LIMPIA COMPLETADA';
  RAISE NOTICE '  Tablas creadas:    %', v_tablas;
  RAISE NOTICE '  Roles registrados: %', v_roles;
  RAISE NOTICE '  Usuarios activos:  %', v_usuarios;
  RAISE NOTICE '';
  RAISE NOTICE '  Usuario admin: aespinoza';
  RAISE NOTICE '  Contraseña:    123456';
  RAISE NOTICE '  ⚠ CAMBIAR al primer inicio de sesión';
  RAISE NOTICE '════════════════════════════════════════════';
END $$;
