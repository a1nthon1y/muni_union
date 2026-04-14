import api from "@/utils/api";
import { Usuario } from "@/types/auth";
import { UsuarioInput, ChangePasswordInput } from "@/types/usuario";

export const usuariosService = {
    async listar(filtros: { page?: number; limit?: number; q?: string } = {}) {
        const { data } = await api.get<{ data: Usuario[]; total: number }>("/usuarios", {
            params: filtros
        });
        return data;
    },

    async obtener(id: number) {
        const { data } = await api.get<Usuario>(`/usuarios/${id}`);
        return data;
    },

    async crear(usuario: UsuarioInput) {
        const { data } = await api.post<Usuario>("/usuarios", usuario);
        return data;
    },

    async actualizar(id: number, usuario: Partial<UsuarioInput>) {
        const { data } = await api.put<Usuario>(`/usuarios/${id}`, usuario);
        return data;
    },

    async cambiarEstado(id: number, activo: boolean) {
        const { data } = await api.patch<Usuario>(`/usuarios/${id}/estado`, { activo });
        return data;
    },

    async eliminar(id: number) {
        const { data } = await api.delete(`/usuarios/${id}`);
        return data;
    },

    async cambiarMiPassword(datos: ChangePasswordInput) {
        const { data } = await api.patch("/usuarios/perfil/password", datos);
        return data;
    }
};
