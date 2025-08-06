// PORTAL DE AUDITORÍAS TÉCNICAS - SERVIDOR CON BULLMQ INTEGRADO

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

console.log("🚀 Iniciando Portal de Auditorías Técnicas - Servidor con BullMQ...");

// ===== CONFIGURACIÓN BÁSICA =====
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging middleware básico
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// ===== IMPORTACIÓN SEGURA DE MÓDULOS =====
let sequelize = null;
let redisClients = null;
let bullmqConfig = null;

// Variables para rutas
let authRoutes = null;
let auditoriasRoutes = null;
let etlRoutes = null;
let iaRoutes = null;
let notificacionesRoutes = null;
let chatRoutes = null;
let dashboardsRoutes = null;

// Intentar cargar configuraciones
try {
  const dbConfig = require("./config/database");
  sequelize = dbConfig.sequelize;
  console.log("✅ Configuración de base de datos cargada");
} catch (error) {
  console.warn("⚠️  Base de datos no disponible:", error.message);
}

try {
  redisClients = require("./config/redis");
  console.log("✅ Configuración de Redis cargada");
} catch (error) {
  console.warn("⚠️  Redis no disponible:", error.message);
}

try {
  bullmqConfig = require("./config/bullmq");
  console.log("✅ Configuración de BullMQ cargada");
} catch (error) {
  console.warn("⚠️  BullMQ no disponible:", error.message);
}

// ===== INICIALIZACIÓN DE BULLMQ =====
let bullmqInitialized = false;

async function initializeBullMQ() {
  if (!bullmqConfig || !redisClients) {
    console.warn("⚠️  BullMQ o Redis no disponibles, omitiendo inicialización");
    return false;
  }

  try {
    console.log("🔄 Inicializando sistema BullMQ...");
    
    // Probar conexiones Redis
    await redisClients.testConnections();
    
    // Inicializar colas
    await bullmqConfig.initializeQueues();
    
    // Crear workers
    await bullmqConfig.createWorkers();
    
    // Configurar jobs programados
    await bullmqConfig.setupScheduledJobs();
    
    bullmqInitialized = true;
    console.log("🎉 BullMQ inicializado exitosamente");
    return true;
    
  } catch (error) {
    console.error("❌ Error inicializando BullMQ:", error.message);
    bullmqInitialized = false;
    return false;
  }
}

// Cargar rutas de forma segura
try {
  authRoutes = require("./domains/auth/auth.routes");
  console.log("✅ Rutas de auth cargadas");
} catch (error) {
  console.warn("⚠️  Rutas de auth no disponibles, creando placeholder");
  authRoutes = express.Router();
  authRoutes.get("/status", (req, res) => {
    res.json({ status: "Auth module loading...", timestamp: new Date().toISOString() });
  });
}

try {
  auditoriasRoutes = require("./domains/auditorias/auditorias.routes");
  console.log("✅ Rutas de auditorías cargadas");
} catch (error) {
  console.warn("⚠️  Rutas de auditorías no disponibles, creando placeholder");
  auditoriasRoutes = express.Router();
  auditoriasRoutes.get("/", (req, res) => {
    res.json({ 
      message: "Auditorias module loading...", 
      auditorias: [],
      timestamp: new Date().toISOString()
    });
  });
}

try {
  etlRoutes = require("./domains/etl/etl.routes");
  console.log("✅ Rutas ETL cargadas");
} catch (error) {
  console.warn("⚠️  Rutas ETL no disponibles, creando placeholder");
  etlRoutes = express.Router();
  etlRoutes.get("/status", (req, res) => {
    res.json({ status: "ETL module loading...", timestamp: new Date().toISOString() });
  });
}

try {
  iaRoutes = require("./domains/ia/ia.routes");
  console.log("✅ Rutas IA cargadas");
} catch (error) {
  console.warn("⚠️  Rutas IA no disponibles, creando placeholder");
  iaRoutes = express.Router();
  iaRoutes.get("/health", (req, res) => {
    res.json({ status: "IA module loading...", timestamp: new Date().toISOString() });
  });
}

try {
  notificacionesRoutes = require("./domains/notificaciones/notificaciones.routes");
  console.log("✅ Rutas de notificaciones cargadas");
} catch (error) {
  console.warn("⚠️  Rutas de notificaciones no disponibles, creando placeholder");
  notificacionesRoutes = express.Router();
  notificacionesRoutes.get("/", (req, res) => {
    res.json({ status: "Notifications module loading...", data: [], timestamp: new Date().toISOString() });
  });
}

