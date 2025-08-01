/**
 * Controlador ETL - Portal de Auditorías Técnicas
 * Endpoints para procesamiento de parque informático
 * 
 * Versión 2.0 - Integrado con nuevos modelos ETL
 */

const ETLService = require('./etl.service');
const configurarModelosETL = require('./models');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuración de multer para upload de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/etl');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${cleanName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Use .xlsx, .xls o .csv'));
    }
  }
});

class ETLController {
  constructor() {
    this.etlService = new ETLService();
    this.models = null;
    this.initialized = false;
  }

  // Inicializar modelos
  async initialize(sequelize) {
    if (!this.initialized) {
      this.models = configurarModelosETL(sequelize);
      this.etlService.setModels(this.models);
      this.initialized = true;
    }
  }

  // Middleware para validar inicialización
  requireInitialization = (req, res, next) => {
    if (!this.initialized) {
      return res.status(500).json({
        success: false,
        message: 'Controlador ETL no inicializado'
      });
    }
    next();
  };

  /**
   * POST /api/etl/process
   * Procesar archivo de parque informático
   */
  procesarParqueInformatico = [
    upload.single('archivo'),
    body('auditoria_id').isUUID().withMessage('ID de auditoría inválido'),
    body('configuracion').optional().isJSON().withMessage('Configuración debe ser JSON válido'),
    this.requireInitialization,
    
    async (req, res) => {
      try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array()
          });
        }

        // Verificar archivo
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Archivo requerido'
          });
        }

        const {
          auditoria_id,
          documento_id = null,
          configuracion = '{}'
        } = req.body;

        const configParsed = JSON.parse(configuracion);

        console.log(`🔄 Iniciando procesamiento ETL para auditoría: ${auditoria_id}`);

        // Procesar archivo de forma asíncrona
        const resultado = await this.etlService.procesarParqueInformatico({
          archivo_path: req.file.path,
          auditoria_id,
          documento_id,
          usuario_id: req.user.id,
          configuracion: configParsed
        });

        res.status(200).json({
          success: true,
          message: 'Procesamiento ETL iniciado',
          data: {
            job_id: resultado.job_id,
            estado: resultado.estado,
            estimacion_tiempo: '3-5 minutos'
          }
        });

      } catch (error) {
        console.error('❌ Error en procesamiento ETL:', error);
        
        // Limpiar archivo en caso de error
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error eliminando archivo:', unlinkError);
          }
        }

        res.status(500).json({
          success: false,
          message: 'Error en procesamiento ETL',
          error: error.message
        });
      }
    }
  ];

  /**
   * GET /api/etl/jobs/:jobId/status
   * Obtener estado de un trabajo ETL
   */
  obtenerEstadoJob = [
    this.requireInitialization,
    
    async (req, res) => {
      try {
        const { jobId } = req.params;

        const estado = await this.etlService.obtenerEstadoJob(jobId);

        res.status(200).json({
          success: true,
          data: estado
        });

      } catch (error) {
        console.error('❌ Error obteniendo estado job:', error);
        
        if (error.message.includes('no encontrado')) {
          return res.status(404).json({
            success: false,
            message: 'Trabajo ETL no encontrado'
          });
        }

        res.status(500).json({
          success: false,
          message: 'Error obteniendo estado del trabajo',
          error: error.message
        });
      }
    }
  ];

  /**
   * GET /api/etl/jobs/:jobId/results
   * Obtener resultados completos de un trabajo ETL
   */
  obtenerResultadosJob = [
    this.requireInitialization,
    
    async (req, res) => {
      try {
        const { jobId } = req.params;

        const resultados = await this.etlService.obtenerResultadosJob(jobId);

        res.status(200).json({
          success: true,
          data: resultados
        });

      } catch (error) {
        console.error('❌ Error obteniendo resultados job:', error);
        
        if (error.message.includes('no encontrado')) {
          return res.status(404).json({
            success: false,
            message: 'Trabajo ETL no encontrado'
          });
        }

        res.status(500).json({
          success: false,
          message: 'Error obteniendo resultados del trabajo',
          error: error.message
        });
      }
    }
  ];

  /**
   * POST /api/etl/validate-only
   * Validar archivo sin procesarlo (dry-run)
   */
  validarArchivo = [
    upload.single('archivo'),
    this.requireInitialization,
    
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Archivo requerido'
          });
        }

        console.log(`🔍 Validando archivo: ${req.file.originalname}`);

        const resultados = await this.etlService.validarArchivo(req.file.path);

        // Limpiar archivo temporal
        await fs.unlink(req.file.path);

        res.status(200).json({
          success: true,
          data: resultados
        });

      } catch (error) {
        console.error('❌ Error validando archivo:', error);
        
        // Limpiar archivo en caso de error
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error eliminando archivo:', unlinkError);
          }
        }

        res.status(500).json({
          success: false,
          message: 'Error validando archivo',
          error: error.message
        });
      }
    }
  ];

  /**
   * GET /api/etl/validation-rules
   * Obtener reglas de validación disponibles
   */
  obtenerReglasValidacion = [
    this.requireInitialization,
    
    async (req, res) => {
      try {
        const { categoria } = req.query;

        const reglas = await this.etlService.obtenerReglasValidacion(categoria);

        res.status(200).json({
          success: true,
          data: reglas
        });

      } catch (error) {
        console.error('❌ Error obteniendo reglas:', error);
        
        res.status(500).json({
          success: false,
          message: 'Error obteniendo reglas de validación',
          error: error.message
        });
      }
    }
  ];

  /**
   * POST /api/etl/validation-rules/defaults
   * Crear reglas de validación por defecto
   */
  crearReglasPorDefecto = [
    this.requireInitialization,
    
    async (req, res) => {
      try {
        const reglas = await this.etlService.crearReglasPorDefecto(req.user.id);

        res.status(201).json({
          success: true,
          message: `${reglas.length} reglas creadas`,
          data: reglas
        });

      } catch (error) {
        console.error('❌ Error creando reglas por defecto:', error);
        
        res.status(500).json({
          success: false,
          message: 'Error creando reglas por defecto',
          error: error.message
        });
      }
    }
  ];

  /**
   * GET /api/etl/metrics
   * Obtener métricas de procesamiento ETL
   */
  obtenerMetricas = [
    this.requireInitialization,
    
    async (req, res) => {
      try {
        const { auditoria_id } = req.query;

        const estadisticas = await this.etlService.obtenerEstadisticasETL(auditoria_id);

        res.status(200).json({
          success: true,
          data: estadisticas
        });

      } catch (error) {
        console.error('❌ Error obteniendo métricas:', error);
        
        res.status(500).json({
          success: false,
          message: 'Error obteniendo métricas ETL',
          error: error.message
        });
      }
    }
  ];

  /**
   * DELETE /api/etl/cleanup
   * Limpiar datos antiguos
   */
  limpiarDatosAntiguos = [
    this.requireInitialization,
    
    async (req, res) => {
      try {
        const { dias = 30 } = req.query;

        const resultado = await this.etlService.limpiarDatosAntiguos(parseInt(dias));

        res.status(200).json({
          success: true,
          message: 'Limpieza completada',
          data: resultado
        });

      } catch (error) {
        console.error('❌ Error en limpieza:', error);
        
        res.status(500).json({
          success: false,
          message: 'Error en limpieza de datos',
          error: error.message
        });
      }
    }
  ];

  /**
   * GET /api/etl/jobs
   * Listar trabajos ETL
   */
  listarJobs = [
    this.requireInitialization,
    
    async (req, res) => {
      try {
        const { 
          auditoria_id,
          estado,
          limit = 20,
          offset = 0
        } = req.query;

        const whereClause = {};
        
        if (auditoria_id) {
          whereClause.auditoria_id = auditoria_id;
        }
        
        if (estado) {
          whereClause.estado = estado;
        }

        const jobs = await this.models.ETLJob.findAndCountAll({
          where: whereClause,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['creado_en', 'DESC']]
        });

        res.status(200).json({
          success: true,
          data: {
            jobs: jobs.rows,
            total: jobs.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        });

      } catch (error) {
        console.error('❌ Error listando jobs:', error);
        
        res.status(500).json({
          success: false,
          message: 'Error listando trabajos ETL',
          error: error.message
        });
      }
    }
  ];

  /**
   * GET /api/etl/parque-informatico/:auditoriaId
   * Obtener datos de parque informático procesados
   */
  obtenerParqueInformatico = [
    this.requireInitialization,
    
    async (req, res) => {
      try {
        const { auditoriaId } = req.params;
        const { 
          estado = 'VALIDADO',
          nivel_cumplimiento,
          limit = 100,
          offset = 0
        } = req.query;

        const whereClause = {
          auditoria_id: auditoriaId
        };

        if (estado !== 'TODOS') {
          whereClause.estado_etl = estado;
        }

        if (nivel_cumplimiento) {
          whereClause.nivel_cumplimiento = nivel_cumplimiento;
        }

        const registros = await this.models.ParqueInformatico.findAndCountAll({
          where: whereClause,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['score_total', 'DESC'], ['sitio', 'ASC'], ['usuario_id', 'ASC']]
        });

        // Obtener estadísticas
        const estadisticas = await this.models.ParqueInformatico.obtenerEstadisticas(auditoriaId);

        res.status(200).json({
          success: true,
          data: {
            registros: registros.rows,
            total: registros.count,
            estadisticas,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        });

      } catch (error) {
        console.error('❌ Error obteniendo parque informático:', error);
        
        res.status(500).json({
          success: false,
          message: 'Error obteniendo datos de parque informático',
          error: error.message
        });
      }
    }
  ];

  /**
   * GET /api/etl/health
   * Health check del módulo ETL
   */
  healthCheck = async (req, res) => {
    try {
      const isHealthy = this.initialized && this.models !== null;
      
      res.status(200).json({
        success: isHealthy,
        status: isHealthy ? 'operational' : 'degraded',
        database: 'connected',
        models: this.initialized ? 'initialized' : 'not initialized',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error en health check:', error);
      res.status(503).json({
        success: false,
        message: 'Módulo ETL no disponible',
        error: error.message
      });
    }
  };

  /**
   * GET /api/etl/validation-rules
   * Obtener reglas de validación disponibles
   */
  obtenerReglasValidacion = async (req, res) => {
    try {
      if (!this.initialized) {
        // Devolver reglas por defecto si no está inicializado
        return res.status(200).json({
          success: true,
          data: [
            { id: 1, nombre: 'RAM Mínima', categoria: 'hardware', activa: true },
            { id: 2, nombre: 'CPU Mínima', categoria: 'hardware', activa: true },
            { id: 3, nombre: 'OS Soportado', categoria: 'software', activa: true }
          ]
        });
      }

      const reglas = await this.etlService.obtenerReglasValidacion(req.query.categoria);
      
      res.status(200).json({
        success: true,
        data: reglas
      });
    } catch (error) {
      console.error('❌ Error obteniendo reglas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo reglas de validación',
        error: error.message
      });
    }
  };

  /**
   * POST /api/etl/validation-rules/defaults
   * Crear reglas de validación por defecto
   */
  crearReglasPorDefecto = async (req, res) => {
    try {
      if (!this.initialized) {
        return res.status(503).json({
          success: false,
          message: 'Módulo ETL no inicializado'
        });
      }

      const reglas = await this.etlService.crearReglasPorDefecto(req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Reglas por defecto creadas',
        data: reglas
      });
    } catch (error) {
      console.error('❌ Error creando reglas:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando reglas por defecto',
        error: error.message
      });
    }
  };

  /**
   * GET /api/etl/jobs
   * Listar trabajos ETL
   */
  listarJobs = async (req, res) => {
    try {
      if (!this.initialized) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      const { auditoria_id, estado, limit = 10, offset = 0 } = req.query;
      
      const whereClause = {};
      if (auditoria_id) whereClause.auditoria_id = auditoria_id;
      if (estado) whereClause.estado = estado;

      const jobs = await this.models.ETLJob.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: {
          jobs: jobs.rows,
          total: jobs.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('❌ Error listando jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Error listando trabajos ETL',
        error: error.message
      });
    }
  };

  /**
   * GET /api/etl/metrics
   * Obtener métricas de procesamiento ETL
   */
  obtenerMetricas = async (req, res) => {
    try {
      if (!this.initialized) {
        return res.status(200).json({
          success: true,
          data: {
            total_jobs: 0,
            success_rate: 0,
            average_processing_time: 0
          }
        });
      }

      const metricas = await this.etlService.obtenerEstadisticasETL(req.query.auditoria_id);
      
      res.status(200).json({
        success: true,
        data: metricas
      });
    } catch (error) {
      console.error('❌ Error obteniendo métricas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo métricas ETL',
        error: error.message
      });
    }
  };

  /**
   * POST /api/etl/validate-only
   * Validar archivo sin procesarlo
   */
  validarArchivo = [
    upload.single('archivo'),
    
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Archivo requerido para validación'
          });
        }

        console.log(`🔍 Validando archivo: ${req.file.originalname}`);

        const resultado = await this.etlService.validarArchivo(req.file.path);

        // Limpiar archivo después de validar
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error eliminando archivo temporal:', unlinkError);
        }

        res.status(200).json({
          success: true,
          data: resultado
        });

      } catch (error) {
        console.error('❌ Error validando archivo:', error);
        
        // Limpiar archivo en caso de error
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error eliminando archivo:', unlinkError);
          }
        }

        res.status(500).json({
          success: false,
          message: 'Error validando archivo',
          error: error.message
        });
      }
    }
  ];

  /**
   * DELETE /api/etl/cleanup
   * Limpiar datos antiguos
   */
  limpiarDatosAntiguos = async (req, res) => {
    try {
      if (!this.initialized) {
        return res.status(503).json({
          success: false,
          message: 'Módulo ETL no inicializado'
        });
      }

      const dias = req.query.dias || 30;
      const resultado = await this.etlService.limpiarDatosAntiguos(parseInt(dias));
      
      res.status(200).json({
        success: true,
        message: 'Limpieza completada',
        data: resultado
      });
    } catch (error) {
      console.error('❌ Error en limpieza:', error);
      res.status(500).json({
        success: false,
        message: 'Error limpiando datos antiguos',
        error: error.message
      });
    }
  };
}

module.exports = ETLController;