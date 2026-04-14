import api from "@/utils/api";
import { Solicitud, SolicitudInput, Solicitante, SolicitanteInput } from "@/types/solicitud";

export const solicitudesService = {
    // Solicitantes
    async createSolicitante(datos: SolicitanteInput) {
        const { data } = await api.post<Solicitante>("/solicitudes/solicitantes", datos);
        return data;
    },

    async getSolicitanteByDni(dni: string) {
        const { data } = await api.get<Solicitante>(`/solicitudes/solicitantes/${dni}`);
        return data;
    },

    // Solicitudes
    async getAll(filtros: { estado?: string; q?: string; fecha_desde?: string; fecha_hasta?: string; page?: number; limit?: number } = {}) {
        const { data } = await api.get<{ data: Solicitud[]; total: number }>("/solicitudes", {
            params: filtros
        });
        return data;
    },

    async getById(id: number) {
        const { data } = await api.get<Solicitud>(`/solicitudes/${id}`);
        return data;
    },

    async create(solicitud: SolicitudInput) {
        const { data } = await api.post<Solicitud>("/solicitudes", solicitud);
        return data;
    },

    async atender(id: number) {
        const { data } = await api.patch<Solicitud>(`/solicitudes/${id}/atender`);
        return data;
    },

    async anular(id: number, motivo?: string) {
        const { data } = await api.patch<Solicitud>(`/solicitudes/${id}/anular`, { motivo });
        return data;
    },

    async delete(id: number) {
        const { data } = await api.delete(`/solicitudes/${id}`);
        return data;
    }
};
