import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Función robusta para formatear fechas desde la base de datos (Postgres).
 * Evita el desfase de zona horaria que ocurre con 'new Date()'.
 */
export const dateUtils = {
    /**
     * Formatea una fecha simple (YYYY-MM-DD) para mostrar en la UI.
     * Ejemplo: "1995-05-20" -> "20 de mayo de 1995"
     */
    formatDisplayDate: (dateStr: string | null | undefined): string => {
        if (!dateStr) return "—";
        
        // Si ya viene formateada (ej: DD/MM/YYYY), devolverla
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

        try {
            // Dividir para evitar que JS interprete como UTC al usar parseISO
            const parts = dateStr.split('T')[0].split(/[-/]/);
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const day = parseInt(parts[2]);
                const localDate = new Date(year, month, day);
                return format(localDate, "dd 'de' MMMM 'de' yyyy", { locale: es });
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    },

    /**
     * Formatea un timestamp (2024-03-11 15:30:00) para mostrar en la UI.
     */
    formatDisplayTimestamp: (dateStr: string | null | undefined): string => {
        if (!dateStr) return "—";
        try {
            // Si el backend viene estandarizado como string ISO o simple
            // Reemplazamos el espacio por 'T' si no lo tiene para que parseISO funcione mejor
            const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
            const date = parseISO(isoStr);
            return format(date, "dd/MM/yyyy HH:mm", { locale: es });
        } catch (e) {
            return dateStr;
        }
    },

    /**
     * Prepara una fecha para un input de tipo date (YYYY-MM-DD).
     */
    formatInputDate: (dateStr: string | null | undefined): string => {
        if (!dateStr) return "";
        try {
            return dateStr.split('T')[0];
        } catch (e) {
            return "";
        }
    }
};
