import api from "@/utils/api";

export interface ConfiguracionSistema {
    url_verificacion_publica: string;
    descripcion?: string | null;
    fecha_modificacion?: string | null;
    ejemplo_verificacion: string;
}

export const configuracionService = {
    async get() {
        const { data } = await api.get<ConfiguracionSistema>("/configuracion");
        return data;
    },

    async updateUrlVerificacion(url_verificacion_publica: string) {
        const { data } = await api.put<ConfiguracionSistema & { message: string }>(
            "/configuracion/url-verificacion",
            { url_verificacion_publica }
        );
        return data;
    },
};
