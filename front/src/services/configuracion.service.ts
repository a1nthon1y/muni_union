import api from "@/utils/api";

export type LogoTipo = "principal" | "blanco";

export interface LogoConfig {
    tipo: LogoTipo;
    nombre: "Logo_MDUnion.svg" | "Logo_blanco.svg";
    ruta: "/Logo_MDUnion.svg" | "/Logo_blanco.svg";
    personalizado: boolean;
    fecha_modificacion: string | null;
}

export const configuracionService = {
    async getLogos() {
        const { data } = await api.get<Record<LogoTipo, LogoConfig>>(
            "/configuracion/logos",
        );
        return data;
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
