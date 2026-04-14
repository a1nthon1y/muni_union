import app from "./app.js";
import logger from "./config/logger.js";
import { limpiarTokensExpirados } from "./services/auth.service.js";
import { purgarAuditoriaAntigua } from "./services/auditoria.service.js";

process.env.TZ = 'America/Lima';

const PORT = process.env.PORT || 4000;

// Tarea periódica: tokens expirados + auditoría antigua (cada 6 horas)
const runMaintenance = async () => {
    try {
        const tokens = await limpiarTokensExpirados();
        if (tokens > 0) logger.info(`Mantenimiento: ${tokens} refresh token(s) expirado(s) eliminado(s)`);
    } catch (err) {
        logger.warn({ err }, "Error limpiando tokens expirados");
    }
    try {
        const filas = await purgarAuditoriaAntigua();
        if (filas > 0) logger.info(`Mantenimiento: ${filas} registro(s) de auditoría antiguos eliminados`);
    } catch (err) {
        logger.warn({ err }, "Error purgando auditoría antigua");
    }
};

app.listen(PORT, () => {
    logger.info(`Servidor corriendo en http://localhost:${PORT}`);
    runMaintenance();
    setInterval(runMaintenance, 6 * 60 * 60 * 1000); // cada 6 horas
});
