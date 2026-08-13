import api from "@/utils/api";
import { Persona, PersonaInput } from "@/types/persona";

export const personasService = {
    async getAll(filtros: { termino?: string; page?: number; limit?: number } = {}) {
        const { data } = await api.get<{ data: Persona[]; total: number }>("/personas", {
            params: filtros
        });
        return data;
    },

    async getById(id: number) {
        const { data } = await api.get<Persona>(`/personas/${id}`);
        return data;
    },

    async create(persona: PersonaInput) {
        const { data } = await api.post<Persona>("/personas", persona);
        return data;
    },

    async update(id: number, persona: Partial<PersonaInput>) {
        const { data } = await api.put<Persona>(`/personas/${id}`, persona);
        return data;
    },

    async delete(id: number) {
        const { data } = await api.delete(`/personas/${id}`);
        return data;
    },

    async reactivate(id: number) {
        const { data } = await api.patch(`/personas/${id}/reactivar`);
        return data;
    },

    async checkDni(dni: string) {
        // Usar getAll con el DNI exacto.
        const response = await this.getAll({ termino: dni });
        return response.data.find(p => p.dni === dni);
    },

    async buscarDuplicados(nombres: string, paterno: string, materno: string) {
        const { data } = await api.get<Persona[]>("/personas/buscar-duplicados", {
            params: {
                nombres,
                apellido_paterno: paterno,
                apellido_materno: materno
            }
        });
        return data;
    },

    async getTiposDocumento() {
        const { data } = await api.get<{ id: number, nombre: string }[]>("/personas/tipos-documento");
        return data;
    },

    async fusionar(homonimoId: number, maestroId: number) {
        const { data } = await api.post(`/personas/${homonimoId}/fusionar`, { maestro_id: maestroId });
        return data;
    }
};
