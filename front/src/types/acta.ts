import { Persona } from "./persona";

export type TipoActa = 'NACIMIENTO' | 'MATRIMONIO' | 'DEFUNCION';
export type EstadoActa = 'ACTIVO' | 'OBSERVADO' | 'ANULADO';

export interface Acta {
    id: number;
    tipo_acta: TipoActa;
    numero_acta: string;
    anio: number;
    persona_principal_id: number;
    persona_secundaria_id?: number | null;
    fecha_acta: string;
    estado: EstadoActa;
    observaciones?: string;
    fecha_registro: string;
    // Datos del titular (persona_principal)
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    dni?: string;
    sexo?: "M" | "F";
    fecha_nacimiento?: string;
    fecha_fallecimiento?: string;
    telefono?: string;
    direccion?: string;
    // Datos del cónyuge (persona_secundaria — solo MATRIMONIO)
    p2_nombres?: string;
    p2_apellido_paterno?: string;
    p2_apellido_materno?: string;
    p2_dni?: string;
    p2_sexo?: "M" | "F";
    p2_fecha_nacimiento?: string;
    p2_fecha_fallecimiento?: string;
    p2_telefono?: string;
    // Documento digital
    tiene_documento?: boolean;
    tipo_documento?: string;
    ruta_archivo?: string;
}

export interface ActaInput {
    tipo_acta: TipoActa;
    numero_acta: string;
    anio: number;
    persona_principal_id: number;
    persona_secundaria_id?: number | null;
    fecha_acta: string;
    observaciones?: string;
}

export interface DocumentoDigital {
    id: number;
    acta_id: number;
    nombre_archivo: string;
    ruta_archivo: string;
    tipo_archivo: string;
    hash_archivo: string;
    observaciones?: string;
    fecha_registro: string;
}
