/**
 * Servidor Principal Simplificado - Portal de Auditorías Técnicas
 * Versión sin servicios externos para testing inicial
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");

// Middleware personalizado
const { asyncHandler } = require("./shared/middleware/error-handler");
const { requestLogger } = require("./shared/middleware/request-logger");

// Variables de entorno
const {
  PORT = 3001,
  NODE_ENV = "development",
  CORS_ORIGIN = "http://localhost:3000",
  RATE_LIMIT_WINDOW = 15,
  RATE_LIMIT_MAX = 100,
} = process.env;

// Crear aplicación Express
const app = express();

console.log(
  "🚀 Iniciando Portal de Auditorías Técnicas (modo simplificado)..."
);
console.log(`📍 Entorno: ${NODE_ENV}`);
console.log(`🌐 Puerto: ${PORT}`);

// === CONFIGURACIÓN DE MIDDLEWARES GLOBALES ===

// Seguridad básica
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// CORS configurado
app.use(
  cors({
    origin: NODE_ENV === "development" ? true : CORS_ORIGIN.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Compresión de respuestas
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW * 60 * 1000,
  max: RATE_LIMIT_MAX,
  message: {
    error: "Demasiadas solicitudes desde esta IP",
    retryAfter: RATE_LIMIT_WINDOW * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Parsing de body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging de requests
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware personalizado de logging
app.use(requestLogger);

// === HEALTH CHECK MEJORADO ===

app.get(
  "/api/health",
  asyncHandler(async (req, res) => {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      version: "1.0.0",
      services: {},
    };

    // Test servicios externos (sin bloquear)
    try {
      const { testConnection } = require("./config/database");
      await testConnection();
      health.services.database = "connected";
    } catch (error) {
      health.services.database = "disconnected";
      health.status = "degraded";
      console.log("⚠️  Base de datos no disponible (OK para testing inicial)");
    }

    try {
      const { testConnections } = require("./config/redis");
      const redisResults = await testConnections();
      health.services.redis = redisResults.every(
        (r) => r.status === "connected"
      )
        ? "connected"
        : "partial";
    } catch (error) {
      health.services.redis = "disconnected";
      console.log("⚠️  Redis no disponible (OK para testing inicial)");
    }

    try {
      const { checkOllamaHealth } = require("./config/ollama");
      const ollamaHealth = await checkOllamaHealth();
      health.services.ollama = ollamaHealth.status;
      health.services.ollama_models = ollamaHealth.available_models || [];
    } catch (error) {
      health.services.ollama = "unavailable";
      console.log("⚠️  Ollama no disponible (se usará modo fallback)");
    }

    res.status(health.status === "ok" ? 200 : 503).json(health);
  })
);

// === REGISTRO DE RUTAS ===
app.use("/api/ia", require("./domains/ia/ia.routes"));
// Rutas IA (principal funcionalidad)
try {
  const iaRoutes = require("./domains/ia/ia.routes");
  app.use("/api/ia", iaRoutes);
  console.log("✅ Rutas IA registradas exitosamente");
} catch (error) {
  console.error("❌ Error registrando rutas IA:", error.message);
}

// === RUTAS DE ARCHIVOS ESTÁTICOS ===

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, "uploads");
const fs = require("fs");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Directorio uploads creado");
}

// Servir archivos de uploads
app.use("/uploads", express.static(uploadsDir));

// === MANEJO DE ERRORES ===

// Ruta no encontrada
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_endpoints: [
      "GET /api/health",
      "GET /api/ia/health",
      "GET /api/ia/metrics",
    ],
  });
});

// Error handler global
app.use((error, req, res, next) => {
  console.error("🚨 Error capturado:", error.message);

  res.status(500).json({
    error:
      NODE_ENV === "development" ? error.message : "Error interno del servidor",
    timestamp: new Date().toISOString(),
  });
});

// === INICIO DEL SERVIDOR ===

const server = app.listen(PORT, () => {
  console.log("\n✅ Servicios inicializados (modo simplificado)");
  console.log("🎯 Servidor listo para recibir solicitudes\n");

  console.log(
    `🌟 Portal de Auditorías Técnicas ejecutándose en puerto ${PORT}`
  );
  console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
  console.log(`💊 Health check: http://localhost:${PORT}/api/health`);

  if (NODE_ENV === "development") {
    console.log(
      `🎨 Frontend: http://localhost:3000 (cuando esté implementado)`
    );
  }

  console.log("\n📋 Endpoints disponibles:");
  console.log("   GET  /api/health - Estado del sistema");
  console.log("   GET  /api/ia/health - Estado de Ollama");
  console.log("   GET  /api/ia/metrics - Métricas de IA");
  console.log("   POST /api/ia/analyze/* - Análisis IA (en desarrollo)\n");
});

// === GESTIÓN DE SHUTDOWN GRACEFUL ===

const gracefulShutdown = () => {
  console.log("\n🔄 Iniciando shutdown graceful...");

  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection:", reason);
  gracefulShutdown();
});

module.exports = { app, server };
