// /server/startup-simple.js
// Inicializador simplificado del Portal de Auditorías Técnicas

const express = require('express');
const cors = require('cors');
const path = require('path');

/**
 * Inicializador simplificado para testing y startup rápido
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
   * Inicialización simplificada del sistema
   */
  async initialize() {
    try {
      console.log('🚀 Iniciando Portal de Auditorías Técnicas (modo simplificado)...');
      console.log('📅 Timestamp:', new Date().toISOString());
      
      // 1. Configurar middleware básico
      await this.setupMiddleware();
      
      // 2. Configurar rutas básicas
      await this.setupBasicRoutes();
      
      // 3. Configurar manejo de errores
      this.setupErrorHandling();
      
      this.isInitialized = true;
      const initTime = Date.now() - this.startTime;
      
      console.log('✅ Portal de Auditorías inicializado exitosamente (modo simplificado)');
      console.log(`⏱️  Tiempo de inicialización: ${initTime}ms`);
      console.log('📊 Estado de servicios:', this.services);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error durante inicialización:', error.message);
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
   * Configurar rutas básicas
   */
  async setupBasicRoutes() {
    console.log('🛣️  Configurando rutas básicas...');
    
    // Ruta de bienvenida
    this.app.get('/', (req, res) => {
      res.json({
        servicio: 'Portal de Auditorías Técnicas',
        version: '1.0.0',
        estado: this.isInitialized ? 'inicializado' : 'inicializando',
        modo: 'simplificado',
        servicios: this.services,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      });
    });

    // Health check básico
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: '1.0.0',
        modo: 'simplificado',
        servicios: this.services
      });
    });

    // Rutas de IA (mock)
    this.app.get('/api/ia/health', (req, res) => {
      res.json({
        servicio: 'IA Portal Auditorías',
        version: '1.0.0',
        servicio_disponible: false,
        ollama_stats: { status: 'mock' },
        modelos_activos: [],
        analisis_realizados: 0,
        timestamp: new Date().toISOString()
      });
    });

    // Rutas de jobs (mock)
    this.app.get('/api/jobs/health', (req, res) => {
      res.json({
        servicio: 'Jobs BullMQ',
        version: '1.0.0',
        status: 'mock',
        queues: {},
        workers: {},
        redis_connection: false,
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/api/jobs/stats', (req, res) => {
      res.json({
        exito: true,
        estadisticas: {
          por_cola: {},
          totales: { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 },
          colas_activas: 0,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Rutas de dashboards (mock)
    this.app.get('/api/dashboards/executive', (req, res) => {
      res.json({
        exito: true,
        dashboard: {
          kpis: {
            auditorias_completadas: 45,
            auditorias_en_progreso: 12,
            tasa_cumplimiento_promedio: 78.5,
            tiempo_promedio_auditoria: '14 días'
          },
          modo: 'mock',
          timestamp: new Date().toISOString()
        }
      });
    });

    // Rutas de ETL (mock)
    this.app.get('/api/etl/health', (req, res) => {
      res.json({
        servicio: 'ETL Portal Auditorías',
        version: '1.0.0',
        estado: 'mock',
        estadisticas: {
          archivos_procesados: 0,
          registros_procesados: 0,
          errores_total: 0
        },
        timestamp: new Date().toISOString()
      });
    });

    // Ruta catch-all
    this.app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ 
          error: 'Endpoint no encontrado',
          path: req.path,
          modo: 'simplificado'
        });
      } else {
        res.json({
          mensaje: 'Portal de Auditorías Técnicas',
          modo: 'simplificado',
          path: req.path
        });
      }
    });
    
    console.log('✅ Rutas básicas configuradas');
    this.services.routes = true;
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
        modo: 'simplificado',
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
            console.log(`🤖 IA Health: http://localhost:${port}/api/ia/health`);
            console.log(`⚙️  Jobs Health: http://localhost:${port}/api/jobs/health`);
            console.log(`📈 Dashboard: http://localhost:${port}/api/dashboards/executive`);
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
