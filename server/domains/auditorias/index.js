// Exportar modelos
const models = require('./models');

// Exportar servicios
const auditoriasService = require('./services/auditorias.service');
const documentosService = require('./services/documentos.service');
const workflowService = require('./services/workflow.service');

// Exportar controladores
const auditoriasController = require('./controllers/auditorias.controller');

// Exportar rutas
const auditoriasRoutes = require('./routes/auditorias.routes');

/**
 * Inicializar módulo de auditorías
 */
const inicializarModulo = async () => {
  try {
    console.log('🔧 Inicializando módulo de auditorías...');
    
    // Configurar relaciones de modelos
    models.setupAssociations();
    console.log('✅ Relaciones de modelos configuradas');
    
    // Verificar que los servicios dependientes estén disponibles
    await verificarDependencias();
    console.log('✅ Dependencias verificadas');
    
    console.log('✅ Módulo de auditorías inicializado correctamente');
    
    return {
      models,
      services: {
        auditoriasService,
        documentosService,
        workflowService
      },
      controllers: {
        auditoriasController
      },
      routes: auditoriasRoutes
    };
    
  } catch (error) {
    console.error('❌ Error inicializando módulo de auditorías:', error);
    throw error;
  }
};

/**
 * Verificar dependencias del módulo
 */
const verificarDependencias = async () => {
  const dependencias = [];
  
  // Verificar módulo de chat (opcional)
  try {
    require('../../chat/chat.service');
    dependencias.push('✅ Chat service disponible');
  } catch (error) {
    dependencias.push('⚠️  Chat service no disponible (opcional)');
  }
  
  // Verificar módulo ETL (requerido para validaciones)
  try {
    require('../../etl/etl.service');
    dependencias.push('✅ ETL service disponible');
  } catch (error) {
    dependencias.push('❌ ETL service no disponible');
    throw new Error('ETL service es requerido para el módulo de auditorías');
  }
  
  // Verificar módulo IA (requerido para scoring)
  try {
    require('../../ia/ia.service');
    dependencias.push('✅ IA service disponible');
  } catch (error) {
    dependencias.push('❌ IA service no disponible');
    throw new Error('IA service es requerido para el módulo de auditorías');
  }
  
  // Verificar módulo de notificaciones (opcional)
  try {
    require('../../notifications/notifications.service');
    dependencias.push('✅ Notifications service disponible');
  } catch (error) {
    dependencias.push('⚠️  Notifications service no disponible (opcional)');
  }
  
  console.log('📋 Estado de dependencias:');
  dependencias.forEach(dep => console.log(`   ${dep}`));
};

/**
 * Obtener configuración del módulo
 */
const obtenerConfiguracion = () => {
  return {
    nombre: 'Módulo de Auditorías',
    version: '1.0.0',
    descripcion: 'Gestión completa del proceso de auditoría técnica con workflow de 8 etapas',
    autor: 'Portal de Auditorías Técnicas',
    dependencias: {
      requeridas: ['etl', 'ia'],
      opcionales: ['chat', 'notifications', 'dashboards']
    },
    endpoints: [
      'GET /api/auditorias',
      'POST /api/auditorias', 
      'GET /api/auditorias/:id',
      'PUT /api/auditorias/:id',
      'POST /api/auditorias/:id/avanzar-etapa',
      'GET /api/auditorias/:id/workflow',
      'GET /api/auditorias/:id/documentos',
      'POST /api/auditorias/:id/documentos/:seccion',
      'GET /api/auditorias/:id/timeline',
      'GET /api/auditorias/configuracion/secciones'
    ],
    modelos: [
      'Auditoria',
      'Documento', 
      'Bitacora',
      'Validacion',
      'Evaluacion'
    ],
    servicios: [
      'auditoriasService',
      'documentosService', 
      'workflowService'
    ]
  };
};

/**
 * Ejecutar migraciones (si es necesario)
 */
const ejecutarMigraciones = async () => {
  try {
    const { sequelize } = require('../../config/database');
    
    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await models.Auditoria.sync();
      await models.Documento.sync();
      await models.Bitacora.sync();
      await models.Validacion.sync();
      await models.Evaluacion.sync();
      
      console.log('✅ Modelos sincronizados con la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas del módulo
 */
const obtenerEstadisticas = async () => {
  try {
    const stats = {
      total_auditorias: await models.Auditoria.count(),
      auditorias_activas: await models.Auditoria.count({
        where: { activa: true, archivada: false }
      }),
      total_documentos: await models.Documento.count(),
      total_validaciones: await models.Validacion.count(),
      entradas_bitacora: await models.Bitacora.count(),
      ultima_actualizacion: new Date().toISOString()
    };
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
};

/**
 * Healthcheck del módulo
 */
const healthCheck = async () => {
  const health = {
    modulo: 'auditorias',
    estado: 'OK',
    timestamp: new Date().toISOString(),
    verificaciones: {}
  };
  
  try {
    // Verificar conexión a base de datos
    await models.Auditoria.findOne({ limit: 1 });
    health.verificaciones.base_datos = 'OK';
    
    // Verificar servicios
    health.verificaciones.servicios = {
      auditorias_service: typeof auditoriasService.crearNuevaAuditoria === 'function' ? 'OK' : 'ERROR',
      documentos_service: typeof documentosService.cargarDocumento === 'function' ? 'OK' : 'ERROR',
      workflow_service: typeof workflowService.validarTransicion === 'function' ? 'OK' : 'ERROR'
    };
    
    // Verificar directorio de uploads
    const fs = require('fs');
    const uploadDir = require('path').join(process.cwd(), 'uploads', 'auditorias');
    if (fs.existsSync(uploadDir)) {
      health.verificaciones.uploads_directory = 'OK';
    } else {
      health.verificaciones.uploads_directory = 'WARNING - Directorio no existe';
    }
    
  } catch (error) {
    health.estado = 'ERROR';
    health.error = error.message;
    health.verificaciones.error_general = error.message;
  }
  
  return health;
};

/**
 * Limpiar recursos del módulo
 */
const limpiarRecursos = async () => {
  try {
    console.log('🧹 Limpiando recursos del módulo de auditorías...');
    
    // Aquí se podrían cerrar conexiones, limpiar caches, etc.
    // Por ahora solo log
    
    console.log('✅ Recursos del módulo de auditorías limpiados');
  } catch (error) {
    console.error('❌ Error limpiando recursos:', error);
  }
};

module.exports = {
  // Funciones de ciclo de vida
  inicializarModulo,
  ejecutarMigraciones,
  limpiarRecursos,
  
  // Información del módulo
  obtenerConfiguracion,
  obtenerEstadisticas,
  healthCheck,
  
  // Componentes del módulo
  models,
  services: {
    auditoriasService,
    documentosService,
    workflowService
  },
  controllers: {
    auditoriasController
  },
  routes: auditoriasRoutes,
  
  // Exportaciones para compatibilidad
  Auditoria: models.Auditoria,
  Documento: models.Documento,
  Bitacora: models.Bitacora,
  Validacion: models.Validacion,
  Evaluacion: models.Evaluacion
};