// /server/jobs/jobs.controller.js
// Controlador para gestión de jobs asíncronos - Portal de Auditorías Técnicas

const queueManager = require('./queue-manager');

/**
 * Controlador para gestión de jobs asíncronos BullMQ
 */
class JobsController {

  /**
   * POST /api/jobs/etl
   * Crear job de procesamiento ETL
   */
  async createETLJob(req, res) {
    try {
      const { auditoria_id, archivo_ruta, opciones = {} } = req.body;

      if (!auditoria_id || !archivo_ruta) {
        return res.status(400).json({
          error: 'auditoria_id y archivo_ruta son requeridos'
        });
      }

      console.log(`📋 Creando job ETL para auditoría: ${auditoria_id}`);

      const job = await queueManager.addETLJob({
        auditoria_id,
        archivo_ruta,
        opciones: {
          ...opciones,
          procesado_por: req.user?.id || 'sistema'
        }
      });

      res.json({
        exito: true,
        job_id: job.id,
        cola: 'etl-processing',
        mensaje: 'Job ETL creado exitosamente',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error creando job ETL:', error.message);
      res.status(500).json({
        error: 'Error creando job ETL',
        detalle: error.message
      });
    }
  }

  /**
   * POST /api/jobs/ia
   * Crear job de análisis IA
   */
  async createIAJob(req, res) {
    try {
      const { tipo, data, opciones = {} } = req.body;

      if (!tipo || !data) {
        return res.status(400).json({
          error: 'tipo y data son requeridos'
        });
      }

      const tiposValidos = ['analyze-document', 'analyze-image', 'scoring-parque'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          error: `Tipo debe ser uno de: ${tiposValidos.join(', ')}`
        });
      }

      console.log(`🤖 Creando job IA tipo: ${tipo}`);

      const job = await queueManager.addIAJob(tipo, {
        tipo,
        data: {
          ...data,
          procesado_por: req.user?.id || 'sistema'
        }
      }, opciones);

      res.json({
        exito: true,
        job_id: job.id,
        cola: 'ia-analysis',
        tipo,
        mensaje: 'Job IA creado exitosamente',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error creando job IA:', error.message);
      res.status(500).json({
        error: 'Error creando job IA',
        detalle: error.message
      });
    }
  }

  /**
   * GET /api/jobs/stats
   * Obtener estadísticas de colas
   */
  async getStats(req, res) {
    try {
      const stats = await queueManager.getQueueStats();
      
      // Calcular totales
      const totales = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        total: 0
      };

      Object.values(stats).forEach(queueStats => {
        if (!queueStats.error) {
          totales.waiting += queueStats.waiting || 0;
          totales.active += queueStats.active || 0;
          totales.completed += queueStats.completed || 0;
          totales.failed += queueStats.failed || 0;
          totales.total += queueStats.total || 0;
        }
      });

      res.json({
        exito: true,
        estadisticas: {
          por_cola: stats,
          totales,
          colas_activas: Object.keys(stats).length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      res.status(500).json({
        error: 'Error obteniendo estadísticas de jobs',
        detalle: error.message
      });
    }
  }

  /**
   * GET /api/jobs/:queueName
   * Obtener jobs de una cola específica
   */
  async getQueueJobs(req, res) {
    try {
      const { queueName } = req.params;
      const { 
        status = 'waiting', 
        start = 0, 
        end = 10 
      } = req.query;

      const jobs = await queueManager.getQueueJobs(
        queueName,
        status,
        parseInt(start),
        parseInt(end)
      );

      res.json({
        exito: true,
        cola: queueName,
        estado: status,
        jobs,
        total: jobs.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Error obteniendo jobs de ${req.params.queueName}:`, error.message);
      res.status(500).json({
        error: 'Error obteniendo jobs de cola',
        detalle: error.message
      });
    }
  }

  /**
   * GET /api/jobs/health
   * Health check del sistema de colas
   */
  async healthCheck(req, res) {
    try {
      const health = await queueManager.healthCheck();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 206 : 500;
      
      res.status(statusCode).json({
        servicio: 'Jobs BullMQ',
        version: '1.0.0',
        ...health
      });

    } catch (error) {
      console.error('❌ Error en health check de jobs:', error.message);
      res.status(500).json({
        servicio: 'Jobs BullMQ',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * DELETE /api/jobs/cleanup
   * Limpiar jobs antiguos
   */
  async cleanupJobs(req, res) {
    try {
      await queueManager.cleanupOldJobs();
      
      res.json({
        exito: true,
        mensaje: 'Limpieza de jobs completada exitosamente',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error en limpieza de jobs:', error.message);
      res.status(500).json({
        error: 'Error en limpieza de jobs',
        detalle: error.message
      });
    }
  }

  /**
   * GET /api/jobs/monitor
   * Monitor en tiempo real de jobs activos
   */
  async getMonitor(req, res) {
    try {
      const stats = await queueManager.getQueueStats();
      const health = await queueManager.healthCheck();
      
      // Obtener jobs activos de todas las colas
      const jobsActivos = {};
      
      for (const queueName of Object.keys(stats)) {
        try {
          const activeJobs = await queueManager.getQueueJobs(queueName, 'active', 0, 5);
          jobsActivos[queueName] = activeJobs;
        } catch (error) {
          jobsActivos[queueName] = { error: error.message };
        }
      }
      
      res.json({
        exito: true,
        monitor: {
          salud_general: health.status,
          estadisticas: stats,
          jobs_activos: jobsActivos,
          conexion_redis: health.redis_connection,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo monitor:', error.message);
      res.status(500).json({
        error: 'Error obteniendo datos de monitor',
        detalle: error.message
      });
    }
  }
}

module.exports = new JobsController();
