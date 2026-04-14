import { pool } from "../config/db.js";
import fs from "fs";
import crypto from "crypto";
import logger from "../config/logger.js";

const TIPOS_ACTA_VALIDOS = new Set(["NACIMIENTO", "MATRIMONIO", "DEFUNCION"]);

// Construye el número de acta: NAC-L1-45
const buildNumeroActa = (tipo, libro, numero) => {
    const prefixes = { NACIMIENTO: "NAC", MATRIMONIO: "MAT", DEFUNCION: "DEF" };
    const prefix = prefixes[tipo?.toUpperCase()] || "ACT";
    return `${prefix}-L${libro}-${numero}`.toUpperCase();
};

// Normaliza fechas (Excel serial, DD/MM/YYYY, YYYY-MM-DD)
const normalizarFecha = (valor) => {
    if (!valor || valor === "") return null;
    const strVal = String(valor).trim();

    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(strVal)) return strVal.replace(/\//g, "-");

    const serial = parseFloat(strVal);
    if (!isNaN(serial) && serial > 1000) {
        const date = new Date((serial - 25569) * 86400 * 1000);
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    }

    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(strVal)) {
        const parts = strVal.split(/[\/\-]/);
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }

    return null;
};

// Carga el catálogo tipos_documento una sola vez por lote
const cargarTiposDocumento = async (client) => {
    const { rows } = await client.query("SELECT id, UPPER(nombre) AS nombre FROM tipos_documento");
    const map = {};
    for (const r of rows) map[r.nombre] = r.id;
    // Aliases comunes
    map["P. NACIMIENTO"]      = map["PART. NACIMIENTO"] ?? map["P. NACIMIENTO"];
    map["PARTIDA NACIMIENTO"] = map["PART. NACIMIENTO"];
    map["PART. NAC"]          = map["PART. NACIMIENTO"];
    map["CARNET"]             = map["CARNET EXTR."];
    map["CE"]                 = map["CARNET EXTR."];
    return map;
};

const resolverTipoDocId = (tipoDocTexto, tiposMap) => {
    const upper = (tipoDocTexto || "DNI").trim().toUpperCase();
    return tiposMap[upper] ?? tiposMap["DNI"] ?? 1;
};

