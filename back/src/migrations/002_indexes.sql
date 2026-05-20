-- ─────────────────────────────────────────────────────────────────────────────
-- Migración 002: Índices de rendimiento
-- Ejecutar una sola vez en la BD (Neon o on-premise).
-- Todos los CREATE INDEX usan IF NOT EXISTS → son idempotentes.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── PERSONAS ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_personas_nombre_gin
    ON personas USING GIN (
        (apellido_paterno || ' ' || apellido_materno || ' ' || nombres) gin_trgm_ops
    )
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_personas_dni_gin
    ON personas USING GIN (dni gin_trgm_ops)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_personas_eliminacion
    ON personas (fecha_eliminacion)
    WHERE fecha_eliminacion IS NULL;

-- ── ACTAS ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_actas_tipo
    ON actas (tipo_acta)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_anio
    ON actas (anio)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_tipo_anio
    ON actas (tipo_acta, anio)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_numero_gin
    ON actas USING GIN (numero_acta gin_trgm_ops)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_persona_principal
    ON actas (persona_principal_id)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_persona_secundaria
    ON actas (persona_secundaria_id)
    WHERE persona_secundaria_id IS NOT NULL AND fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_estado
    ON actas (estado)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_eliminacion
    ON actas (fecha_eliminacion)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_fecha_acta
    ON actas (fecha_acta)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_actas_fecha_registro
    ON actas (fecha_registro DESC)
    WHERE fecha_eliminacion IS NULL;

-- ── SOLICITUDES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado
    ON solicitudes (estado)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha
    ON solicitudes (fecha_solicitud DESC)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_solicitudes_eliminacion
    ON solicitudes (fecha_eliminacion)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario_registro
    ON solicitudes (usuario_registro)
    WHERE fecha_eliminacion IS NULL;

-- ── SOLICITANTES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_solicitantes_dni
    ON solicitantes (dni);

CREATE INDEX IF NOT EXISTS idx_solicitantes_nombre_gin
    ON solicitantes USING GIN (
        (nombres || ' ' || apellidos) gin_trgm_ops
    );

-- ── USUARIOS ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_dni_gin
    ON usuarios USING GIN (dni gin_trgm_ops)
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_nombre_gin
    ON usuarios USING GIN (
        (nombres || ' ' || apellidos) gin_trgm_ops
    )
    WHERE fecha_eliminacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_eliminacion
    ON usuarios (fecha_eliminacion)
    WHERE fecha_eliminacion IS NULL;

-- ── DOCUMENTOS DIGITALES ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documentos_acta_id
    ON documentos_digitales (acta_id)
    WHERE fecha_eliminacion IS NULL;

-- ── DETALLE SOLICITUD ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_detalle_solicitud_id
    ON detalle_solicitud (solicitud_id);

CREATE INDEX IF NOT EXISTS idx_detalle_acta_id
    ON detalle_solicitud (acta_id);

-- ── AUDITORÍA ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario
    ON auditoria (usuario_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla
    ON auditoria (tabla_afectada);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha
    ON auditoria (fecha DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_operacion
    ON auditoria (operacion);

-- ── REFRESH TOKENS ────────────────────────────────────────────────────────────
-- Ya creados en 001_refresh_tokens.sql (idx_rt_usuario, idx_rt_expires)
