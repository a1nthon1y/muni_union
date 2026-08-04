import { pool } from "../config/db.js";
import fs from "fs";
import crypto from "crypto";
import logger from "../config/logger.js";
import {
    normalizarFechaPersona,
    resolverFechasPersona,
    FechaPersonaValidationError,
} from "./persona-fechas.service.js";

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

const normalizarFechaImportada = (valor, campo) => {
    if (valor === null || valor === undefined || valor === "") return null;

    const normalizada = normalizarFecha(valor);
    if (!normalizada) {
        throw new Error(`${campo} inválida: "${valor}". Use formato AAAA-MM-DD.`);
    }

    try {
        return normalizarFechaPersona(
            normalizada,
            campo.includes("fallecimiento")
                ? "fecha_fallecimiento"
                : "fecha_nacimiento",
        );
    } catch {
        throw new Error(`${campo} inválida: "${valor}". Use una fecha real en formato AAAA-MM-DD.`);
    }
};

// Carga el catálogo tipos_documento una sola vez por lote
const cargarTiposDocumento = async (client) => {
    const { rows } = await client.query("SELECT id, UPPER(nombre) AS nombre FROM tipos_documento");
    const map = {};
    for (const r of rows) map[r.nombre] = r.id;
    // Aliases — Partida de Nacimiento
    map["P. NACIMIENTO"]      = map["PART. NACIMIENTO"] ?? map["P. NACIMIENTO"];
    map["PARTIDA NACIMIENTO"] = map["PART. NACIMIENTO"];
    map["PART. NAC"]          = map["PART. NACIMIENTO"];
    // Aliases — Carnet de Extranjería
    map["CARNET"]             = map["CARNET EXTR."];
    map["CE"]                 = map["CARNET EXTR."];
    map["CARNET EXTRANJERIA"] = map["CARNET EXTR."];
    // Aliases — Libreta Electoral (documento peruano anterior al DNI)
    map["LIBRETA ELECTOR."]   = map["LIBRETA ELECTORAL"];
    map["LIBRETA ELECT."]     = map["LIBRETA ELECTORAL"];
    map["L.E."]               = map["LIBRETA ELECTORAL"];
    map["LE"]                 = map["LIBRETA ELECTORAL"];
    map["LIBRETA"]            = map["LIBRETA ELECTORAL"];
    // Sin documento
    map["SIN DOC"]            = map["SIN DOCUMENTO"];
    map["S/D"]                = map["SIN DOCUMENTO"];
    return map;
};

const resolverTipoDocId = (tipoDocTexto, tiposMap) => {
    const upper = (tipoDocTexto || "DNI").trim().toUpperCase();
    return tiposMap[upper] ?? tiposMap["DNI"] ?? 1;
};

// Límite por lote: suficiente para carga histórica real.
// Subir en múltiples lotes si se supera (el sistema omite duplicados automáticamente).
const MAX_FILAS = 30000;