try {
  chatRoutes = require("./domains/chat/chat.routes");
  console.log("✅ Rutas de chat cargadas");
} catch (error) {
  console.warn("⚠️  Rutas de chat no disponibles, creando placeholder");
  chatRoutes = express.Router();
  chatRoutes.get("/health", (req, res) => {
    res.json({ status: "Chat module loading...", timestamp: new Date().toISOString() });
  });
}

try {
  dashboardsRoutes = require("./domains/dashboards/dashboards.routes");
  console.log("✅ Rutas de dashboards cargadas");
} catch (error) {
  console.warn("⚠️  Rutas de dashboards no disponibles, creando placeholder");
  dashboardsRoutes = express.Router();
  dashboardsRoutes.get("/health", (req, res) => {
    res.json({ status: "Dashboards module loading...", timestamp: new Date().toISOString() });
  });
}

// ===== RUTAS DE SALUD DEL SISTEMA =====
app.get("/api/health", async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    services: {
      server: "running"
    }
  };

  // Verificar base de datos
  if (sequelize) {
    try {
      await sequelize.authenticate();
      health.services.database = "connected";
    } catch (error) {
      health.services.database = "disconnected";
      health.warnings = health.warnings || [];
      health.warnings.push("Database connection failed");
    }
  } else {
    health.services.database = "not_configured";
  }

  // Verificar Redis
  if (redisClients) {
    try {
      const redisStats = await redisClients.testConnections();
      health.services.redis = {
        status: "connected",
        clients: redisStats
      };
    } catch (error) {
      health.services.redis = { status: "disconnected", error: error.message };
    }
  } else {
    health.services.redis = { status: "not_configured" };
  }

  // Verificar BullMQ
  if (bullmqInitialized && bullmqConfig) {
    try {
      const queueStats = await bullmqConfig.getQueueStats();
      health.services.bullmq = {
        status: "running",
        queues: queueStats
      };
    } catch (error) {
      health.services.bullmq = { status: "error", error: error.message };
    }
  } else {
    health.services.bullmq = { status: bullmqConfig ? "not_initialized" : "not_configured" };
  }

  // Verificar módulos cargados
  health.modules = {
    auth: authRoutes ? "loaded" : "placeholder",
    auditorias: auditoriasRoutes ? "loaded" : "placeholder",
    etl: etlRoutes ? "loaded" : "placeholder",
    ia: iaRoutes ? "loaded" : "placeholder",
    notificaciones: notificacionesRoutes ? "loaded" : "placeholder",
    chat: chatRoutes ? "loaded" : "placeholder",
    dashboards: dashboardsRoutes ? "loaded" : "placeholder"
  };

  res.json(health);
});

app.get("/api/health/database", async (req, res) => {
  if (!sequelize) {
    return res.status(503).json({
      status: "not_configured",
      message: "Database not configured"
    });
  }

  try {
    await sequelize.authenticate();
    
    let tables = [];
    try {
      tables = await sequelize.getQueryInterface().showAllTables();
    } catch (tableError) {
      console.warn("No se pudieron obtener las tablas:", tableError.message);
    }

    res.json({
      status: "connected",
      database: process.env.DB_NAME || "portal_auditorias",
      tables_count: tables.length,
      tables: tables.slice(0, 10)
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      error: error.message
    });
  }
});

// ===== RUTAS DE BULLMQ MONITORING =====
app.get("/api/jobs/health", async (req, res) => {
  if (!bullmqInitialized) {
    return res.status(503).json({
      status: "not_initialized",
      message: "BullMQ not initialized"
    });
  }

  try {
    const stats = await bullmqConfig.getQueueStats();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      queues: stats
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message
    });
  }
});

