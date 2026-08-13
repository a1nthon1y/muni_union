-- =============================================================================
-- Separar personas S/N · S/A · S/A fusionadas por importación masiva
-- =============================================================================
-- Cuándo usar: después de backup, antes de reimportar Excel con fechas.
-- Efecto: cada acta de defunción queda con su propia ficha de persona.
-- La primera acta (menor id) permanece en la persona original.
-- =============================================================================

-- 1) Diagnóstico (ejecutar antes)
SELECT p.id AS persona_id,
       COUNT(a.id) AS cant_actas,
       ARRAY_AGG(a.numero_acta ORDER BY a.id) AS actas
FROM personas p
JOIN actas a ON a.persona_principal_id = p.id
WHERE UPPER(p.nombres) = 'S/N'
  AND UPPER(p.apellido_paterno) = 'S/A'
  AND UPPER(p.apellido_materno) = 'S/A'
  AND a.tipo_acta = 'DEFUNCION'
  AND p.fecha_eliminacion IS NULL
  AND a.fecha_eliminacion IS NULL
GROUP BY p.id
HAVING COUNT(a.id) > 1
ORDER BY p.id;

BEGIN;

DO $$
DECLARE
    rec RECORD;
    orig personas%ROWTYPE;
    nueva_persona_id INTEGER;
    separadas INTEGER := 0;
BEGIN
    FOR rec IN
        SELECT f.persona_id, f.acta_id
        FROM (
            SELECT p.id AS persona_id,
                   a.id AS acta_id,
                   ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY a.id) AS rn
            FROM personas p
            JOIN actas a ON a.persona_principal_id = p.id
            WHERE UPPER(p.nombres) = 'S/N'
              AND UPPER(p.apellido_paterno) = 'S/A'
              AND UPPER(p.apellido_materno) = 'S/A'
              AND a.tipo_acta = 'DEFUNCION'
              AND p.fecha_eliminacion IS NULL
              AND a.fecha_eliminacion IS NULL
        ) f
        WHERE f.rn > 1
        ORDER BY f.persona_id, f.acta_id
    LOOP
        SELECT * INTO orig FROM personas WHERE id = rec.persona_id;

        INSERT INTO personas (
            tipo_documento_id,
            dni,
            nombres,
            apellido_paterno,
            apellido_materno,
            sexo,
            fecha_nacimiento,
            fecha_fallecimiento,
            telefono,
            direccion,
            observaciones,
            usuario_registro,
            es_homonimo
        )
        VALUES (
            orig.tipo_documento_id,
            NULL,
            orig.nombres,
            orig.apellido_paterno,
            orig.apellido_materno,
            orig.sexo,
            orig.fecha_nacimiento,
            NULL,
            orig.telefono,
            orig.direccion,
            TRIM(BOTH FROM CONCAT_WS(' ',
                NULLIF(orig.observaciones, ''),
                '[Separada de fusión importación S/N·S/A]'
            )),
            orig.usuario_registro,
            FALSE
        )
        RETURNING id INTO nueva_persona_id;

        UPDATE actas
        SET persona_principal_id = nueva_persona_id
        WHERE id = rec.acta_id;

        separadas := separadas + 1;
        RAISE NOTICE 'Acta % → nueva persona % (antes compartía %)',
            rec.acta_id, nueva_persona_id, rec.persona_id;
    END LOOP;

    RAISE NOTICE 'Total actas separadas: %', separadas;
END $$;

-- 2) Verificación (debe devolver 0 filas)
SELECT p.id, COUNT(a.id) AS cant_actas
FROM personas p
JOIN actas a ON a.persona_principal_id = p.id
WHERE UPPER(p.nombres) = 'S/N'
  AND UPPER(p.apellido_paterno) = 'S/A'
  AND UPPER(p.apellido_materno) = 'S/A'
  AND a.tipo_acta = 'DEFUNCION'
  AND p.fecha_eliminacion IS NULL
  AND a.fecha_eliminacion IS NULL
GROUP BY p.id
HAVING COUNT(a.id) > 1;

-- Si la verificación devuelve 0 filas:
COMMIT;

-- Si algo no cuadra (ejecutar en lugar de COMMIT):
-- ROLLBACK;
