import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import personasRoutes from "./routes/personas.routes.js";
import actasRoutes from "./routes/actas.routes.js";
import solicitudesRoutes from "./routes/solicitudes.routes.js";
import documentosRoutes from "./routes/documentos.routes.js";
import auditoriaRoutes from "./routes/auditoria.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
import importacionRoutes from "./routes/importacion.routes.js";
import ocrRoutes from "./routes/ocr.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Servir carpetas estáticas (Documentos subidos)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/personas", personasRoutes);
app.use("/api/actas", actasRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/documentos", documentosRoutes);
app.use("/api/auditoria", auditoriaRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/importacion", importacionRoutes);
app.use("/api/ocr", ocrRoutes);

// Ruta test
app.get("/", (req, res) => {
  res.json({ message: "API Unión Funcionando 🚀" });
});

export default app;

