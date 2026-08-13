export const ROL_ADMIN = 1;
export const ROL_REGISTRADOR = 2;
export const ROL_CONSULTA = 3;

export const isAdmin = (rolId?: number | null) => rolId === ROL_ADMIN;
export const isConsulta = (rolId?: number | null) => rolId === ROL_CONSULTA;
export const isOperador = (rolId?: number | null) =>
    rolId === ROL_ADMIN || rolId === ROL_REGISTRADOR;

/** Rutas del dashboard prohibidas para perfil CONSULTA. */
export const RUTAS_SOLO_OPERADOR = [
    "/dashboard/digitalizacion",
    "/dashboard/usuarios",
    "/dashboard/auditoria",
    "/dashboard/backup",
    "/dashboard/configuracion",
] as const;

export const rutaBloqueadaParaConsulta = (pathname: string) =>
    RUTAS_SOLO_OPERADOR.some(
        (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
    );

export const etiquetaRol = (rolId: number, rolNombre?: string) => {
    if (rolId === ROL_ADMIN) return "ADMIN";
    if (rolId === ROL_CONSULTA) return "CONSULTA";
    if (rolNombre === "USER") return "REGISTRADOR";
    return rolNombre ?? "USUARIO";
};
