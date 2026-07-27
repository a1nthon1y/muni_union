import * as actasService from "./actas.service.js";
import * as personasService from "./personas.service.js";
import * as solicitudesService from "./solicitudes.service.js";
import * as auditoriaService from "./auditoria.service.js";
import * as XLSX from "xlsx";

export const formatearFechaExcel = (fecha) => {
    if (!fecha) return "";
    const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
    if (!anio || !mes || !dia) return "";
    return `${dia}/${mes}/${anio}`;
};

export const mapearActaExcel = (acta) => {
    const fila = {
        "ID": acta.id,
        "Tipo de Acta": acta.tipo_acta,
        "Nro. Acta": acta.numero_acta,
        "Año": acta.anio,
        "DNI Titular": acta.dni,
        "Ap. Paterno": acta.apellido_paterno,
        "Ap. Materno": acta.apellido_materno,
        "Nombres": acta.nombres,
        "Fecha Nac. Titular": formatearFechaExcel(acta.fecha_nacimiento),
        "Fecha Fallecimiento Titular": formatearFechaExcel(acta.fecha_fallecimiento),
        "Fecha Acta": formatearFechaExcel(acta.fecha_acta),
        "Estado": acta.estado,
        "Observaciones": acta.observaciones || "",
        "Tiene Documento": acta.tiene_documento ? "SÍ" : "NO",
        "Fecha Registro": acta.fecha_registro
            ? new Date(acta.fecha_registro).toLocaleString()
            : "",
    };

    if (acta.tipo_acta === "MATRIMONIO") {
        fila["DNI Cónyuge"] = acta.p2_dni || "";
        fila["Ap. Pat. Cónyuge"] = acta.p2_apellido_paterno || "";
        fila["Ap. Mat. Cónyuge"] = acta.p2_apellido_materno || "";
        fila["Nombres Cónyuge"] = acta.p2_nombres || "";
        fila["Fecha Nac. Cónyuge"] = formatearFechaExcel(acta.p2_fecha_nacimiento);
        fila["Fecha Fallecimiento Cónyuge"] = formatearFechaExcel(
            acta.p2_fecha_fallecimiento,
        );
    }

    return fila;
};

export const mapearPersonaExcel = (persona) => ({
    "ID": persona.id,
    "DNI": persona.dni || "NO REGISTRA",
    "Nombres": persona.nombres,
    "Apellido Paterno": persona.apellido_paterno,
    "Apellido Materno": persona.apellido_materno,
    "Sexo": persona.sexo === "M" ? "Masculino" : "Femenino",
    "Fecha Nac.": formatearFechaExcel(persona.fecha_nacimiento),
    "Fecha Fallecimiento": formatearFechaExcel(persona.fecha_fallecimiento),
    "Teléfono": persona.telefono || "",
    "Dirección": persona.direccion || "",
    "Observaciones": persona.observaciones || "",
});

export const exportarActasExcel = async (filtros) => {
    // Obtenemos los datos sin paginación (limit muy alto)
    const result = await actasService.listarActas({ ...filtros, limit: 100000, page: 1 });
    const data = result.data;

    const rows = data.map(mapearActaExcel);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Actas");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const exportarPersonasExcel = async (filtros) => {
    const result = await personasService.listarPersonas({ ...filtros, limit: 100000, offset: 0 });
    const data = result.data;

    const rows = data.map(mapearPersonaExcel);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ciudadanos");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const exportarSolicitudesExcel = async (filtros) => {
    const result = await solicitudesService.listarSolicitudes({ ...filtros, limit: 100000, offset: 0 });
    const data = result.data;

    const rows = data.map(s => ({
        "Nro. Trámite": s.id,
        "Tipo": s.tipo_solicitud,
        "Estado": s.estado,
        "DNI Solicitante": s.solicitante_dni,
        "Nombres Solicitante": s.solicitante_nombres,
        "Apellidos Solicitante": s.solicitante_apellidos,
        "Fecha Solicitud": new Date(s.fecha_solicitud).toLocaleString(),
        "Observaciones": s.observaciones || "",
        "Atendido por": s.usuario_atencion_nombres ? `${s.usuario_atencion_nombres} ${s.usuario_atencion_apellidos}` : "PENDIENTE"
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitudes");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const exportarAuditoriaExcel = async (filtros) => {
    const result = await auditoriaService.listarAuditoria({ ...filtros, limit: 100000, offset: 0 });
    const data = result.data;

    const rows = data.map(log => ({
        "ID": log.id,
        "Usuario": log.username || "SISTEMA",
        "Módulo": log.tabla_afectada,
        "Operación": log.operacion,
        "Descripción": log.descripcion,
        "Ref. ID": log.registro_id || "",
        "Fecha": new Date(log.fecha).toLocaleString(),
        "IP": log.ip || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};
