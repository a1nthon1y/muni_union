import { pool } from "../config/db.js";

/**
 * Verificación pública de constancias de trámite.
 * No requiere autenticación — el ciudadano puede comprobar la
 * autenticidad de su Constancia usando el N° impreso en el documento.
 *
 * Devuelve solo los datos suficientes para confirmar autenticidad:
 * no expone el contenido de las actas ni datos sensibles del solicitante.
 */
export const verificarSolicitud = async (req, res) => {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
        return res.status(400).json({ valido: false, message: "Código de verificación inválido." });
    }

    try {
        const { rows } = await pool.query(
            `SELECT
                s.id,
                s.tipo_solicitud,
                s.estado,
                s.fecha_solicitud,
                s.fecha_atencion,
                LEFT(sl.nombres, 1) || '. ' || sl.apellidos   AS solicitante,
                (SELECT COALESCE(SUM(d.total), 0)
                 FROM detalle_solicitud d WHERE d.solicitud_id = s.id) AS total,
                (SELECT COUNT(*) FROM detalle_solicitud d WHERE d.solicitud_id = s.id)::int AS cantidad_documentos,
                u.nombres || ' ' || u.apellidos                AS atendido_por
             FROM solicitudes s
             JOIN solicitantes sl ON sl.id = s.solicitante_id
             LEFT JOIN usuarios u ON u.id = s.usuario_atencion
             WHERE s.id = $1 AND s.fecha_eliminacion IS NULL`,
            [idNum]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                valido: false,
                message: "No se encontró ninguna constancia con ese número. Verifique que el código sea correcto.",
            });
        }

        const s = rows[0];
        return res.json({
            valido: true,
            constancia: {
                numero:               s.id.toString().padStart(6, "0"),
                tipo_solicitud:       s.tipo_solicitud,
                estado:               s.estado,
                fecha_solicitud:      s.fecha_solicitud,
                fecha_atencion:       s.fecha_atencion ?? null,
                solicitante:          s.solicitante,        // solo inicial de nombre + apellidos
                cantidad_documentos:  s.cantidad_documentos,
                total:                parseFloat(s.total).toFixed(2),
                atendido_por:         s.estado === "ATENDIDO" ? s.atendido_por : null,
            },
        });
    } catch (err) {
        return res.status(500).json({ valido: false, message: "Error al verificar la constancia." });
    }
};
