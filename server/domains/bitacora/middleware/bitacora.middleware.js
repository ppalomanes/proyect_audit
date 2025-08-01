/**
 * Middleware de Bitácora - Registro Automático de Acciones
 * Portal de Auditorías Técnicas
 * 
 * Middleware que intercepta automáticamente todas las requests
 * y registra las acciones en la bitácora según el tipo de operación
 */

const BitacoraService = require('../bitacora.service');

class BitacoraMiddleware {
  constructor() {
    this.bitacoraService = new BitacoraService();
  }

  /**
   * Middleware principal para registro automático
   */
  registrarAccion() {
    return async (req, res, next) => {
      // Almacenar timestamp de inicio
      req.bitacora = {
        inicio: new Date(),
        registrar: true
      };

      // Interceptar el método res.json para capturar respuestas
      const originalJson = res.json;
      res.json = function(data) {
        req.bitacora.respuesta = {
          status: res.statusCode,
          data: data,
          fin: new Date()
        };
        return originalJson.call(this, data);
      };

      // Continuar con el middleware chain
      next();
    };
  }

  /**
   * Middleware post-request para procesar el registro
   */
  procesarRegistro() {
    return async (req, res, next) => {
      // Ejecutar después de que la response se envíe
      res.on('finish', async () => {
        if (req.bitacora && req.bitacora.registrar) {
          await this.registrarSegunTipo(req, res);
        }
      });
      
      next();
    };
  }

