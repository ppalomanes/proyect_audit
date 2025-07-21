const express = require('express');
const router = express.Router();

// Importar controladores
const chatController = require('./chat.controller');
const collaborationController = require('./chat-collaboration.controller');

const { 
  verificarToken, 
  verificarRol 
} = require('../auth/middleware/authentication');

const {
  validarCrearConversacion,
  validarEnviarMensaje,
  validarAgregarParticipante,
  validarMarcarLeido,
  validarParametrosConsulta,
  validarParametroId,
  validarAccesoAuditoria,
  validarRateLimitMensajes
} = require('./validators/chat.validators');

// Middleware global para todas las rutas de chat
router.use(verificarToken);

/**
 * ======================================
 * NUEVAS RUTAS DE COLABORACIÓN CLICKUP-STYLE
 * ======================================
 */

// === GESTIÓN DE ESPACIOS ===
router.get('/espacios', collaborationController.obtenerEspacios);
router.post('/espacios', collaborationController.crearEspacio);
router.get('/espacios/:id', collaborationController.obtenerEspacio);
router.put('/espacios/:id', collaborationController.actualizarEspacio);
router.delete('/espacios/:id', collaborationController.archivarEspacio);

// === GESTIÓN DE CANALES ===
router.get('/espacios/:id/canales', collaborationController.obtenerCanalesEspacio);
router.post('/espacios/:id/canales', collaborationController.crearCanal);

// === GESTIÓN DE MENSAJES EN CANALES ===
router.get('/canales/:id/mensajes', collaborationController.obtenerMensajesCanal);
router.post('/canales/:id/mensajes', collaborationController.enviarMensaje);
router.post('/canales/:id/read', collaborationController.marcarCanalComoLeido);

// === GESTIÓN DE PARTICIPANTES ===
router.get('/espacios/:id/participantes', collaborationController.obtenerParticipantesEspacio);
router.post('/espacios/:id/participantes', collaborationController.agregarParticipante);
router.delete('/espacios/:id/participantes/:userId', collaborationController.eliminarParticipante);

// === BÚSQUEDA Y ESTADÍSTICAS ===
router.get('/espacios/:id/buscar', collaborationController.buscarEnEspacio);
router.get('/espacios/:id/estadisticas', collaborationController.obtenerEstadisticasEspacio);

// === INTEGRACIÓN CON AUDITORÍAS ===
router.post('/auditorias/:id/espacio', collaborationController.crearEspacioParaAuditoria);

/**
 * ======================================
 * RUTAS LEGACY DE CONVERSACIONES (COMPATIBILIDAD)
 * ======================================
 */

// GET /api/chat/conversaciones - Obtener conversaciones del usuario
router.get('/conversaciones', 
  validarParametrosConsulta,
  chatController.obtenerConversaciones
);

// POST /api/chat/conversaciones - Crear nueva conversación
router.post('/conversaciones',
  verificarRol(['ADMIN', 'AUDITOR', 'SUPERVISOR']),
  validarCrearConversacion,
  validarAccesoAuditoria,
  chatController.crearConversacion
);

// GET /api/chat/conversaciones/:id - Obtener conversación específica
router.get('/conversaciones/:id',
  validarParametroId,
  chatController.obtenerConversacion
);

// GET /api/chat/conversaciones/:id/mensajes - Obtener mensajes de conversación
router.get('/conversaciones/:id/mensajes',
  validarParametroId,
  validarParametrosConsulta,
  chatController.obtenerMensajes
);

// POST /api/chat/conversaciones/:id/mensajes - Enviar mensaje (legacy)
router.post('/conversaciones/:id/mensajes',
  validarEnviarMensaje,
  validarRateLimitMensajes,
  chatController.enviarMensaje
);

// PUT /api/chat/mensajes/:id/leido - Marcar mensaje como leído
router.put('/mensajes/:id/leido',
  validarMarcarLeido,
  chatController.marcarComoLeido
);

