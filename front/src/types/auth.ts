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
}

export interface AuthState {
    usuario: Usuario | null;
    isAuthenticated: boolean;
    login: (usuario: Usuario) => void;
    logout: () => void;
}
