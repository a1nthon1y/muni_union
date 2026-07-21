import { Usuario, UsuarioPermisos } from "./auth";

export interface UsuarioInput {
    nombres: string;
    apellidos: string;
    rol_id: number;
    telefono?: string;
    dni?: string;
    password?: string;
    permisos?: Partial<UsuarioPermisos>;
}

export interface ChangePasswordInput {
    passwordActual: string;
    passwordNuevo: string;
}
