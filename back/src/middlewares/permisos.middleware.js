import { pool } from "../config/db.js";
import { ROL_ADMIN, ROL_CONSULTA } from "./role.middleware.js";

/**
 * Middleware de permisos granulares por módulo.
 *
 * - Los administradores (rol_id === 1) siempre pasan sin consulta a BD.
 * - Para usuarios REGISTRADOR consulta la tabla usuario_permisos en cada
 *   petición protegida, por lo que los cambios de permisos son inmediatos.
 *
 * Uso en routes:
 *   router.patch("/:id/anular",  requirePermiso("actas_anular"),   anularActa);
 *   router.delete("/:id",        requirePermiso("actas_eliminar"),  eliminarActa);
 *   router.delete("/:id",        requirePermiso("personas_eliminar"), eliminarPersona);
 *
 * Campos soportados: actas_anular | actas_eliminar | personas_eliminar
 */
export const requirePermiso = (campo) => async (req, res, next) => {
    try {
        if (req.user.rol_id === ROL_CONSULTA) {
            return res.status(403).json({
                message: "Su perfil es de solo consulta. No puede realizar esta operación.",
            });
        }

        // Admin siempre tiene todos los permisos
        if (req.user.rol_id === ROL_ADMIN) return next();

        const { rows } = await pool.query(
            "SELECT actas_anular, actas_eliminar, actas_modificar, personas_eliminar, personas_modificar FROM usuario_permisos WHERE usuario_id = $1",
            [req.user.id]
        );

        if (rows[0]?.[campo] === true) return next();

        return res.status(403).json({
            message: "No tiene permiso para realizar esta acción. Contacte al administrador."
        });
    } catch (err) {
        return res.status(500).json({ message: "Error al verificar permisos." });
    }
};
