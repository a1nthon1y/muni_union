import { format } from "date-fns";
import { es } from "date-fns/locale";

const TZ = "America/Lima";

/**
 * Interpreta un string de fecha/hora de la BD como hora Lima (America/Lima).
 * Los strings de Postgres vienen sin indicador de timezone (naive).
 * Los parseamos como hora local sin dejar que el navegador aplique
 * conversiones de UTC, y luego los formateamos siempre en Lima.
 */
const parseNaive = (dateStr: string): Date => {
    // "2026-04-15 12:30:00.123456" → "2026-04-15T12:30:00"
    const clean = dateStr.replace(" ", "T").split(".")[0];
    // new Date("YYYY-MM-DDTHH:mm:ss") sin 'Z' → interpreta como LOCAL time
    return new Date(clean);
};

export const dateUtils = {
    /**
     * Formatea una fecha simple (YYYY-MM-DD) para mostrar en la UI.
     * Ejemplo: "1995-05-20" → "20 de mayo de 1995"
     */
    formatDisplayDate: (dateStr: string | null | undefined): string => {
        if (!dateStr) return "—";

        // Ya viene formateada (DD/MM/YYYY)
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

        try {
            const parts = dateStr.split("T")[0].split(/[-/]/);
            if (parts.length === 3) {
                const [year, month, day] = parts.map(Number);
                return format(
                    new Date(year, month - 1, day),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: es }
                );
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    },

    /**
     * Formatea un timestamp de BD mostrando siempre hora Lima (America/Lima).
     * Ejemplo: "2026-04-15 12:30:00" → "15/04/2026 12:30"
     */
    formatDisplayTimestamp: (dateStr: string | null | undefined): string => {
        if (!dateStr) return "—";
        try {
            const date = parseNaive(dateStr);
            // Usar Intl para forzar siempre zona Lima
            return new Intl.DateTimeFormat("es-PE", {
                timeZone: TZ,
                day:    "2-digit",
                month:  "2-digit",
                year:   "numeric",
                hour:   "2-digit",
                minute: "2-digit",
                hour12: false,
            }).format(date).replace(",", "");
        } catch {
            return dateStr;
        }
    },

    /**
     * Prepara una fecha para un input de tipo date (YYYY-MM-DD).
     */
    formatInputDate: (dateStr: string | null | undefined): string => {
        if (!dateStr) return "";
        try {
            return dateStr.split("T")[0];
        } catch {
            return "";
        }
    },
};