  /**
   * Middleware específico para autenticación
   */
  registrarAuth() {
    return async (req, res, next) => {
      const originalJson = res.json;
      
      res.json = async function(data) {
        // Determinar si es login o logout exitoso
        if (res.statusCode === 200) {
          if (req.originalUrl.includes('/login') && data.token) {
            await this.bitacoraService.registrarLogin(req, {
              email: data.usuario?.email || req.body.email
            }, true);
          } else if (req.originalUrl.includes('/logout')) {
            await this.bitacoraService.registrarLogout(req, req.user);
          }
        } else if (req.originalUrl.includes('/login')) {
          // Login fallido
          await this.bitacoraService.registrarLogin(req, {
            email: req.body.email || 'desconocido'
          }, false);
        }
        
        return originalJson.call(this, data);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Middleware específico para uploads de documentos
   */
  registrarUpload() {
    return async (req, res, next) => {
      // Ejecutar después de que multer procese el archivo
      const originalJson = res.json;
      
      res.json = async function(data) {
        if (res.statusCode === 200 && req.file && data.documento) {
          await this.bitacoraService.registrarCargaDocumento(
            req, 
            data.documento, 
            req.params.auditoria_id || req.body.auditoria_id
          );
        }
        
        return originalJson.call(this, data);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Middleware específico para ETL
   */
  registrarETL() {
    return async (req, res, next) => {
      const originalJson = res.json;
      
      res.json = async function(data) {
        if (req.originalUrl.includes('/etl/process') && data.job_id) {
          // Registrar inicio de procesamiento ETL
          await this.bitacoraService.registrarAccion(req, {
            tipo: 'ETL_PROCESAMIENTO',
            descripcion: `Procesamiento ETL iniciado: Job ${data.job_id}`,
            seccion: 'Procesamiento ETL',
            metadata: {
              job_id: data.job_id,
              archivo_nombre: req.file?.originalname,
              estimacion_tiempo: data.estimacion_tiempo
            },
            critico: true,
            tags: ['etl', 'inicio', 'job']
          });
        }
        
        return originalJson.call(this, data);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Middleware específico para accesos a dashboard
   */
  registrarDashboard() {
    return async (req, res, next) => {
      // Solo registrar accesos GET exitosos
      if (req.method === 'GET') {
        const originalJson = res.json;
        
        res.json = async function(data) {
          if (res.statusCode === 200) {
            const dashboardTipo = this.extraerTipoDashboard(req.originalUrl);
            await this.bitacoraService.registrarAccesoDashboard(
              req, 
              dashboardTipo, 
              req.query
            );
          }
          
          return originalJson.call(this, data);
        }.bind(this);
      }
      
      next();
    };
  }

  /**
   * Middleware para exclusiones específicas
   */
  excluirRutas(rutasExcluidas = []) {
    return (req, res, next) => {
      const rutaActual = req.originalUrl;
      
      // Verificar si la ruta debe ser excluida
      const esExcluida = rutasExcluidas.some(ruta => {
        if (typeof ruta === 'string') {
          return rutaActual.includes(ruta);
        } else if (ruta instanceof RegExp) {
          return ruta.test(rutaActual);
        }
        return false;
      });
      
      if (esExcluida) {
        req.bitacora = { registrar: false };
      }
      
      next();
    };
  }

  /**
   * Registrar según el tipo de request detectado
   */
  async registrarSegunTipo(req, res) {
    try {
      const url = req.originalUrl;
      const metodo = req.method;
      const status = res.statusCode;
      
      // Skip si no es exitoso (ya se registró el error)
      if (status >= 400) return;
      
      // Detectar tipo de acción según URL y método
      let accionData = null;
      
      if (url.includes('/documentos/') && metodo === 'PUT') {
        accionData = {
          tipo: 'DOCUMENTO_MODIFICACION',
          descripcion: `Documento modificado via ${metodo} ${url}`,
          seccion: 'Gestión de Documentos',
          critico: true
        };
      } else if (url.includes('/auditorias/') && metodo === 'POST') {
        accionData = {
          tipo: 'AUDITORIA_CREACION',
          descripcion: 'Nueva auditoría creada',
          seccion: 'Auditorías',
          critico: true
        };
      } else if (url.includes('/auditorias/') && metodo === 'PUT') {
        accionData = {
          tipo: 'AUDITORIA_MODIFICACION',
          descripcion: 'Auditoría modificada',
          seccion: 'Auditorías',
          critico: true
        };
      } else if (url.includes('/chat/') && metodo === 'POST') {
        accionData = {
          tipo: 'CHAT_MENSAJE',
          descripcion: 'Mensaje de chat enviado',
          seccion: 'Chat',
          critico: false
        };
      } else if (url.includes('/notificaciones/') && metodo === 'POST') {
        accionData = {
          tipo: 'NOTIFICACION_ENVIADA',
          descripcion: 'Notificación enviada',
          seccion: 'Notificaciones',
          critico: false
        };
      }
      
      // Registrar si se detectó una acción relevante
      if (accionData) {
        accionData.metadata = {
          url: url,
          metodo: metodo,
          status: status,
          duracion_ms: req.bitacora.respuesta ? 
            req.bitacora.respuesta.fin - req.bitacora.inicio : null
        };
        
        await this.bitacoraService.registrarAccion(req, accionData);
      }
      
    } catch (error) {
      console.error('❌ Error en middleware de bitácora:', error);
      // No lanzar error para no afectar el flujo
    }
  }

  /**
   * Extraer tipo de dashboard desde URL
   */
  extraerTipoDashboard(url) {
    if (url.includes('/dashboard/auditorias')) return 'auditorias';
    if (url.includes('/dashboard/etl')) return 'etl';
    if (url.includes('/dashboard/metricas')) return 'metricas';
    if (url.includes('/dashboard/compliance')) return 'compliance';
    if (url.includes('/dashboard')) return 'general';
    return 'desconocido';
  }

  /**
   * Configurar middleware de bitácora para toda la aplicación
   */
  static configurar(app) {
    const middleware = new BitacoraMiddleware();
    
    // Rutas que no requieren registro detallado
    const rutasExcluidas = [
      '/health',
      '/version',
      '/api/bitacora/', // Evitar recursión
      /\.(css|js|png|jpg|ico|svg)$/, // Assets estáticos
      '/favicon.ico'
    ];
    
    // Aplicar middleware de exclusión
    app.use(middleware.excluirRutas(rutasExcluidas));
    
    // Aplicar middleware principal
    app.use(middleware.registrarAccion());
    app.use(middleware.procesarRegistro());
    
    console.log('📝 Middleware de bitácora configurado correctamente');
    
    return middleware;
  }

  /**
   * Configurar middleware específico para rutas
   */
  static configurarRutas(app) {
    const middleware = new BitacoraMiddleware();
    
    // Middleware específico para autenticación
    app.use('/api/auth/', middleware.registrarAuth());
    
    // Middleware específico para uploads
    app.use('/api/*/upload', middleware.registrarUpload());
    app.use('/api/documentos', middleware.registrarUpload());
    
    // Middleware específico para ETL
    app.use('/api/etl/', middleware.registrarETL());
    
    // Middleware específico para dashboards
    app.use('/api/dashboard/', middleware.registrarDashboard());
    
    console.log('📝 Middleware específico de bitácora configurado');
    
    return middleware;
  }
}

module.exports = BitacoraMiddleware;