export const importarActasMasivo = async (
    filas,
    archivosMap,
    soloNombreMap,
    usuario_id,
    db = pool,
) => {
    if (filas.length > MAX_FILAS) {
        throw new Error(`El archivo supera el límite de ${MAX_FILAS} filas por lote. Divídalo en archivos más pequeños y súbalos por separado — los duplicados se omiten automáticamente.`);
    }

    const resultados = [];
    const client = await db.connect();

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
            // sexo NO es obligatorio: si falta se usará "M" como default
            const obligatorios = ["nombres", "apellido_paterno", "apellido_materno", "tipo_acta", "fecha_acta"];
            const faltantes = obligatorios.filter(c => !fila[c] || fila[c] === "");

            const hasCui = fila.cui && String(fila.cui).trim() !== "";
            if (!hasCui) {
                if (!fila.libro      || String(fila.libro).trim()      === "") faltantes.push("libro");
                if (!fila.numero_acta || String(fila.numero_acta).trim() === "") faltantes.push("numero_acta");
            }

            if (faltantes.length > 0) throw new Error(`Campos obligatorios vacíos: ${faltantes.join(", ")}`);

            // ── Validar sexo (si se proporciona) ─────────────────────────────
            if (fila.sexo && !["M", "F"].includes(fila.sexo.trim().substring(0, 1).toUpperCase())) {
                throw new Error(`sexo inválido: "${fila.sexo}". Solo se acepta M o F.`);
            }

            // ── Validar tipo_acta (ENUM) ──────────────────────────────────────
            const tipoActa = fila.tipo_acta.trim().toUpperCase();
            if (!TIPOS_ACTA_VALIDOS.has(tipoActa)) {
                throw new Error(`tipo_acta inválido: "${fila.tipo_acta}". Solo se acepta NACIMIENTO, MATRIMONIO o DEFUNCION.`);
            }

            // ── Normalizar fechas ─────────────────────────────────────────────
            const fechaNacimiento = normalizarFechaImportada(
                fila.fecha_nacimiento,
                "fecha_nacimiento",
            );
            const fechaFallecimiento = normalizarFechaImportada(
                fila.fecha_fallecimiento,
                "fecha_fallecimiento",
            );
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
            const dniNuevo     = fila.dni?.trim() || null;
            const tipoDocId    = resolverTipoDocId(fila.tipo_documento, tiposDocMap);
            let personaEncontrada = null;

            // 1a. Buscar por DNI (coincidencia exacta — la más confiable)
            if (dniNuevo) {
                const r = await client.query(
                    `SELECT id, dni, tipo_documento_id,
                            fecha_nacimiento, fecha_fallecimiento
                     FROM personas
                     WHERE dni = $1 AND fecha_eliminacion IS NULL
                     LIMIT 1`,
                    [dniNuevo]
                );
                if (r.rows.length > 0) {
                    personaEncontrada = r.rows[0];
                    personaId = personaEncontrada.id;
                }
            }

            // 1b. Buscar por nombre completo (solo si no encontró por DNI)
            if (!personaId) {
                // Incluir fecha_nacimiento en la búsqueda si está disponible
                // para reducir falsos positivos por homonimia
                const params = [
                    fila.nombres.trim().toUpperCase(),
                    fila.apellido_paterno.trim().toUpperCase(),
                    fila.apellido_materno.trim().toUpperCase(),
                ];
                const fechaCond = fechaNacimiento
                    ? `AND (fecha_nacimiento = $4 OR fecha_nacimiento IS NULL)`
                    : "";
                if (fechaNacimiento) params.push(fechaNacimiento);

                const r = await client.query(
                    `SELECT id, dni, tipo_documento_id,
                            fecha_nacimiento, fecha_fallecimiento
                     FROM personas
                     WHERE UPPER(nombres)          = $1
                       AND UPPER(apellido_paterno) = $2
                       AND UPPER(apellido_materno) = $3
                       ${fechaCond}
                       AND fecha_eliminacion IS NULL
                     LIMIT 1`,
                    params
                );

                if (r.rows.length > 0) {
                    const encontrada = r.rows[0];

                    // ── Homonimia: mismos nombres pero DNIs distintos (ambos no vacíos)
                    // → son personas DIFERENTES → no reutilizar, crear nueva
                    if (dniNuevo && encontrada.dni && encontrada.dni !== dniNuevo) {
                        logger.warn(
                            { fila: rowNum, dniExistente: encontrada.dni, dniNuevo },
                            "Posible homonimia — mismos nombres, DNI diferente → se crea persona nueva"
                        );
                        // personaId sigue null → se creará abajo
                    } else {
                        personaEncontrada = encontrada;
                        personaId = encontrada.id;
                    }
                }
            }

            if (personaId && personaEncontrada) {
                const cambiosFechas = {};
                if (fechaNacimiento) cambiosFechas.fecha_nacimiento = fechaNacimiento;
                if (fechaFallecimiento) cambiosFechas.fecha_fallecimiento = fechaFallecimiento;

                let fechas;
                try {
                    fechas = resolverFechasPersona(personaEncontrada, cambiosFechas);
                } catch (e) {
                    if (e instanceof FechaPersonaValidationError) {
                        // Conflicto de fechas con datos ya guardados en BD
                        // (homonimia o dato histórico inconsistente) — se conservan
                        // las fechas existentes y se continúa vinculando el acta.
                        logger.warn(
                            { fila: rowNum, personaId, err: e.message },
                            "Conflicto de fechas al actualizar persona existente — se conservan fechas actuales"
                        );
                        fechas = {
                            fecha_nacimiento:    personaEncontrada.fecha_nacimiento    ?? null,
                            fecha_fallecimiento: personaEncontrada.fecha_fallecimiento ?? null,
                        };
                    } else {
                        throw e;
                    }
                }

                await client.query(
                    `UPDATE personas SET
                        dni                 = COALESCE($1, dni),
                        tipo_documento_id   = CASE WHEN $1 IS NOT NULL THEN $2 ELSE tipo_documento_id END,
                        fecha_fallecimiento = $3,
                        fecha_nacimiento    = $4
                     WHERE id = $5`,
                    [
                        dniNuevo,
                        tipoDocId,
                        fechas.fecha_fallecimiento,
                        fechas.fecha_nacimiento,
                        personaId,
                    ]
                );
                logger.info(
                    { fila: rowNum, personaId, dniNuevo, fechaFallecimiento },
                    "Datos actualizados (DNI, fechas) para persona existente"
                );
            }

            // 1c. Crear persona nueva (no encontrada, o homonimia detectada)
            if (!personaId) {
                let fechasNuevaPersona;
                try {
                    fechasNuevaPersona = resolverFechasPersona(null, {
                        fecha_nacimiento: fechaNacimiento,
                        fecha_fallecimiento: fechaFallecimiento,
                    });
                } catch (e) {
                    if (e instanceof FechaPersonaValidationError) {
                        // Las fechas del Excel se contradicen entre sí — se guarda
                        // solo la fecha de nacimiento y se descarta el fallecimiento.
                        logger.warn(
                            { fila: rowNum, err: e.message },
                            "Conflicto de fechas en persona nueva — se omite fecha_fallecimiento"
                        );
                        fechasNuevaPersona = resolverFechasPersona(null, {
                            fecha_nacimiento: fechaNacimiento,
                            fecha_fallecimiento: null,
                        });
                    } else {
                        throw e;
                    }
                }

                const r = await client.query(
                    `INSERT INTO personas
                       (dni, tipo_documento_id, nombres, apellido_paterno, apellido_materno,
                        sexo, fecha_nacimiento, fecha_fallecimiento, telefono, observaciones, usuario_registro)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                     RETURNING id`,
                    [
                        dniNuevo,
                        tipoDocId,
                        fila.nombres.trim().toUpperCase(),
                        fila.apellido_paterno.trim().toUpperCase(),
                        fila.apellido_materno.trim().toUpperCase(),
                        fila.sexo?.trim().substring(0, 1).toUpperCase() || "M",
                        fechasNuevaPersona.fecha_nacimiento,
                        fechasNuevaPersona.fecha_fallecimiento,
                        fila.telefono?.trim() || null,
                        fila.persona_observaciones?.trim() || null,
                        usuario_id,
                    ]
                );
                personaId = r.rows[0].id;
            }

            // ── 2. Persona secundaria para MATRIMONIO ─────────────────────────
            let personaSecundariaId = null;
            let personaSecundariaEncontrada = null;
            if (tipoActa === "MATRIMONIO") {
                const cn = fila.conyuge_nombres?.trim();
                const cp = fila.conyuge_apellido_paterno?.trim();
                const cm = fila.conyuge_apellido_materno?.trim();

                if (cn && cp && cm) {
                    // Buscar por DNI del cónyuge
                    if (fila.conyuge_dni?.trim()) {
                        const r = await client.query(
                            `SELECT id, fecha_nacimiento, fecha_fallecimiento
                             FROM personas
                             WHERE dni = $1 AND fecha_eliminacion IS NULL
                             LIMIT 1`,
                            [fila.conyuge_dni.trim()]
                        );
                        if (r.rows.length > 0) {
                            personaSecundariaEncontrada = r.rows[0];
                            personaSecundariaId = personaSecundariaEncontrada.id;
                        }
                    }

                    // Buscar por nombre
                    if (!personaSecundariaId) {
                        const r = await client.query(
                            `SELECT id, fecha_nacimiento, fecha_fallecimiento
                             FROM personas
                             WHERE UPPER(nombres) = UPPER($1)
                               AND UPPER(apellido_paterno) = UPPER($2)
                               AND UPPER(apellido_materno) = UPPER($3)
                               AND fecha_eliminacion IS NULL LIMIT 1`,
                            [cn, cp, cm]
                        );
                        if (r.rows.length > 0) {
                            personaSecundariaEncontrada = r.rows[0];
                            personaSecundariaId = personaSecundariaEncontrada.id;
                        }
                    }

                    const conyugeFallecimiento = normalizarFechaImportada(
                        fila.conyuge_fecha_fallecimiento,
                        "conyuge_fecha_fallecimiento",
                    );
                    const conyugeNacimiento = normalizarFechaImportada(
                        fila.conyuge_fecha_nacimiento,
                        "conyuge_fecha_nacimiento",
                    );

                    // Crear cónyuge si no existe
                    if (!personaSecundariaId) {
                        const tipoDocConyugeId = resolverTipoDocId(fila.conyuge_tipo_documento, tiposDocMap);
                        let fechasConyuge;
                        try {
                            fechasConyuge = resolverFechasPersona(null, {
                                fecha_nacimiento: conyugeNacimiento,
                                fecha_fallecimiento: conyugeFallecimiento,
                            });
                        } catch (e) {
                            if (e instanceof FechaPersonaValidationError) {
                                logger.warn(
                                    { fila: rowNum, err: e.message },
                                    "Conflicto de fechas en cónyuge nuevo — se omite fecha_fallecimiento"
                                );
                                fechasConyuge = resolverFechasPersona(null, {
                                    fecha_nacimiento: conyugeNacimiento,
                                    fecha_fallecimiento: null,
                                });
                            } else {
                                throw e;
                            }
                        }

                        const r = await client.query(
                            `INSERT INTO personas
                               (dni, tipo_documento_id, nombres, apellido_paterno, apellido_materno,
                                sexo, fecha_nacimiento, fecha_fallecimiento, usuario_registro)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                             RETURNING id`,
                            [
                                fila.conyuge_dni?.trim() || null,
                                tipoDocConyugeId,
                                cn.toUpperCase(), cp.toUpperCase(), cm.toUpperCase(),
                                fila.conyuge_sexo?.trim().substring(0, 1).toUpperCase() || "F",
                                fechasConyuge.fecha_nacimiento,
                                fechasConyuge.fecha_fallecimiento,
                                usuario_id,
                            ]
                        );
                        personaSecundariaId = r.rows[0].id;
                    } else {
                        // ── Actualizar DNI y fechas del cónyuge si la fila los trae y ya existía
                        const tipoDocConyugeId = resolverTipoDocId(fila.conyuge_tipo_documento, tiposDocMap);
                        const cambiosFechas = {};
                        if (conyugeNacimiento) cambiosFechas.fecha_nacimiento = conyugeNacimiento;
                        if (conyugeFallecimiento) cambiosFechas.fecha_fallecimiento = conyugeFallecimiento;

                        let fechasConyuge;
                        try {
                            fechasConyuge = resolverFechasPersona(
                                personaSecundariaEncontrada,
                                cambiosFechas,
                            );
                        } catch (e) {
                            if (e instanceof FechaPersonaValidationError) {
                                logger.warn(
                                    { fila: rowNum, err: e.message },
                                    "Conflicto de fechas al actualizar cónyuge existente — se conservan fechas actuales"
                                );
                                fechasConyuge = {
                                    fecha_nacimiento:    personaSecundariaEncontrada.fecha_nacimiento    ?? null,
                                    fecha_fallecimiento: personaSecundariaEncontrada.fecha_fallecimiento ?? null,
                                };
                            } else {
                                throw e;
                            }
                        }

                        await client.query(
                            `UPDATE personas SET
                                dni                 = COALESCE($1, dni),
                                tipo_documento_id   = CASE WHEN $1 IS NOT NULL THEN $2 ELSE tipo_documento_id END,
                                fecha_fallecimiento = $3,
                                fecha_nacimiento    = $4
                             WHERE id = $5`,
                            [
                                fila.conyuge_dni?.trim() || null,
                                tipoDocConyugeId,
                                fechasConyuge.fecha_fallecimiento,
                                fechasConyuge.fecha_nacimiento,
                                personaSecundariaId,
                            ]
                        );
                    }
                } else {
                    throw new Error(
                        "MATRIMONIO requiere datos del cónyuge (nombres, apellido_paterno, apellido_materno). Completa las columnas conyuge_*."
                    );
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

            // Convertir errores técnicos de BD a mensajes legibles
            let mensajeError = error.message;
            if (error.constraint === "chk_matrimonio_segunda_persona") {
                mensajeError = "MATRIMONIO requiere datos del cónyuge. Completa las columnas conyuge_*.";
            } else if (error.code === "23505") {
                mensajeError = "Registro duplicado detectado por la base de datos.";
            }

            resultados.push({
                fila: rowNum, estado: "ERROR",
                acta: fila.tipo_acta && fila.libro && fila.numero_acta
                    ? `${fila.tipo_acta}-L${fila.libro}-${fila.numero_acta}`
                    : `Fila ${rowNum}`,
                persona: `${fila.apellido_paterno || "?"} ${fila.apellido_materno || "?"}, ${fila.nombres || "?"}`,
                error: mensajeError, con_documento: false,
            });
        }
    }

    client.release();
    return resultados;
};
