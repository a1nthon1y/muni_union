import api from "@/utils/api";

export type LogoTipo = "principal" | "blanco";

export interface LogoConfig {
    tipo: LogoTipo;
    nombre?: string; // Opcional para el endpoint público
    ruta: string; // Ahora puede tener diferentes extensiones
    personalizado: boolean;
    fecha_modificacion?: string | null; // Opcional para el endpoint público
}

export const configuracionService = {
    async getLogos() {
        try {
            const { data } = await api.get<Record<LogoTipo, LogoConfig>>(
                "/configuracion/logos",
            );
            return data;
        } catch (error) {
            // Si falla la autenticación, intentar con el endpoint público
            try {
                const { data } = await api.get<Record<LogoTipo, LogoConfig>>(
                    "/configuracion/logos/public",
                );
                return data;
            } catch (publicError) {
                // Si ambos fallan, lanzar el error original
                throw error;
            }
        }
    },

    async updateLogo(tipo: LogoTipo, file: File) {
        const formData = new FormData();
        formData.append("logo", file);
        const { data } = await api.put<LogoConfig & { message: string }>(
            `/configuracion/logos/${tipo}`,
            formData,
        );
        return data;
    },
};
