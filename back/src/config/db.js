import pkg from "pg";
import logger from "./logger.js";

const { Pool, types } = pkg;

// Retornar fechas como strings para evitar conversiones de zona horaria
// 1082: DATE, 1114: TIMESTAMP, 1184: TIMESTAMPTZ
const passthrough = (val) => val;
types.setTypeParser(1082, passthrough);
types.setTypeParser(1114, passthrough);
types.setTypeParser(1184, passthrough);

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
});

pool.query("SELECT 1")
    .then(() => logger.info("PostgreSQL conectado"))
    .catch(err => logger.error({ err }, "PostgreSQL ERROR"));

export { pool };
