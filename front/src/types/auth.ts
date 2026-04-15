export interface UsuarioPermisos {
    actas_anular: boolean;
    actas_eliminar: boolean;
    actas_modificar: boolean;
    personas_eliminar: boolean;
    personas_modificar: boolean;
}

export interface Usuario {
    id: number;
    username: string;
    nombres: string;
    apellidos: string;
    rol_id: number;
    rol: string;
    telefono?: string;
    dni?: string;
    activo: boolean;
    permisos?: UsuarioPermisos;
}

export interface AuthState {
    usuario: Usuario | null;
    isAuthenticated: boolean;
    login: (usuario: Usuario) => void;
    logout: () => void;
}
