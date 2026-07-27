-- =============================================================================
-- SISTEMA DE REGISTRO CIVIL — MUNICIPALIDAD DISTRITAL DE LA UNIÓN
-- Script 000: Esquema principal de la base de datos
-- Versión: 1.0.0
-- Descripción: Crea todas las tablas, constraints y tipos del sistema.
--              Ejecutar ANTES que los demás scripts de migración.
--              Idempotente: usa IF NOT EXISTS en todas las sentencias.
-- =============================================================================

-- Extensión para búsqueda fuzzy (requerida por 002_indexes.sql)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- TABLAS DE CATÁLOGO
-- =============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tipos_documento (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- =============================================================================
-- USUARIOS
-- =============================================================================

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

-- Permisos granulares adicionales por usuario (solo aplica a rol USER)
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

-- Refresh tokens (sesiones persistentes)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,  -- SHA-256 del JWT
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CIUDADANOS (PERSONAS)
-- =============================================================================

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

-- =============================================================================
-- ACTAS CIVILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS actas (
    id                    SERIAL PRIMARY KEY,
    tipo_acta             VARCHAR(20)  NOT NULL
                              CHECK (tipo_acta IN ('NACIMIENTO', 'MATRIMONIO', 'DEFUNCION')),
    numero_acta           VARCHAR(30)  NOT NULL,
    anio                  INTEGER      NOT NULL,
    persona_principal_id  INTEGER      NOT NULL REFERENCES personas(id),
    persona_secundaria_id INTEGER      REFERENCES personas(id),  -- cónyuge en MATRIMONIO
    fecha_acta            DATE         NOT NULL,
    estado                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'
                              CHECK (estado IN ('ACTIVO', 'ANULADO', 'OBSERVADO')),
    observaciones         TEXT,
    usuario_registro      INTEGER      REFERENCES usuarios(id),
    fecha_registro        TIMESTAMP    NOT NULL DEFAULT NOW(),
    usuario_eliminacion   INTEGER      REFERENCES usuarios(id),
    fecha_eliminacion     TIMESTAMP,
    -- Un matrimonio DEBE tener cónyuge
    CONSTRAINT chk_matrimonio_segunda_persona
        CHECK (tipo_acta <> 'MATRIMONIO' OR persona_secundaria_id IS NOT NULL),
    -- Número de acta único por año (sin eliminar)
    UNIQUE (numero_acta, anio)
);

-- =============================================================================
-- DOCUMENTOS DIGITALES (adjuntos por acta)
-- =============================================================================

CREATE TABLE IF NOT EXISTS documentos_digitales (
    id                  SERIAL PRIMARY KEY,
    acta_id             INTEGER  NOT NULL REFERENCES actas(id),
    nombre_archivo      TEXT     NOT NULL,
    ruta_archivo        TEXT     NOT NULL,
    tipo_archivo        VARCHAR(10),          -- 'PDF' o 'IMG'
    hash_archivo        TEXT,                 -- MD5 para verificar integridad
    usuario_registro    INTEGER  REFERENCES usuarios(id),
    fecha_registro      TIMESTAMP NOT NULL DEFAULT NOW(),
    usuario_eliminacion INTEGER  REFERENCES usuarios(id),
    fecha_eliminacion   TIMESTAMP
);

-- =============================================================================
-- SOLICITUDES DE COPIAS CERTIFICADAS
-- =============================================================================

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
    id               SERIAL PRIMARY KEY,
    solicitud_id     INTEGER        NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    acta_id          INTEGER        REFERENCES actas(id),
    cantidad         INTEGER        NOT NULL DEFAULT 1,
    precio_unitario  NUMERIC(8,2),
    total            NUMERIC(8,2),
    fecha_eliminacion TIMESTAMP
);

-- =============================================================================
-- AUDITORÍA
-- =============================================================================

CREATE TABLE IF NOT EXISTS auditoria (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER      REFERENCES usuarios(id),
    tabla_afectada  VARCHAR(50)  NOT NULL,
    operacion       VARCHAR(20)  NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT…
    registro_id     INTEGER      NOT NULL DEFAULT 0,
    descripcion     TEXT,
    ip              VARCHAR(50),
    fecha           TIMESTAMP    NOT NULL DEFAULT NOW()
);