// POST /api/chat/conversaciones/:id/participantes - Agregar participante
router.post('/conversaciones/:id/participantes',
  verificarRol(['ADMIN', 'AUDITOR', 'SUPERVISOR']),
  validarAgregarParticipante,
  chatController.agregarParticipante
);

/**
 * ======================================
 * ENDPOINTS DE UTILIDAD
 * ======================================
 */

// GET /api/chat/health - Health check del sistema de chat
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema de chat funcionando correctamente',
    timestamp: new Date().toISOString(),
    features: {
      espacios_colaboracion: true,
      canales_multiproposito: true,
      mensajeria_threads: true,
      pestanas_clickup: true,
      integracion_auditorias: true,
      busqueda_avanzada: true,
      estadisticas_tiempo_real: true
    },
    version: '2.0.0-clickup'
  });
});

// POST /api/chat/feedback - Endpoint para feedback del sistema
router.post('/feedback', (req, res) => {
  const { rating, comments, feature, user_id } = req.body;
  
  console.log('📝 Feedback recibido:', {
    user_id: req.usuario?.id || user_id,
    rating,
    feature,
    comments,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Feedback registrado correctamente'
  });
});

/**
 * ======================================
 * TESTING Y DESARROLLO
 * ======================================
 */

// POST /api/chat/test - Endpoint de testing (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', chatController.testChat);
  
  // GET /api/chat/mock-data - Obtener datos mock para testing
  router.get('/mock-data', (req, res) => {
    res.json({
      success: true,
      message: 'Datos mock para testing del sistema ClickUp-style',
      espacios_ejemplo: [
        {
          nombre: "Auditoría Proveedor ABC",
          tipo: "AUDITORIA",
          canales: ["General", "Equipo Auditores", "Comunicación Proveedor", "Documentos"]
        },
        {
          nombre: "Espacio del Equipo [ES]",
          tipo: "EQUIPO",
          canales: ["General Team", "Coordinación", "Recursos"]
        }
      ],
      pestanas_disponibles: [
        "Canal", "Publicaciones", "Lista", "Tablero", 
        "Calendario", "Gantt", "Tabla", "Vista", "Documentos", "Actividad"
      ],
      funcionalidades_implementadas: [
        "Threads y respuestas",
        "Menciones @usuario",
        "Reacciones emoji",
        "Archivos y multimedia",
        "Búsqueda semántica",
        "Notificaciones tiempo real",
        "Estados de lectura",
        "Permisos granulares",
        "Integración auditorías",
        "Estadísticas avanzadas"
      ]
    });
  });
}

/**
 * ======================================
 * MIDDLEWARE DE MANEJO DE ERRORES
 * ======================================
 */

router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de chat:', {
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    endpoint: req.originalUrl,
    method: req.method,
    user: req.usuario?.id,
    timestamp: new Date().toISOString()
  });
  
  // Error de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: error.errors,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Error de permisos
  if (error.message.includes('permisos') || 
      error.message.includes('autorizado') ||
      error.message.includes('acceso')) {
    return res.status(403).json({
      success: false,
      message: 'Sin permisos para realizar esta acción',
      code: 'FORBIDDEN_ACCESS'
    });
  }
  
  // Error de recurso no encontrado
  if (error.message.includes('no encontrado') || 
      error.message.includes('not found') ||
      error.message.includes('no existe')) {
    return res.status(404).json({
      success: false,
      message: 'Recurso no encontrado',
      code: 'RESOURCE_NOT_FOUND'
    });
  }
  
  // Error de conflicto (recurso ya existe)
  if (error.message.includes('ya existe') || 
      error.message.includes('conflicto') ||
      error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'El recurso ya existe o hay un conflicto',
      code: 'RESOURCE_CONFLICT'
    });
  }
  
  // Error de rate limiting
  if (error.message.includes('rate limit') || 
      error.message.includes('demasiadas solicitudes')) {
    return res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes. Intente nuevamente en unos momentos.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
  
  // Error de base de datos
  if (error.name === 'SequelizeError' || 
      error.name === 'DatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'Error de base de datos',
      code: 'DATABASE_ERROR'
    });
  }
  
  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    code: 'INTERNAL_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;