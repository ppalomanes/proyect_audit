// /server/domains/chat/chat-real.controller.js
const chatRealService = require('./chat-real.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuración de multer para archivos adjuntos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/chat');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `chat-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 5 // Máximo 5 archivos por mensaje
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

class ChatRealController {
  
  /**
   * Obtener workspaces del usuario autenticado
   */
  async getWorkspaces(req, res) {
    try {
      const usuario_id = req.user.id;
      const workspaces = await chatRealService.getUserWorkspaces(usuario_id);

      res.json({
        success: true,
        data: workspaces,
        message: 'Workspaces obtenidos exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en getWorkspaces:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener mensajes de un canal con paginación
   */
  async getCanalMessages(req, res) {
    try {
      const { canal_id } = req.params;
      const usuario_id = req.user.id;
      const {
        limit = 50,
        offset = 0,
        before_message_id,
        include_threads = false
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        before_message_id: before_message_id ? parseInt(before_message_id) : null,
        include_threads: include_threads === 'true'
      };

      const mensajes = await chatRealService.getCanalMessages(canal_id, usuario_id, options);

      res.json({
        success: true,
        data: {
          mensajes,
          pagination: {
            limit: options.limit,
            offset: options.offset,
            has_more: mensajes.length === options.limit
          }
        }
      });

    } catch (error) {
      console.error('❌ Error en getCanalMessages:', error);
      res.status(error.message.includes('acceso') ? 403 : 500).json({
        success: false,
        message: error.message || 'Error obteniendo mensajes'
      });
    }
  }

  /**
   * Enviar mensaje a un canal
   */
  async enviarMensaje(req, res) {
    try {
      const { canal_id } = req.params;
      const usuario_id = req.user.id;
      const { contenido, tipo = 'TEXTO', parent_mensaje_id } = req.body;

      // Validaciones básicas
      if (!contenido || contenido.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El contenido del mensaje es requerido'
        });
      }

      if (contenido.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'El mensaje no puede exceder 2000 caracteres'
        });
      }

      // Procesar archivos adjuntos si los hay
      const archivos = req.files || [];

      const mensaje = await chatRealService.enviarMensaje(
        canal_id,
        usuario_id,
        contenido,
        tipo,
        archivos,
        parent_mensaje_id ? parseInt(parent_mensaje_id) : null
      );

      res.status(201).json({
        success: true,
        data: mensaje,
        message: 'Mensaje enviado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en enviarMensaje:', error);
      res.status(error.message.includes('acceso') ? 403 : 500).json({
        success: false,
        message: error.message || 'Error enviando mensaje'
      });
    }
  }

  /**
   * Marcar mensajes como leídos
   */
  async marcarComoLeido(req, res) {
    try {
      const { canal_id } = req.params;
      const usuario_id = req.user.id;
      const { mensaje_ids } = req.body;

      if (!Array.isArray(mensaje_ids) || mensaje_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de mensajes'
        });
      }

      await chatRealService.marcarMensajesComoLeidos(mensaje_ids, usuario_id);

      res.json({
        success: true,
        message: 'Mensajes marcados como leídos'
      });

    } catch (error) {
      console.error('❌ Error en marcarComoLeido:', error);
      res.status(500).json({
        success: false,
        message: 'Error marcando mensajes como leídos'
      });
    }
  }

  /**
   * Crear workspace para auditoría (solo admins)
   */
  async crearWorkspaceAuditoria(req, res) {
    try {
      const usuario_id = req.user.id;
      const { auditoria_id, nombre } = req.body;

      // Verificar que el usuario tiene permisos para crear workspaces
      if (req.user.rol !== 'ADMIN' && req.user.rol !== 'AUDITOR') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear workspaces'
        });
      }

      if (!auditoria_id || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'auditoria_id y nombre son requeridos'
        });
      }

      const workspace = await chatRealService.crearWorkspaceAuditoria(
        auditoria_id,
        nombre,
        usuario_id
      );

      res.status(201).json({
        success: true,
        data: workspace,
        message: 'Workspace creado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en crearWorkspaceAuditoria:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creando workspace'
      });
    }
  }

  /**
   * Obtener estadísticas de canal
   */
  async getCanalStats(req, res) {
    try {
      const { canal_id } = req.params;
      const usuario_id = req.user.id;

      // Verificar acceso
      const acceso = await chatRealService.verificarAccesoCanal(canal_id, usuario_id);
      if (!acceso) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este canal'
        });
      }

      const stats = await chatRealService.getCanalStatistics(canal_id, usuario_id);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Error en getCanalStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas del canal'
      });
    }
  }

  /**
   * Middleware para upload de archivos
   */
  static getUploadMiddleware() {
    return upload.array('archivos', 5);
  }

  /**
   * Middleware para manejo de errores de multer
   */
  static handleUploadError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande (máximo 10MB)'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Demasiados archivos (máximo 5 por mensaje)'
        });
      }
    }
    
    if (error.message === 'Tipo de archivo no permitido') {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido'
      });
    }

    next(error);
  }
}

module.exports = ChatRealController;