export const importarActasMasivo = async (filas, archivosMap, soloNombreMap, usuario_id) => {
    const resultados = [];
    const client = await pool.connect();

    // Cargar catálogo una sola vez
    const tiposDocMap = await cargarTiposDocumento(client);

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const rowNum = i + 1;
        let personaId = null;
        let actaId = null;

        try {
            await client.query("BEGIN");

            // ── Validar campos obligatorios ───────────────────────────────────
            const obligatorios = ["nombres", "apellido_paterno", "apellido_materno", "sexo", "tipo_acta", "fecha_acta"];
            const faltantes = obligatorios.filter(c => !fila[c] || fila[c] === "");

            const hasCui = fila.cui && String(fila.cui).trim() !== "";
            if (!hasCui) {
                if (!fila.libro      || String(fila.libro).trim()      === "") faltantes.push("libro");
                if (!fila.numero_acta || String(fila.numero_acta).trim() === "") faltantes.push("numero_acta");
            }

            if (faltantes.length > 0) throw new Error(`Campos obligatorios vacíos: ${faltantes.join(", ")}`);

            // ── Validar tipo_acta (ENUM) ──────────────────────────────────────
            const tipoActa = fila.tipo_acta.trim().toUpperCase();
            if (!TIPOS_ACTA_VALIDOS.has(tipoActa)) {
                throw new Error(`tipo_acta inválido: "${fila.tipo_acta}". Solo se acepta NACIMIENTO, MATRIMONIO o DEFUNCION.`);
            }

            // ── Normalizar fechas ─────────────────────────────────────────────
            const fechaNacimiento = normalizarFecha(fila.fecha_nacimiento);
            const fechaActa = normalizarFecha(fila.fecha_acta);
            if (!fechaActa) throw new Error(`fecha_acta inválida: "${fila.fecha_acta}". Use formato AAAA-MM-DD`);

            let anioActa = parseInt(fila.anio);
            if (isNaN(anioActa) && fechaActa) anioActa = parseInt(fechaActa.substring(0, 4));
            if (isNaN(anioActa)) throw new Error(`anio inválido: "${fila.anio}"`);

            // ── Número de acta ────────────────────────────────────────────────
            const fullNumeroActa = hasCui
                ? String(fila.cui).trim().toUpperCase()
                : buildNumeroActa(tipoActa, fila.libro, fila.numero_acta);

            // ── 1. Buscar o crear persona principal ───────────────────────────
            if (fila.dni?.trim()) {
                const r = await client.query(
                    "SELECT id FROM personas WHERE dni = $1 AND fecha_eliminacion IS NULL LIMIT 1",
                    [fila.dni.trim()]
                );
                if (r.rows.length > 0) personaId = r.rows[0].id;
            }

            if (!personaId) {
                const r = await client.query(
                    `SELECT id FROM personas
                     WHERE UPPER(nombres) = UPPER($1)
                       AND UPPER(apellido_paterno) = UPPER($2)
                       AND UPPER(apellido_materno) = UPPER($3)
                       AND fecha_eliminacion IS NULL LIMIT 1`,
                    [fila.nombres.trim(), fila.apellido_paterno.trim(), fila.apellido_materno.trim()]
                );
                if (r.rows.length > 0) personaId = r.rows[0].id;
            }

            if (!personaId) {
                // ─── CORRECCIÓN: usar tipo_documento_id (FK) en lugar del texto ───
                const tipoDocId = resolverTipoDocId(fila.tipo_documento, tiposDocMap);

                const r = await client.query(
                    `INSERT INTO personas
                       (dni, tipo_documento_id, nombres, apellido_paterno, apellido_materno,
                        sexo, fecha_nacimiento, telefono, observaciones, usuario_registro)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                     RETURNING id`,
                    [
                        fila.dni?.trim() || null,
                        tipoDocId,
                        fila.nombres.trim().toUpperCase(),
                        fila.apellido_paterno.trim().toUpperCase(),
                        fila.apellido_materno.trim().toUpperCase(),
                        fila.sexo?.trim().substring(0, 1).toUpperCase() || "M",
                        fechaNacimiento,
                        fila.telefono?.trim() || null,
                        fila.persona_observaciones?.trim() || null,
                        usuario_id,
                    ]
                );
                personaId = r.rows[0].id;
            }

            // ── 2. Persona secundaria para MATRIMONIO ─────────────────────────
            let personaSecundariaId = null;
            if (tipoActa === "MATRIMONIO") {
                const cn = fila.conyuge_nombres?.trim();
                const cp = fila.conyuge_apellido_paterno?.trim();
                const cm = fila.conyuge_apellido_materno?.trim();

                if (cn && cp && cm) {
                    // Buscar por DNI del cónyuge
                    if (fila.conyuge_dni?.trim()) {
                        const r = await client.query(
                            "SELECT id FROM personas WHERE dni = $1 AND fecha_eliminacion IS NULL LIMIT 1",
                            [fila.conyuge_dni.trim()]
                        );
                        if (r.rows.length > 0) personaSecundariaId = r.rows[0].id;
                    }

                    // Buscar por nombre
                    if (!personaSecundariaId) {
                        const r = await client.query(
                            `SELECT id FROM personas
                             WHERE UPPER(nombres) = UPPER($1)
                               AND UPPER(apellido_paterno) = UPPER($2)
                               AND UPPER(apellido_materno) = UPPER($3)
                               AND fecha_eliminacion IS NULL LIMIT 1`,
                            [cn, cp, cm]
                        );
                        if (r.rows.length > 0) personaSecundariaId = r.rows[0].id;
                    }

                    // Crear cónyuge si no existe
                    if (!personaSecundariaId) {
                        const tipoDocConyugeId = resolverTipoDocId(fila.conyuge_tipo_documento, tiposDocMap);
                        const r = await client.query(
                            `INSERT INTO personas
                               (dni, tipo_documento_id, nombres, apellido_paterno, apellido_materno,
                                sexo, fecha_nacimiento, usuario_registro)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                             RETURNING id`,
                            [
                                fila.conyuge_dni?.trim() || null,
                                tipoDocConyugeId,
                                cn.toUpperCase(), cp.toUpperCase(), cm.toUpperCase(),
                                fila.conyuge_sexo?.trim().substring(0, 1).toUpperCase() || "F",
                                normalizarFecha(fila.conyuge_fecha_nacimiento),
                                usuario_id,
                            ]
                        );
                        personaSecundariaId = r.rows[0].id;
                    }
                } else {
                    logger.warn({ fila: rowNum }, "MATRIMONIO sin datos de cónyuge — se registra sin persona_secundaria_id");
                }
            }

            // ── 3. Verificar si el acta ya existe ─────────────────────────────
            const actaExistente = await client.query(
                `SELECT a.id,
                        EXISTS(SELECT 1 FROM documentos_digitales d
                               WHERE d.acta_id = a.id AND d.fecha_eliminacion IS NULL) AS tiene_documento
                 FROM actas a
                 WHERE a.numero_acta = $1 AND a.anio = $2 AND a.fecha_eliminacion IS NULL
                 LIMIT 1`,
                [fullNumeroActa, anioActa]
            );

            if (actaExistente.rows.length > 0) {
                const actaExistenteId = actaExistente.rows[0].id;
                const tieneDocumento  = actaExistente.rows[0].tiene_documento;

                const nombreArchivoOmit = fila.nombre_archivo_pdf?.trim();
                let archivoParaVincular = null;
                if (nombreArchivoOmit) {
                    const carpeta = fila.carpeta_ruta?.trim().replace(/\\/g, "/").replace(/\/$/, "");
                    const clave = carpeta ? `${carpeta}/${nombreArchivoOmit}` : null;
                    archivoParaVincular = (clave && archivosMap[clave]) || soloNombreMap[nombreArchivoOmit] || null;
                }

                if (!tieneDocumento && archivoParaVincular) {
                    let tipo = archivoParaVincular.mimetype;
                    if (tipo.includes("pdf")) tipo = "PDF";
                    else if (tipo.includes("image")) tipo = "IMG";
                    if (tipo.length > 10) tipo = tipo.substring(0, 10);

                    await client.query(
                        `INSERT INTO documentos_digitales
                           (acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_registro)
                         VALUES ($1,$2,$3,$4,$5,$6)`,
                        [
                            actaExistenteId,
                            archivoParaVincular.originalname, archivoParaVincular.path, tipo,
                            crypto.createHash("md5").update(fs.readFileSync(archivoParaVincular.path)).digest("hex"),
                            usuario_id,
                        ]
                    );
                    await client.query("COMMIT");
                    resultados.push({
                        fila: rowNum, estado: "OMITIDO_DOC", acta: fullNumeroActa,
                        persona: `${fila.apellido_paterno} ${fila.apellido_materno}, ${fila.nombres}`,
                        con_documento: true, acta_id: actaExistenteId,
                        mensaje: "Acta ya existía sin documento — se vinculó el PDF correctamente",
                    });
                } else {
                    await client.query("ROLLBACK");
                    resultados.push({
                        fila: rowNum, estado: "OMITIDO", acta: fullNumeroActa,
                        persona: `${fila.apellido_paterno} ${fila.apellido_materno}, ${fila.nombres}`,
                        con_documento: tieneDocumento, acta_id: actaExistenteId,
                        mensaje: tieneDocumento
                            ? "Acta ya registrada con documento — omitida"
                            : "Acta ya registrada sin documento (no se encontró PDF en el ZIP)",
                    });
                }
                continue;
            }

            // ── 4. Crear acta nueva ───────────────────────────────────────────
            const r = await client.query(
                `INSERT INTO actas
                   (tipo_acta, numero_acta, anio, persona_principal_id, persona_secundaria_id,
                    fecha_acta, observaciones, usuario_registro)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                 RETURNING id`,
                [
                    tipoActa, fullNumeroActa, anioActa, personaId, personaSecundariaId,
                    fechaActa, fila.acta_observaciones?.trim() || null, usuario_id,
                ]
            );
            actaId = r.rows[0].id;

            // ── 5. Vincular documento PDF ─────────────────────────────────────
            const nombreArchivo = fila.nombre_archivo_pdf?.trim();
            let archivoEncontrado = null;
            if (nombreArchivo) {
                const carpeta = fila.carpeta_ruta?.trim().replace(/\\/g, "/").replace(/\/$/, "");
                const clave = carpeta ? `${carpeta}/${nombreArchivo}` : null;
                archivoEncontrado = (clave && archivosMap[clave]) || soloNombreMap[nombreArchivo] || null;
            }

            if (archivoEncontrado) {
                let tipo = archivoEncontrado.mimetype;
                if (tipo.includes("pdf")) tipo = "PDF";
                else if (tipo.includes("image")) tipo = "IMG";
                if (tipo.length > 10) tipo = tipo.substring(0, 10);

                await client.query(
                    `INSERT INTO documentos_digitales
                       (acta_id, nombre_archivo, ruta_archivo, tipo_archivo, hash_archivo, usuario_registro)
                     VALUES ($1,$2,$3,$4,$5,$6)`,
                    [
                        actaId, archivoEncontrado.originalname, archivoEncontrado.path, tipo,
                        crypto.createHash("md5").update(fs.readFileSync(archivoEncontrado.path)).digest("hex"),
                        usuario_id,
                    ]
                );
            }

            await client.query("COMMIT");
            resultados.push({
                fila: rowNum, estado: "OK", acta: fullNumeroActa,
                persona: `${fila.apellido_paterno} ${fila.apellido_materno}, ${fila.nombres}`,
                con_documento: !!archivoEncontrado, persona_id: personaId, acta_id: actaId,
            });

        } catch (error) {
            await client.query("ROLLBACK");
            logger.error({ fila: rowNum, err: error }, "Error en importación masiva");
            resultados.push({
                fila: rowNum, estado: "ERROR",
                acta: fila.tipo_acta && fila.libro && fila.numero_acta
                    ? `${fila.tipo_acta}-L${fila.libro}-${fila.numero_acta}`
                    : `Fila ${rowNum}`,
                persona: `${fila.apellido_paterno || "?"} ${fila.apellido_materno || "?"}, ${fila.nombres || "?"}`,
                error: error.message, con_documento: false,
            });
        }
    }

    client.release();
    return resultados;
};
