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
import { serveLogo } from "./controllers/configuracion.controller.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { auditMiddleware } from "./middlewares/auditMiddleware.js";
import { obtenerIpCliente } from "./utils/ipUtils.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Confiar en el proxy inverso (Nginx / Docker / Cloudflare) para resolver la IP real del cliente
app.set("trust proxy", true);

// Middleware para fijar la IP real del cliente en la request
app.use((req, res, next) => {
    req.clientIp = obtenerIpCliente(req);
    next();
});

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
        if (!origin) {
            return callback(null, true);
        }
        
        // Permitir localhost o IPs de red local (LAN) en desarrollo
        const esLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);
        const esRedLocal = process.env.NODE_ENV !== "production" && 
            /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
        
        if (esLocalhost || esRedLocal || allowedOrigins.includes(origin)) {
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

// Logos institucionales personalizados (cualquier extensión válida).
// Un 404 permite que Nginx use como respaldo los SVG incluidos en el Frontend.
app.get(
    [
        "/Logo_MDUnion.svg", "/Logo_MDUnion.png", "/Logo_MDUnion.jpg", "/Logo_MDUnion.jpeg",
        "/Logo_blanco.svg",  "/Logo_blanco.png",  "/Logo_blanco.jpg",  "/Logo_blanco.jpeg",
    ],
    serveLogo,
);

// Servir carpetas estáticas (Documentos subidos sin caché para los logos)
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filepath) => {
        if (filepath.includes("configuracion") || filepath.includes("logos")) {
            res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
            res.set("Pragma", "no-cache");
            res.set("Expires", "0");
        }
    }
}));

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
    const status = { status: "ok", clientIp: req.clientIp, timestamp: new Date().toISOString(), services: {} };

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

