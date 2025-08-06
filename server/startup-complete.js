// /server/startup-complete.js
// Inicializador completo del Portal de Auditorías Técnicas

const express = require('express');
const cors = require('cors');
const path = require('path');

// Configuraciones principales
const databaseConfig = require('./config/database');
const redisConfig = require('./config/redis');
const ollamaConfig = require('./config/ollama');

// Servicios principales
const queueManager = require('./jobs/queue-manager');

// Rutas principales
const authRoutes = require('./domains/auth/auth.routes');
const auditoriasRoutes = require('./domains/auditorias/auditorias.routes');
const etlRoutes = require('./domains/etl/etl.routes');
const iaRoutes = require('./domains/ia/ia.routes');
const dashboardsRoutes = require('./domains/dashboards/dashboards.routes');
const jobsRoutes = require('./jobs/jobs.routes');

/**
 * Clase principal para inicialización completa del sistema
 */
class PortalAuditorias {
  constructor() {
    this.app = express();
    this.server = null;
    this.isInitialized = false;
    this.startTime = Date.now();
    this.services = {
      database: false,
      redis: false,
      ollama: false,
      queues: false,
      routes: false
    };
  }

  /**
   * Inicialización completa del sistema
   */
  async initialize() {
    try {
      console.log('🚀 Iniciando Portal de Auditorías Técnicas...');
      console.log('📅 Timestamp:', new Date().toISOString());
      
      // 1. Configurar middleware básico
      await this.setupMiddleware();
      
      // 2. Inicializar base de datos
      await this.initializeDatabase();
      
      // 3. Inicializar Redis (opcional)
      await this.initializeRedis();
      
      // 4. Inicializar Ollama IA (opcional)
      await this.initializeOllama();
      
      // 5. Inicializar sistema de colas
      await this.initializeQueues();
      
      // 6. Configurar rutas
      await this.setupRoutes();
      
      // 7. Configurar manejo de errores
      this.setupErrorHandling();
      
      // 8. Health checks
      this.setupHealthChecks();
      
      this.isInitialized = true;
      const initTime = Date.now() - this.startTime;
      
      console.log('✅ Portal de Auditorías Técnicas inicializado exitosamente');
      console.log(`⏱️  Tiempo de inicialización: ${initTime}ms`);
      console.log('📊 Estado de servicios:', this.services);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error fatal durante inicialización:', error.message);
      console.error('📊 Estado de servicios al fallar:', this.services);
      throw error;
    }
  }

  /**
   * Configurar middleware básico
   */
  async setupMiddleware() {
    console.log('⚙️  Configurando middleware...');
    
    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
    
    console.log('✅ Middleware configurado');
  }

  /**
   * Inicializar base de datos
   */
  async initializeDatabase() {
    try {
      console.log('🗄️  Inicializando base de datos...');
      
      // Mock de prueba de conexión (en producción usar Sequelize real)
      console.log('✅ Conexión a base de datos establecida (modo mock)');
      this.services.database = true;
      
    } catch (error) {
      console.warn('⚠️  Base de datos no disponible:', error.message);
      console.log('🎭 Continuando en modo mock...');
      this.services.database = false;
    }
  }

  /**
   * Inicializar Redis
   */
  async initializeRedis() {
    try {
      console.log('📦 Inicializando Redis...');
      
      const connections = await redisConfig.testConnections();
      const allHealthy = connections.every(conn => conn.status === 'connected');
      
      if (allHealthy) {
        console.log('✅ Redis conectado exitosamente');
        this.services.redis = true;
      } else {
        throw new Error('Algunas conexiones Redis fallaron');
      }
      
    } catch (error) {
      console.warn('⚠️  Redis no disponible:', error.message);
      console.log('🎭 Cache y jobs funcionarán en modo mock');
      this.services.redis = false;
    }
  }

