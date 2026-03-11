import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool, types } = pkg;

// Configurar parser de fechas para evitar problemas de zona horaria con PostgreSQL
// 1082: DATE, 1114: TIMESTAMP, 1184: TIMESTAMPTZ
const parseFn = (val) => val; 
types.setTypeParser(1082, parseFn); // DATE
types.setTypeParser(1114, parseFn); // TIMESTAMP
types.setTypeParser(1184, parseFn); // TIMESTAMPTZ

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("connect", () => {
  console.log("🟢 Conectado a PostgreSQL");
});

// 🔍 prueba real de conexión (puedes quitar luego)
pool.query("SELECT 1")
  .then(() => console.log("✅ PostgreSQL OK"))
  .catch(err => console.error("❌ PostgreSQL ERROR:", err.message));
  
export { pool };
