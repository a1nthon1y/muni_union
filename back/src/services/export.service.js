import * as actasService from "./actas.service.js";
import * as personasService from "./personas.service.js";
import * as solicitudesService from "./solicitudes.service.js";
import * as auditoriaService from "./auditoria.service.js";
import * as XLSX from "xlsx";

export const exportarActasExcel = async (filtros) => {
    // Obtenemos los datos sin paginación (limit muy alto)
    const result = await actasService.listarActas({ ...filtros, limit: 100000, page: 1 });
    const data = result.data;

    // Mapeamos a un formato amigable para Excel
    const rows = data.map(a => {
        const base = {
            "ID":             a.id,
            "Tipo de Acta":   a.tipo_acta,
            "Nro. Acta":      a.numero_acta,
            "Año":            a.anio,
            "DNI Titular":    a.dni,
            "Ap. Paterno":    a.apellido_paterno,
            "Ap. Materno":    a.apellido_materno,
            "Nombres":        a.nombres,
            "Fecha Acta":     a.fecha_acta ? new Date(a.fecha_acta).toLocaleDateString() : "",
            "Estado":         a.estado,
            "Observaciones":  a.observaciones || "",
            "Tiene Documento": a.tiene_documento ? "SÍ" : "NO",
            "Fecha Registro": new Date(a.fecha_registro).toLocaleString(),
        };
        // Columnas del cónyuge — solo se rellenan en matrimonios
        if (a.tipo_acta === "MATRIMONIO") {
            base["DNI Cónyuge"]    = a.p2_dni || "";
            base["Ap. Pat. Cónyuge"] = a.p2_apellido_paterno || "";
            base["Ap. Mat. Cónyuge"] = a.p2_apellido_materno || "";
            base["Nombres Cónyuge"]  = a.p2_nombres || "";
        }
        return base;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Actas");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const exportarPersonasExcel = async (filtros) => {
    const result = await personasService.listarPersonas({ ...filtros, limit: 100000, offset: 0 });
    const data = result.data;

    const rows = data.map(p => ({
        "ID": p.id,
        "DNI": p.dni || "NO REGISTRA",
        "Nombres": p.nombres,
        "Apellido Paterno": p.apellido_paterno,
        "Apellido Materno": p.apellido_materno,
        "Sexo": p.sexo === "M" ? "Masculino" : "Femenino",
        "Fecha Nac.": p.fecha_nacimiento ? new Date(p.fecha_nacimiento).toLocaleDateString() : "",
        "Teléfono": p.telefono || "",
        "Dirección": p.direccion || "",
        "Observaciones": p.observaciones || ""
    }));

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