  /**
   * Inicializar Ollama IA
   */
  async initializeOllama() {
    try {
      console.log('🤖 Inicializando Ollama IA...');
      
      const health = await ollamaConfig.checkOllamaHealth();
      
      if (health.status === 'healthy') {
        const modelsStatus = await ollamaConfig.ensureModelsAvailable();
        
        if (modelsStatus.status === 'ready') {
          console.log('✅ Ollama IA listo con todos los modelos');
          this.services.ollama = true;
        } else {
          console.warn('⚠️  Ollama disponible pero faltan modelos:', modelsStatus.missing_models);
          console.log('💡 Para instalar: ollama pull llama3.2:1b && ollama pull moondream');
          this.services.ollama = false;
        }
      } else {
        throw new Error('Ollama no está ejecutándose');
      }
      
    } catch (error) {
      console.warn('⚠️  Ollama IA no disponible:', error.message);
      console.log('🎭 Análisis IA funcionará en modo simulado');
      console.log('💡 Para activar IA: ollama serve');
      this.services.ollama = false;
    }
  }

  /**
   * Inicializar sistema de colas
   */
  async initializeQueues() {
    try {
      console.log('📋 Inicializando sistema de colas...');
      
      await queueManager.initialize();
      
      console.log('✅ Sistema de colas inicializado');
      this.services.queues = true;
      
    } catch (error) {
      console.warn('⚠️  Sistema de colas en modo mock:', error.message);
      this.services.queues = false;
    }
  }

  /**
   * Configurar rutas principales
   */
  async setupRoutes() {
    console.log('🛣️  Configurando rutas...');
    
    // Ruta de bienvenida
    this.app.get('/', (req, res) => {
      res.json({
        servicio: 'Portal de Auditorías Técnicas',
        version: '1.0.0',
        estado: this.isInitialized ? 'inicializado' : 'inicializando',
        servicios: this.services,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      });
    });
    
    // Rutas principales
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/auditorias', auditoriasRoutes);
    this.app.use('/api/etl', etlRoutes);
    this.app.use('/api/ia', iaRoutes);
    this.app.use('/api/dashboards', dashboardsRoutes);
    this.app.use('/api/jobs', jobsRoutes);
    
    console.log('✅ Rutas configuradas');
    this.services.routes = true;
  }

  /**
   * Configurar health checks
   */
  setupHealthChecks() {
    this.app.get('/api/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: '1.0.0',
        servicios: this.services
      };
      
      res.json(health);
    });
    
    console.log('✅ Health checks configurados');
  }

  /**
   * Configurar manejo de errores
   */
  setupErrorHandling() {
    // Manejo de errores global
    this.app.use((error, req, res, next) => {
      console.error('❌ Error no manejado:', error.message);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('✅ Manejo de errores configurado');
  }

  /**
   * Iniciar servidor
   */
  async start(port = process.env.PORT || 5000) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return new Promise((resolve, reject) => {
        this.server = this.app.listen(port, (error) => {
          if (error) {
            console.error('❌ Error iniciando servidor:', error.message);
            reject(error);
          } else {
            console.log('🌟 ===============================================');
            console.log('🚀 PORTAL DE AUDITORÍAS TÉCNICAS INICIADO');
            console.log('🌟 ===============================================');
            console.log(`📡 Servidor ejecutándose en puerto: ${port}`);
            console.log(`🌐 URL: http://localhost:${port}`);
            console.log(`📊 Health check: http://localhost:${port}/api/health`);
            console.log('🌟 ===============================================');
            
            resolve(this.server);
          }
        });
      });
      
    } catch (error) {
      console.error('💥 Error fatal iniciando Portal de Auditorías:', error.message);
      throw error;
    }
  }

  /**
   * Cerrar servidor gracefully
   */
  async shutdown() {
    console.log('🔒 Cerrando Portal de Auditorías Técnicas...');
    
    try {
      // Cerrar sistema de colas
      if (this.services.queues) {
        await queueManager.shutdown();
      }
      
      // Cerrar servidor HTTP
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
      }
      
      console.log('✅ Portal de Auditorías cerrado exitosamente');
      
    } catch (error) {
      console.error('❌ Error cerrando Portal de Auditorías:', error.message);
      throw error;
    }
  }
}

// Crear instancia principal
const portalAuditorias = new PortalAuditorias();

// Manejo de señales del sistema
process.on('SIGTERM', async () => {
  console.log('📨 Señal SIGTERM recibida, cerrando gracefully...');
  await portalAuditorias.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📨 Señal SIGINT recibida, cerrando gracefully...');
  await portalAuditorias.shutdown();
  process.exit(0);
});

// Exportar para uso en otros archivos
module.exports = portalAuditorias;

// Iniciar si es ejecutado directamente
if (require.main === module) {
  portalAuditorias.start().catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });
}
