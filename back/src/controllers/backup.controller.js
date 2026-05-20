import { exec, spawn } from "child_process";
import { promisify } from "util";
import { pool } from "../config/db.js";

const execAsync = promisify(exec);

/** Comprueba si pg_dump está disponible en el servidor */
async function pgDumpDisponible() {
    try {
        await execAsync("pg_dump --version");
        return true;
    } catch {
        return false;
    }
}

/** Extrae los parámetros de conexión del entorno */
function obtenerParamsDB() {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host:     url.hostname,
            port:     url.port || "5432",
            user:     url.username,
            password: decodeURIComponent(url.password),
            database: url.pathname.replace("/", ""),
            ssl:      url.searchParams.get("sslmode") === "require",
        };
    }
    return {
        host:     process.env.DB_HOST     || "localhost",
        port:     process.env.DB_PORT     || "5432",
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl:      process.env.DB_SSL === "true",
    };
}

/** Escapa un valor para usarlo en un INSERT SQL */
function escaparValor(v) {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "number")  return v;
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (v instanceof Date)      return `'${v.toISOString()}'`;
    if (typeof v === "object")  return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
    return `'${String(v).replace(/'/g, "''")}'`;
}

/**
 * GET /api/backup/download
 * Descarga un backup SQL completo de la base de datos.
 * - En servidores on-premise usa pg_dump (schema + datos completos).
 * - Fallback: exporta datos como INSERT statements via Node.js.
 */
export const descargarBackup = async (req, res) => {
    const fecha     = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename  = `backup_muni_union_${fecha}.sql`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    const tienePgDump = await pgDumpDisponible();

    if (tienePgDump) {
        // ── Método principal: pg_dump (on-premise) ─────────────────────
        const db   = obtenerParamsDB();
        const args = [
            "-h", db.host,
            "-p", db.port,
            "-U", db.user,
            "-d", db.database,
            "--no-password",
            "--format=plain",
            "--encoding=UTF8",
            "--no-owner",
            "--no-acl",
            "--schema=public",
        ];

        const env = { ...process.env, PGPASSWORD: db.password };
        if (db.ssl) env.PGSSLMODE = "require";

        const dump = spawn("pg_dump", args, { env });

        // Cabecera informativa antes del dump
        const header = [
            `-- ================================================================`,
            `-- Backup — Municipalidad Distrital de La Unión`,
            `-- Sistema de Registro Civil (STDU v1.0)`,
            `-- Generado: ${new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })}`,
            `-- Generado por: pg_dump`,
            `-- ================================================================\n`,
        ].join("\n");
        res.write(header);

        dump.stdout.pipe(res);

        dump.stderr.on("data", (data) => {
            console.error("[backup] pg_dump stderr:", data.toString());
        });

        dump.on("error", (err) => {
            console.error("[backup] pg_dump error:", err.message);
            if (!res.headersSent) {
                res.status(500).json({ message: "Error al generar backup con pg_dump" });
            }
        });

        dump.on("close", (code) => {
            if (code !== 0) console.error(`[backup] pg_dump terminó con código ${code}`);
        });

    } else {
        // ── Fallback: exportación programática vía Node.js ─────────────
        // Útil en desarrollo contra Neon o si pg_dump no está instalado.
        try {
            const tablesRes = await pool.query(`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_type   = 'BASE TABLE'
                ORDER BY table_name
            `);

            const tablas  = tablesRes.rows.map((r) => r.table_name);
            const lineas  = [];
            const ahora   = new Date();

            lineas.push(`-- ================================================================`);
            lineas.push(`-- Backup — Municipalidad Distrital de La Unión`);
            lineas.push(`-- Sistema de Registro Civil (STDU v1.0)`);
            lineas.push(`-- Generado: ${ahora.toLocaleString("es-PE", { timeZone: "America/Lima" })}`);
            lineas.push(`-- Método: exportación programática (solo datos)`);
            lineas.push(`-- NOTA: Para restaurar, ejecute las migraciones primero.`);
            lineas.push(`-- ================================================================\n`);
            lineas.push(`SET client_encoding = 'UTF8';`);
            lineas.push(`SET standard_conforming_strings = on;\n`);

            for (const tabla of tablas) {
                const dataRes = await pool.query(`SELECT * FROM "${tabla}"`);
                if (dataRes.rows.length === 0) {
                    lineas.push(`-- Tabla: ${tabla} (vacía)\n`);
                    continue;
                }

                const cols = dataRes.fields.map((f) => `"${f.name}"`).join(", ");
                lineas.push(`-- ── Tabla: ${tabla} (${dataRes.rows.length} registros) ──`);

                for (const row of dataRes.rows) {
                    const vals = dataRes.fields
                        .map((f) => escaparValor(row[f.name]))
                        .join(", ");
                    lineas.push(`INSERT INTO "${tabla}" (${cols}) VALUES (${vals});`);
                }
                lineas.push("");
            }

            res.end(lineas.join("\n"));
        } catch (err) {
            console.error("[backup] Error en exportación programática:", err.message);
            if (!res.headersSent) {
                res.status(500).json({ message: "Error al generar backup" });
            }
        }
    }
};

/**
 * GET /api/backup/info
 * Devuelve metadata sobre la BD para mostrar en el panel de admin.
 */
export const infoBackup = async (req, res) => {
    try {
        const [tablesRes, sizeRes, versionRes] = await Promise.all([
            pool.query(`
                SELECT COUNT(*) AS total
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            `),
            pool.query(`
                SELECT pg_size_pretty(pg_database_size(current_database())) AS tamanio
            `),
            pool.query(`SELECT version() AS version`),
        ]);

        const tienePgDump = await pgDumpDisponible();

        res.json({
            totalTablas:  parseInt(tablesRes.rows[0].total),
            tamanio:      sizeRes.rows[0].tamanio,
            version:      versionRes.rows[0].version.split(" ").slice(0, 2).join(" "),
            metodBackup:  tienePgDump ? "pg_dump (completo)" : "Programático (solo datos)",
            onPremise:    tienePgDump,
        });
    } catch (err) {
        console.error("[backup] Error en infoBackup:", err.message);
        res.status(500).json({ message: "Error al obtener información" });
    }
};