app.get("/api/jobs/stats", async (req, res) => {
  if (!bullmqInitialized) {
    return res.status(503).json({
      error: "BullMQ not initialized"
    });
  }

  try {
    const queueStats = await bullmqConfig.getQueueStats();
    const redisStats = redisClients ? await redisClients.getStats() : {};
    
    res.json({
      timestamp: new Date().toISOString(),
      queues: queueStats,
      redis: redisStats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.get("/api/jobs/:queueName/:jobId", async (req, res) => {
  if (!bullmqInitialized) {
    return res.status(503).json({
      error: "BullMQ not initialized"
    });
  }

  try {
    const { queueName, jobId } = req.params;
    const jobInfo = await bullmqConfig.getJobInfo(queueName, jobId);
    
    if (!jobInfo) {
      return res.status(404).json({
        error: "Job not found"
      });
    }

    res.json(jobInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Agregar jobs a las colas
app.post("/api/jobs/add/etl", async (req, res) => {
  if (!bullmqInitialized) {
    return res.status(503).json({
      error: "BullMQ not initialized"
    });
  }

  try {
    const jobData = req.body;
    const job = await bullmqConfig.addJob.etl(jobData);
    
    res.status(201).json({
      success: true,
      job_id: job.id,
      queue: "etl",
      status: "queued"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/api/jobs/add/ia", async (req, res) => {
  if (!bullmqInitialized) {
    return res.status(503).json({
      error: "BullMQ not initialized"
    });
  }

  try {
    const jobData = req.body;
    const job = await bullmqConfig.addJob.ia(jobData);
    
    res.status(201).json({
      success: true,
      job_id: job.id,
      queue: "ia",
      status: "queued"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/api/jobs/add/notification", async (req, res) => {
  if (!bullmqInitialized) {
    return res.status(503).json({
      error: "BullMQ not initialized"
    });
  }

  try {
    const jobData = req.body;
    const job = await bullmqConfig.addJob.notification(jobData);
    
    res.status(201).json({
      success: true,
      job_id: job.id,
      queue: "notifications",
      status: "queued"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Control de colas (pausar/reanudar)
app.post("/api/jobs/:queueName/:action", async (req, res) => {
  if (!bullmqInitialized) {
    return res.status(503).json({
      error: "BullMQ not initialized"
    });
  }

  try {
    const { queueName, action } = req.params;
    
    if (!['pause', 'resume'].includes(action)) {
      return res.status(400).json({
        error: "Action must be 'pause' or 'resume'"
      });
    }

    await bullmqConfig.toggleQueue(queueName, action);
    
    res.json({
      success: true,
      queue: queueName,
      action: action,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Limpiar colas
app.delete("/api/jobs/:queueName/clean", async (req, res) => {
  if (!bullmqInitialized) {
    return res.status(503).json({
      error: "BullMQ not initialized"
    });
  }

  try {
    const { queueName } = req.params;
    const { type = 'completed', grace = 3600000, limit = 100 } = req.query;
    
    const cleanedJobs = await bullmqConfig.cleanQueue(queueName, {
      type,
      grace: parseInt(grace),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      queue: queueName,
      cleaned_jobs: cleanedJobs.length,
      type: type
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== CONFIGURAR RUTAS DE DOMINIOS =====
app.use("/api/auth", authRoutes);
app.use("/api/auditorias", auditoriasRoutes);
app.use("/api/etl", etlRoutes);
app.use("/api/ia", iaRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
// Bridge para compatibilidad frontend - mapear /api/notifications a /api/notificaciones
app.use("/api/notifications", notificacionesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboards", dashboardsRoutes);

// Rutas adicionales para versiones si están disponibles
try {
  const versionesRoutes = require("./domains/versiones/versiones.routes");
  app.use("/api/versiones", versionesRoutes);
  console.log("✅ Rutas de versiones cargadas");
} catch (error) {
  app.get("/api/versiones", (req, res) => {
    res.json({ status: "Versiones module loading...", versiones: [], timestamp: new Date().toISOString() });
  });
}

// Rutas adicionales para bitácora si están disponibles
try {
  const bitacoraRoutes = require("./domains/bitacora/bitacora.routes");
  app.use("/api/bitacora", bitacoraRoutes);
  console.log("✅ Rutas de bitácora cargadas");
} catch (error) {
  app.get("/api/bitacora", (req, res) => {
    res.json({ status: "Bitacora module loading...", logs: [], timestamp: new Date().toISOString() });
  });
}

// Endpoint adicional para health check completo
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Portal Auditorías Técnicas"
  });
});

// Endpoint para chat workspaces
app.get("/api/chat/workspaces", (req, res) => {
  res.json({
    success: true,
    workspaces: [
      {
        id: 1,
        name: "General",
        description: "Espacio general de comunicación"
      }
    ]
  });
});

// ===== MANEJO DE ERRORES =====
app.use("*", (req, res) => {
  const endpoints = [
    "GET /api/health",
    "GET /api/health/database", 
    "GET /api/jobs/health",
    "GET /api/jobs/stats",
    "GET /api/jobs/:queueName/:jobId",
    "POST /api/jobs/:queueName/:action",
    "POST /api/jobs/add/etl",
    "POST /api/jobs/add/ia",
    "POST /api/jobs/add/notification",
    "DELETE /api/jobs/:queueName/clean",
    "GET /api/auth/status",
    "GET /api/auditorias",
    "GET /api/etl/status",
    "GET /api/chat/health",
    "GET /api/bitacora"
  ];

  res.status(404).json({
    error: "Endpoint no encontrado",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_endpoints: endpoints
  });
});

// Error handler seguro
app.use((err, req, res, next) => {
  console.error("💥 Error en servidor:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    timestamp: new Date().toISOString(),
    message: process.env.NODE_ENV === "development" ? err.message : "Error interno"
  });
});

// ===== INICIALIZACIÓN DEL SERVIDOR =====
async function startServer() {
  try {
    // Conectar a la base de datos si está disponible
    if (sequelize) {
      try {
        await sequelize.authenticate();
        console.log("✅ Base de datos conectada");
        
        // Sincronizar en desarrollo
        if (process.env.NODE_ENV !== "production") {
          await sequelize.sync({ alter: true });
          console.log("✅ Modelos sincronizados");
        }
      } catch (dbError) {
        console.warn("⚠️  Base de datos no disponible, continuando sin DB:", dbError.message);
      }
    }

    // Inicializar BullMQ
    await initializeBullMQ();

    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log("================================================================================");
      console.log("🎯 PORTAL DE AUDITORÍAS TÉCNICAS - SERVIDOR CON BULLMQ INICIADO");
      console.log("================================================================================");
      console.log(`🌐 Servidor: http://localhost:${PORT}`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Jobs Monitor: http://localhost:${PORT}/api/jobs/health`);
      console.log(`📈 Jobs Stats: http://localhost:${PORT}/api/jobs/stats`);
      console.log(`📊 Base de Datos: ${sequelize ? "Configurada" : "No configurada"}`);
      console.log(`🔄 Redis: ${redisClients ? "Disponible" : "No disponible"}`);
      console.log(`⚙️  BullMQ: ${bullmqInitialized ? "Inicializado" : "No inicializado"}`);
      console.log(`📅 Iniciado: ${new Date().toISOString()}`);
      console.log("================================================================================");
      console.log("📋 Endpoints principales:");
      console.log("   GET /api/health - Estado del sistema completo");
      console.log("   GET /api/jobs/health - Estado de colas BullMQ");
      console.log("   GET /api/jobs/stats - Estadísticas detalladas");
      console.log("   POST /api/jobs/add/etl - Agregar job ETL");
      console.log("   POST /api/jobs/add/ia - Agregar job IA");
      console.log("   POST /api/jobs/add/notification - Agregar job Notification");
      console.log("   GET /api/auth/status - Estado autenticación");
      console.log("   GET /api/auditorias - Gestión auditorías");
      if (bullmqInitialized) {
        console.log("📊 BullMQ Colas disponibles:");
        console.log("   - etl-processing (ETL parque informático)");
        console.log("   - ia-analysis (Análisis IA documentos)");
        console.log("   - notifications (Notificaciones y emails)");
        console.log("   - maintenance (Tareas de mantenimiento)");
      }
      console.log("================================================================================");
    });

    // Manejo de cierre graceful
    const gracefulShutdown = async (signal) => {
      console.log(`🛑 Recibida señal ${signal}, cerrando servidor...`);
      
      server.close(async () => {
        console.log("🔌 Servidor HTTP cerrado");
        
        // Cerrar BullMQ
        if (bullmqInitialized && bullmqConfig) {
          try {
            await bullmqConfig.closeQueues();
            console.log("⚙️  BullMQ cerrado");
          } catch (error) {
            console.error("❌ Error cerrando BullMQ:", error.message);
          }
        }
        
        // Cerrar Redis
        if (redisClients) {
          try {
            await redisClients.closeConnections();
            console.log("🔴 Redis cerrado");
          } catch (error) {
            console.error("❌ Error cerrando Redis:", error.message);
          }
        }
        
        // Cerrar base de datos
        if (sequelize) {
          try {
            await sequelize.close();
            console.log("🗄️  Conexión de base de datos cerrada");
          } catch (error) {
            console.error("❌ Error cerrando base de datos:", error.message);
          }
        }
        
        console.log("✅ Cierre graceful completado");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    return server;

  } catch (error) {
    console.error("💥 Error fatal iniciando servidor:", error);
    process.exit(1);
  }
}

// Iniciar servidor solo si es el módulo principal
if (require.main === module) {
  startServer();
}

module.exports = app;