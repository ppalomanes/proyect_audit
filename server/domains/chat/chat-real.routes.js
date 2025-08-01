// /server/domains/chat/chat-real.routes.js
const express = require('express');
const ChatRealController = require('./chat-real.controller');
const authenticateSimple = require('./middleware/auth-simple');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

const router = express.Router();
const chatController = new ChatRealController();

// Middleware para validar errores de express-validator
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Aplicar autenticación a todas las rutas
router.use(authenticateSimple);

// === WORKSPACES ===

/**
 * GET /api/chat/workspaces
 * Obtener workspaces del usuario autenticado
 */
router.get('/workspaces', chatController.getWorkspaces);

/**
 * POST /api/chat/workspaces/auditoria
 * Crear workspace para auditoría (solo admins/auditores)
 */
router.post('/workspaces/auditoria', [
  body('auditoria_id')
    .isInt({ min: 1 })
    .withMessage('auditoria_id debe ser un número entero positivo'),
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  handleValidationErrors
], chatController.crearWorkspaceAuditoria);

// === CANALES ===

/**
 * GET /api/chat/canales/:canal_id/mensajes
 * Obtener mensajes de un canal con paginación
 */
router.get('/canales/:canal_id/mensajes', [
  param('canal_id')
    .isInt({ min: 1 })
    .withMessage('canal_id debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit debe ser entre 1 y 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset debe ser mayor o igual a 0'),
  query('before_message_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('before_message_id debe ser un número entero positivo'),
  query('include_threads')
    .optional()
    .isBoolean()
    .withMessage('include_threads debe ser true o false'),
  handleValidationErrors
], chatController.getCanalMessages);

/**
 * POST /api/chat/canales/:canal_id/mensajes
 * Enviar mensaje a un canal
 */
router.post('/canales/:canal_id/mensajes', [
  ChatRealController.getUploadMiddleware(),
  param('canal_id')
    .isInt({ min: 1 })
    .withMessage('canal_id debe ser un número entero positivo'),
  body('contenido')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El contenido debe tener entre 1 y 2000 caracteres'),
  body('tipo')
    .optional()
    .isIn(['TEXTO', 'ARCHIVO', 'IMAGEN', 'SISTEMA', 'ANUNCIO'])
    .withMessage('tipo debe ser TEXTO, ARCHIVO, IMAGEN, SISTEMA o ANUNCIO'),
  body('parent_mensaje_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('parent_mensaje_id debe ser un número entero positivo'),
  handleValidationErrors
], ChatRealController.handleUploadError, chatController.enviarMensaje);

/**
 * PUT /api/chat/canales/:canal_id/leido
 * Marcar mensajes como leídos
 */
router.put('/canales/:canal_id/leido', [
  param('canal_id')
    .isInt({ min: 1 })
    .withMessage('canal_id debe ser un número entero positivo'),
  body('mensaje_ids')
    .isArray({ min: 1 })
    .withMessage('mensaje_ids debe ser un array con al menos un elemento'),
  body('mensaje_ids.*')
    .isInt({ min: 1 })
    .withMessage('Cada mensaje_id debe ser un número entero positivo'),
  handleValidationErrors
], chatController.marcarComoLeido);

/**
 * GET /api/chat/canales/:canal_id/stats
 * Obtener estadísticas de canal
 */
router.get('/canales/:canal_id/stats', [
  param('canal_id')
    .isInt({ min: 1 })
    .withMessage('canal_id debe ser un número entero positivo'),
  handleValidationErrors
], chatController.getCanalStats);

module.exports = router;