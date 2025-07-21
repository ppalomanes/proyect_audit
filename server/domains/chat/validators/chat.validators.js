const { body, param, query } = require('express-validator');

// Validaciones para crear conversación
const validarCrearConversacion = [
  body('auditoria_id')
    .isInt({ min: 1 })
    .withMessage('auditoria_id debe ser un entero positivo'),
  
  body('titulo')
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres')
    .trim(),
  
  body('tipo')
    .optional()
    .isIn(['AUDITORIA', 'SOPORTE', 'CONSULTA'])
    .withMessage('Tipo debe ser: AUDITORIA, SOPORTE o CONSULTA'),
  
  body('participantes')
    .optional()
    .isArray()
    .withMessage('Participantes debe ser un array'),
  
  body('participantes.*.usuario_id')
    .if(body('participantes').exists())
    .isInt({ min: 1 })
    .withMessage('usuario_id de participante debe ser un entero positivo'),
  
  body('participantes.*.rol')
    .optional()
    .isIn(['MODERADOR', 'PARTICIPANTE', 'OBSERVADOR'])
    .withMessage('Rol debe ser: MODERADOR, PARTICIPANTE u OBSERVADOR')
];

// Validaciones para enviar mensaje
const validarEnviarMensaje = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de conversación debe ser un entero positivo'),
  
  body('contenido')
    .isLength({ min: 1, max: 10000 })
    .withMessage('El contenido debe tener entre 1 y 10000 caracteres')
    .trim(),
  
  body('tipo')
    .optional()
    .isIn(['TEXTO', 'ARCHIVO', 'IMAGEN', 'SISTEMA'])
    .withMessage('Tipo debe ser: TEXTO, ARCHIVO, IMAGEN o SISTEMA'),
  
  body('respuesta_a')
    .optional()
    .isInt({ min: 1 })
    .withMessage('respuesta_a debe ser un entero positivo')
];

// Validaciones para agregar participante
const validarAgregarParticipante = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de conversación debe ser un entero positivo'),
  
  body('usuario_id')
    .isInt({ min: 1 })
    .withMessage('usuario_id debe ser un entero positivo'),
  
  body('rol')
    .optional()
    .isIn(['MODERADOR', 'PARTICIPANTE', 'OBSERVADOR'])
    .withMessage('Rol debe ser: MODERADOR, PARTICIPANTE u OBSERVADOR')
];

// Validaciones para marcar como leído
const validarMarcarLeido = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de mensaje debe ser un entero positivo'),
  
  body('conversacion_id')
    .isInt({ min: 1 })
    .withMessage('conversacion_id debe ser un entero positivo')
];

// Validaciones para parámetros de consulta
const validarParametrosConsulta = [
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser mayor o igual a 0'),
  
  query('estado')
    .optional()
    .isIn(['ACTIVA', 'ARCHIVADA', 'CERRADA'])
    .withMessage('Estado debe ser: ACTIVA, ARCHIVADA o CERRADA'),
  
  query('desde_mensaje_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('desde_mensaje_id debe ser un entero positivo')
];

// Validaciones para parámetros de ruta
const validarParametroId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID debe ser un entero positivo')
];

// Validación de archivo adjunto
const validarArchivo = [
  body('archivo_nombre')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nombre de archivo debe tener entre 1 y 255 caracteres'),
  
  body('archivo_tipo')
    .optional()
    .matches(/^(image|application|text)\//)
    .withMessage('Tipo de archivo no permitido'),
  
  body('archivo_tamaño')
    .optional()
    .isInt({ min: 1, max: 10485760 }) // 10MB máximo
    .withMessage('Tamaño de archivo debe ser entre 1 byte y 10MB')
];

// Función helper para validar permisos de auditoría
const validarAccesoAuditoria = async (req, res, next) => {
  try {
    const { auditoria_id } = req.body;
    const usuario_id = req.usuario.id;
    const rol = req.usuario.rol;

    // Lógica simplificada - en producción verificar contra BD
    if (rol === 'ADMIN') {
      return next(); // Admin tiene acceso total
    }

    if (rol === 'AUDITOR') {
      // Verificar que el auditor tenga acceso a la auditoría
      // TODO: Implementar verificación real con BD
      return next();
    }

    if (rol === 'PROVEEDOR') {
      // Verificar que el proveedor sea parte de la auditoría
      // TODO: Implementar verificación real con BD
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Sin permisos para acceder a esta auditoría'
    });

  } catch (error) {
    console.error('❌ Error validando acceso a auditoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validando permisos'
    });
  }
};

// Validación de rate limiting para mensajes
const validarRateLimitMensajes = (req, res, next) => {
  // Implementación simple de rate limiting
  // En producción usar redis o similar
  const usuario_id = req.usuario.id;
  const now = Date.now();
  
  if (!req.rateLimitStore) {
    req.rateLimitStore = new Map();
  }
  
  const userKey = `messages_${usuario_id}`;
  const userRequests = req.rateLimitStore.get(userKey) || [];
  
  // Filtrar requests de la última hora
  const recentRequests = userRequests.filter(timestamp => 
    now - timestamp < 3600000 // 1 hora
  );
  
  if (recentRequests.length >= 100) { // Máximo 100 mensajes por hora
    return res.status(429).json({
      success: false,
      message: 'Límite de mensajes excedido. Intenta más tarde.',
      retry_after: 3600
    });
  }
  
  // Agregar request actual
  recentRequests.push(now);
  req.rateLimitStore.set(userKey, recentRequests);
  
  next();
};

module.exports = {
  validarCrearConversacion,
  validarEnviarMensaje,
  validarAgregarParticipante,
  validarMarcarLeido,
  validarParametrosConsulta,
  validarParametroId,
  validarArchivo,
  validarAccesoAuditoria,
  validarRateLimitMensajes
};