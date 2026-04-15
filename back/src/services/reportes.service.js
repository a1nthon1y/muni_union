import { pool } from "../config/db.js";

/**
 * Obtener conteos generales para las tarjetas del dashboard
 */
export const getDashboardStats = async () => {
    const { rows } = await pool.query(`
        SELECT
            (SELECT COUNT(*) FROM actas       WHERE fecha_eliminacion IS NULL)::int AS "totalActas",
            (SELECT COUNT(*) FROM personas    WHERE fecha_eliminacion IS NULL)::int AS "totalPersonas",
            (SELECT COUNT(*) FROM solicitudes WHERE estado = 'PENDIENTE')::int      AS "solicitudesPendientes",
            (SELECT COUNT(*) FROM solicitudes WHERE estado = 'ATENDIDO')::int       AS "solicitudesAtendidas",
            (SELECT COUNT(*) FROM solicitudes
              WHERE DATE_TRUNC('month', fecha_solicitud) = DATE_TRUNC('month', CURRENT_DATE))::int AS "solicitudesMes",
            (SELECT COUNT(*) FROM usuarios    WHERE fecha_eliminacion IS NULL)::int AS "totalUsuarios"
    `);
    return rows[0];
};

/**
 * Obtener evolución mensual de registros de actas por tipo
 */
export const getActasByMonth = async () => {
    const { rows } = await pool.query(`
        SELECT
            TO_CHAR(fecha_registro, 'YYYY-Mon')   AS mes,
            EXTRACT(YEAR  FROM fecha_registro)::int AS anio,
            EXTRACT(MONTH FROM fecha_registro)::int AS mes_num,
            tipo_acta,
            COUNT(*)::int AS cantidad
        FROM actas
        WHERE fecha_eliminacion IS NULL
          AND fecha_registro >= NOW() - INTERVAL '6 months'
        GROUP BY
            TO_CHAR(fecha_registro, 'YYYY-Mon'),
            EXTRACT(YEAR  FROM fecha_registro),
            EXTRACT(MONTH FROM fecha_registro),
            tipo_acta
        ORDER BY anio, mes_num
    `);
    return rows;
};

/**
 * Estadísticas de solicitudes por estado
 */
export const getSolicitudesStats = async () => {
    const { rows } = await pool.query(`
        SELECT estado, COUNT(*)::int as cantidad
        FROM solicitudes
        WHERE fecha_eliminacion IS NULL
        GROUP BY estado
    `);
    return rows;
};

/**
 * Ingresos monetarios mensuales (basado en detalle_solicitud)
 */
export const getIngresosStats = async () => {
    const { rows } = await pool.query(`
        SELECT
            TO_CHAR(s.fecha_solicitud, 'YYYY-Mon')   AS mes,
            EXTRACT(YEAR  FROM s.fecha_solicitud)::int AS anio,
            EXTRACT(MONTH FROM s.fecha_solicitud)::int AS mes_num,
            SUM(d.total)::numeric AS total_ingresos
        FROM solicitudes s
        JOIN detalle_solicitud d ON s.id = d.solicitud_id
        WHERE s.estado = 'ATENDIDO'
          AND s.fecha_eliminacion IS NULL
          AND s.fecha_solicitud >= NOW() - INTERVAL '6 months'
        GROUP BY
            TO_CHAR(s.fecha_solicitud, 'YYYY-Mon'),
            EXTRACT(YEAR  FROM s.fecha_solicitud),
            EXTRACT(MONTH FROM s.fecha_solicitud)
        ORDER BY anio, mes_num
    `);
    return rows;
};
