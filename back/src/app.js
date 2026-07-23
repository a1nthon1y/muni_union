import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import personasRoutes from "./routes/personas.routes.js";
import actasRoutes from "./routes/actas.routes.js";
import solicitudesRoutes from "./routes/solicitudes.routes.js";
import documentosRoutes from "./routes/documentos.routes.js";
import auditoriaRoutes from "./routes/auditoria.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
import importacionRoutes from "./routes/importacion.routes.js";
import verificarRoutes from "./routes/verificar.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import configuracionRoutes from "./routes/configuracion.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { auditMiddleware } from "./middlewares/auditMiddleware.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cabeceras de seguridad HTTP (desactivar CSP solo en /api/docs para que Swagger UI cargue)
app.use((req, res, next) => {
    if (req.path.startsWith("/api/docs")) return next();
    helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })(req, res, next);
});

// CORS: solo permite el origen del frontend
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origin (Postman, curl, mismo servidor)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origen no permitido → ${origin}`));
        }
    },
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir carpetas estáticas (Documentos subidos)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Verificación pública de constancias — sin auth, antes de la auditoría
app.use("/api/verificar", verificarRoutes);

// Auditoría automática — registra toda acción autenticada (GET + writes no marcados)
app.use("/api", auditMiddleware);

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
app.use("/api/backup",     backupRoutes);
app.use("/api/configuracion", configuracionRoutes);
// Documentación API (solo en desarrollo)
if (process.env.NODE_ENV !== "production") {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "API Registro Civil",
        swaggerOptions: { persistAuthorization: true },
    }));
}

// Ruta test
app.get("/", (req, res) => {
    res.json({ message: "API Registro Civil - La Unión", docs: "/api/docs" });
});

// ── Health Check — usado por Docker y monitoreo de infraestructura ──
app.get("/api/health", async (req, res) => {
    const status = { status: "ok", timestamp: new Date().toISOString(), services: {} };

    // Verificar PostgreSQL
    try {
        const { pool } = await import("./config/db.js");
        await pool.query("SELECT 1");
        status.services.db = "ok";
    } catch {
        status.services.db = "error";
        status.status = "degraded";
    }

    const httpStatus = status.status === "ok" ? 200 : 503;
    res.status(httpStatus).json(status);
});

// Manejador global de errores no controlados (debe ir al final de todo)
app.use(errorHandler);

export default app;

