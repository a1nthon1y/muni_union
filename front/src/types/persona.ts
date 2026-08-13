export interface Persona {
    id: number;
    tipo_documento?: string; // DNI, CNE, PASAPORTE, etc.
    dni?: string; // Opcional para recién nacidos
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    sexo: 'M' | 'F';
    fecha_nacimiento?: string; // Opcional
    fecha_fallecimiento?: string; // Opcional
    telefono?: string;
    direccion?: string;
    observaciones?: string;
    activo: boolean; // fecha_eliminacion es NULL
    fecha_registro: string;
    es_homonimo?: boolean; // NUEVO: true = homónimo legítimo confirmado por oficial
}

export interface PersonaInput {
    tipo_documento?: string;
    dni?: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    sexo?: 'M' | 'F' | null;
    fecha_nacimiento?: string | null;
    fecha_fallecimiento?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    observaciones?: string;
    es_homonimo?: boolean; // NUEVO
}
