-- ============================================================
-- Script 010: Rol CONSULTA (solo lectura para terceros)
-- ============================================================

INSERT INTO roles (id, nombre) VALUES
    (3, 'CONSULTA')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE roles IS 'Perfiles: 1=ADMIN, 2=USER (registrador), 3=CONSULTA (solo lectura)';
