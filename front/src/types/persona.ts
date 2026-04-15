export interface Persona {
    id: number;
    tipo_documento?: string; // DNI, CNE, PASAPORTE, etc.
    dni?: string; // Opcional para recién nacidos
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    sexo: 'M' | 'F';
    fecha_nacimiento?: string; // Opcional
    telefono?: string;
    direccion?: string;
    observaciones?: string;
    activo: boolean; // fecha_eliminacion es NULL
    fecha_registro: string;
}

export interface PersonaInput {
    tipo_documento?: string;
    dni?: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    sexo?: 'M' | 'F';
    fecha_nacimiento?: string;
    telefono?: string;
    direccion?: string;
    observaciones?: string;
}
