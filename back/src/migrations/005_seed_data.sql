-- =============================================================================
-- SISTEMA DE REGISTRO CIVIL — MUNICIPALIDAD DISTRITAL DE LA UNIÓN
-- Script 005: Datos iniciales del sistema (seed)
-- Ejecutar UNA sola vez después de 000_schema.sql
-- =============================================================================

-- ── Roles ────────────────────────────────────────────────────────────────────
INSERT INTO roles (id, nombre) VALUES
    (1, 'ADMIN'),
    (2, 'USER'),
    (3, 'CONSULTA')
ON CONFLICT (id) DO NOTHING;

-- ── Tipos de documento de identidad ──────────────────────────────────────────
INSERT INTO tipos_documento (id, nombre) VALUES
    (1, 'DNI'),
    (2, 'CARNET EXTR.'),
    (3, 'PASAPORTE'),
    (4, 'PART. NACIMIENTO'),
    (5, 'LIBRETA ELECTORAL'),
    (6, 'SIN DOCUMENTO')
ON CONFLICT (id) DO NOTHING;

-- ── Usuario administrador inicial ─────────────────────────────────────────────
-- Contraseña por defecto: 123456
-- ⚠ CAMBIAR INMEDIATAMENTE después del primer inicio de sesión.
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
