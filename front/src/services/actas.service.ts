import api from "@/utils/api";
import { Acta, ActaInput, EstadoActa } from "@/types/acta";

export interface ActasFilters {
    q?: string;
    tipo?: string;
    anio?: string;
    dni?: string;
    numero?: string;
    libro?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    persona_id?: number | string;
    page?: number;
    limit?: number;
}

export interface ActasPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const actasService = {
    async getAll(filtros: ActasFilters = {}) {
        const { data } = await api.get<{
            data: Acta[];
            pagination: ActasPagination;
        }>("/actas", { params: filtros });
        return data;
    },

    async getById(id: number) {
        const { data } = await api.get<Acta>(`/actas/${id}`);
        return data;
    },

    async create(acta: ActaInput) {
        const { data } = await api.post<Acta>("/actas", acta);
        return data;
    },

    async update(id: number, acta: Partial<ActaInput> & { estado?: EstadoActa }) {
        const { data } = await api.put<Acta>(`/actas/${id}`, acta);
        return data;
    },

    async delete(id: number) {
        const { data } = await api.delete(`/actas/${id}`);
        return data;
    },

    async anular(id: number, motivo: string) {
        const { data } = await api.patch<Acta>(`/actas/${id}/anular`, { motivo });
        return data;
    },

    async reactivate(id: number) {
        const { data } = await api.patch<Acta>(`/actas/${id}/reactivar`);
        return data;
    },

    async getSiguienteNumero(params: {
        tipo_acta: string;
        anio: number;
        modo: "CLASICO" | "CUI";
        libro?: string;
    }): Promise<{ siguiente: number | null }> {
        const { data } = await api.get<{ siguiente: number | null }>("/actas/siguiente-numero", {
            params
        });
        return data;
    }
};
