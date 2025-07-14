#!/usr/bin/env node

/**
 * Script de Health Check del Sistema
 * Verifica el estado de todos los servicios
 */

const { initializeDatabase } = require('../config/database');
const { redisManager } = require('../config/redis');
const { ollamaManager } = require('../config/ollama');
const { queueManager } = require('../config/bullmq');

class HealthChecker {
  constructor() {
    this.services = {
      database: { status: 'unknown', details: {} },
      redis: { status: 'unknown', details: {} },
      ollama: { status: 'unknown', details: {} },
      bullmq: { status: 'unknown', details: {} }
    };
    this.overallHealth = 'UNKNOWN';
    this.startTime = Date.now();
  }

  async runHealthCheck() {
    console.log('🔍 Ejecutando health check del sistema...\n');
    
    try {
      // Ejecutar checks en paralelo para servicios independientes
      await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkOllama(),
        this.checkBullMQ()
      ]);
      
      // Calcular estado general
      this.calculateOverallHealth();
      
      // Mostrar reporte
      this.displayReport();
      
      // Determinar código de salida
      const hasHealthyRequired = this.services.database.status === 'up';
      const exitCode = hasHealthyRequired ? 0 : 1;
      
      if (!hasHealthyRequired) {
        console.log('\n⚠️ Sistema con problemas - Revisar servicios con estado down');
      }
      
      process.exit(exitCode);
      
    } catch (error) {
      console.error('❌ Error ejecutando health check:', error.message);
      process.exit(1);
    }
  }

  async checkDatabase() {
    try {
      const startTime = Date.now();
      const sequelize = await initializeDatabase();
      
      // Probar conexión con query simple
      await sequelize.authenticate();
      const responseTime = Date.now() - startTime;
      
      // Obtener información adicional
      const [results] = await sequelize.query('SELECT VERSION() as version');
      const version = results[0]?.version || 'unknown';
      
      this.services.database = {
        status: 'up',
        details: {
          type: 'mysql',
          responseTime: `${responseTime}ms`,
          version: version.split('-')[0],
          connection: 'healthy'
        }
      };
      
      await sequelize.close();
      
    } catch (error) {
      this.services.database = {
        status: 'down',
        details: {
          type: 'mysql',
          error: error.message,
          code: error.original?.code || error.code
        }
      };
    }
  }

  async checkRedis() {
    try {
      await redisManager.initialize();
      const healthResult = await redisManager.healthCheck();
      
      this.services.redis = {
        status: healthResult.status,
        details: healthResult
      };
      
    } catch (error) {
      this.services.redis = {
        status: 'down',
        details: {
          type: 'redis',
          error: error.message
        }
      };
    }
  }

  async checkOllama() {
    try {
      await ollamaManager.initialize();
      const healthResult = await ollamaManager.healthCheck();
      
      this.services.ollama = {
        status: healthResult.status,
        details: healthResult
      };
      
    } catch (error) {
      this.services.ollama = {
        status: 'down',
        details: {
          type: 'ai_engine',
          error: error.message
        }
      };
    }
  }

  async checkBullMQ() {
    try {
      await queueManager.initialize();
      const healthResult = await queueManager.healthCheck();
      
      this.services.bullmq = {
        status: healthResult.status,
        details: healthResult
      };
      
    } catch (error) {
      this.services.bullmq = {
        status: 'down',
        details: {
          type: 'job_queue',
          error: error.message
        }
      };
    }
  }

  calculateOverallHealth() {
    const statuses = Object.values(this.services).map(s => s.status);
    
    const upCount = statuses.filter(s => s === 'up').length;
    const downCount = statuses.filter(s => s === 'down').length;
    
    // Base de datos es crítica
    const databaseUp = this.services.database.status === 'up';
    
    if (!databaseUp) {
      this.overallHealth = 'UNHEALTHY';
    } else if (downCount === 0) {
      this.overallHealth = 'HEALTHY';
    } else if (downCount <= 2) {
      this.overallHealth = 'DEGRADED';
    } else {
      this.overallHealth = 'UNHEALTHY';
    }
  }

  displayReport() {
    const uptime = Math.round((Date.now() - this.startTime) / 1000);
    const environment = process.env.NODE_ENV || 'development';
    
    console.log(`📊 Estado General: ${this.overallHealth}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🕐 Uptime: ${uptime}s`);
    console.log(`🌍 Entorno: ${environment}\n`);
    
    console.log('📋 Estado de Servicios:');
    for (const [serviceName, serviceData] of Object.entries(this.services)) {
      const icon = serviceData.status === 'up' ? '✅' : '❌';
      const statusText = serviceData.status === 'up' ? 'up' : 'down';
      const type = serviceData.details.type || serviceName;
      
      console.log(`  ${icon} ${serviceName}: ${statusText} (${type})`);
      
      // Mostrar detalles adicionales para servicios UP
      if (serviceData.status === 'up') {
        if (serviceData.details.responseTime) {
          console.log(`     - Tiempo respuesta: ${serviceData.details.responseTime}`);
        }
        if (serviceData.details.version) {
          console.log(`     - Versión: ${serviceData.details.version}`);
        }
        if (serviceData.details.models) {
          console.log(`     - Modelos: ${serviceData.details.models}`);
        }
        if (serviceData.details.queues) {
          console.log(`     - Colas: ${serviceData.details.queues}`);
        }
        if (serviceData.details.mode) {
          console.log(`     - Modo: ${serviceData.details.mode}`);
        }
      }
      
      // Mostrar errores para servicios DOWN
      if (serviceData.status === 'down' && serviceData.details.error) {
        console.log(`     - Error: ${serviceData.details.error}`);
      }
    }
    
    // Mostrar información del sistema
    this.displaySystemInfo();
  }

  displaySystemInfo() {
    const memUsage = process.memoryUsage();
    
    console.log('\n💾 Uso de Memoria:');
    console.log(`  - RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    console.log(`  - Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    console.log(`  - Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`  - External: ${Math.round(memUsage.external / 1024 / 1024)}MB`);
  }

  // Método para uso programático
  async getHealthData() {
    await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkOllama(),
      this.checkBullMQ()
    ]);
    
    this.calculateOverallHealth();
    
    return {
      status: this.overallHealth,
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      services: this.services,
      system: {
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const healthChecker = new HealthChecker();
  healthChecker.runHealthCheck();
}

module.exports = { HealthChecker };
