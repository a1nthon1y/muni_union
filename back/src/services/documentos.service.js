import { pool } from "../config/db.js";

export const registrarDocumento = async (datos, usuario_id) => {
    const { acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo } = datos;

    const { rows } = await pool.query(
        `
    INSERT INTO documentos_digitales 
      (acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_registro)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
        [acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_id]
    );

    return rows[0];
};

/**
 * Reemplaza un documento existente. 
 * Primero marca como eliminado (historial) el documento anterior y luego inserta el nuevo.
 * Todo se ejecuta dentro de una transacción para asegurar consistencia.
 */
export const reemplazarDocumento = async (datosNuevoDoc, documento_anterior_id, usuario_id) => {
    const { acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo } = datosNuevoDoc;
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Pasar el documento anterior al "Historial" (Soft-Delete)
        if (documento_anterior_id) {
            await client.query(
                `UPDATE documentos_digitales 
                 SET fecha_eliminacion = NOW(), usuario_eliminacion = $1
                 WHERE id = $2`,
                [usuario_id, documento_anterior_id]
            );
        }

        // 2. Insertar el nuevo documento vigente
        const { rows } = await client.query(
            `INSERT INTO documentos_digitales 
              (acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_registro)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_id]
        );

        await client.query('COMMIT');
        return rows[0];
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const listarDocumentosPorActa = async (acta_id) => {
    const { rows } = await pool.query(
        "SELECT * FROM documentos_digitales WHERE acta_id = $1 AND fecha_eliminacion IS NULL",
        [acta_id]
    );
    return rows;
};

/**
 * Devuelve TODOS los documentos del acta, incluyendo los reemplazados (soft-deleted).
 * Útil para mostrar el historial de escaneos anteriores como referencia.
 */
export const listarHistorialDocumentosPorActa = async (acta_id) => {
    const { rows } = await pool.query(
        `SELECT 
            id, acta_id, nombre_archivo, ruta_archivo, tipo_archivo, 
            hash_archivo, usuario_registro, fecha_registro, fecha_eliminacion,
            CASE WHEN fecha_eliminacion IS NULL THEN true ELSE false END AS es_activo
         FROM documentos_digitales 
         WHERE acta_id = $1
         ORDER BY fecha_registro DESC`,
        [acta_id]
    );
    return rows;
};

export const eliminarDocumento = async (id, usuario_id) => {
    const { rows } = await pool.query(
        `
    UPDATE documentos_digitales 
    SET 
      fecha_eliminacion = NOW(), 
      usuario_eliminacion = $1
    WHERE id = $2
    RETURNING id
    `,
        [usuario_id, id]
    );
    return rows[0];
};

export const eliminarDocumentoDefinitivo = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM documentos_digitales WHERE id = $1 RETURNING id",
        [id]
    );
    return rows[0];
};

export const restaurarDocumento = async (documentoId, usuario_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Obtener el documento a restaurar
        const { rows: docRows } = await client.query(
            "SELECT * FROM documentos_digitales WHERE id = $1",
            [documentoId]
        );
        if (docRows.length === 0) {
            throw new Error("Documento no encontrado");
        }
        const docARestaurar = docRows[0];
        const actaId = docARestaurar.acta_id;

        // 2. Archivar cualquier documento actualmente activo de esa acta
        await client.query(
            `UPDATE documentos_digitales 
             SET fecha_eliminacion = NOW(), usuario_eliminacion = $1
             WHERE acta_id = $2 AND fecha_eliminacion IS NULL`,
            [usuario_id, actaId]
        );

        // 3. Reactivar el documento seleccionado
        const { rows: restoredRows } = await client.query(
            `UPDATE documentos_digitales 
             SET fecha_eliminacion = NULL, usuario_eliminacion = NULL
             WHERE id = $1
             RETURNING *`,
            [documentoId]
        );

        await client.query('COMMIT');
        return restoredRows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
