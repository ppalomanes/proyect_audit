// /server/domains/chat/chat-real.service.js
const { Op } = require('sequelize');
const { 
  Workspace, 
  Canal, 
  Mensaje, 
  ParticipanteWorkspace, 
  LecturasMensaje, 
  ArchivosMensaje 
} = require('./models');

class ChatRealService {
  /**
   * Obtener workspaces de un usuario con canales y estadísticas
   */
  async getUserWorkspaces(usuario_id) {
    try {
      const participaciones = await ParticipanteWorkspace.findAll({
        where: { usuario_id },
        include: [
          {
            model: Workspace,
            as: 'workspace',
            where: { activo: true },
            include: [
              {
                model: Canal,
                as: 'canales',
                where: { archivado: false },
                order: [['orden', 'ASC'], ['created_at', 'ASC']],
                required: false
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const workspacesConEstadisticas = await Promise.all(
        participaciones.map(async (participacion) => {
          const workspace = participacion.workspace;
          
          // Enriquecer canales con estadísticas
          const canalesConEstadisticas = await Promise.all(
            workspace.canales.map(async (canal) => {
              const stats = await this.getCanalStatistics(canal.id, usuario_id);
              return {
                ...canal.toJSON(),
                mensajes_no_leidos: stats.mensajes_no_leidos,
                participantes_online: stats.participantes_online,
                ultimo_mensaje: stats.ultimo_mensaje,
                conversacion_id: canal.id // Para compatibilidad con frontend existente
              };
            })
          );

          return {
            ...workspace.toJSON(),
            canales: canalesConEstadisticas,
            mi_rol: participacion.rol,
            ultimo_acceso: participacion.ultimo_acceso_at
          };
        })
      );

      return workspacesConEstadisticas;

    } catch (error) {
      console.error('❌ Error obteniendo workspaces del usuario:', error);
      throw new Error('Error cargando espacios de trabajo');
    }
  }

  /**
   * Obtener estadísticas de un canal para un usuario
   */
  async getCanalStatistics(canal_id, usuario_id) {
    try {
      // Contar mensajes no leídos
      const ultimaLectura = await LecturasMensaje.findOne({
        where: { usuario_id },
        include: [
          {
            model: Mensaje,
            as: 'mensaje',
            where: { canal_id },
            attributes: ['created_at']
          }
        ],
        order: [['leido_at', 'DESC']]
      });

      const fechaUltimaLectura = ultimaLectura?.leido_at || new Date(0);

      const mensajes_no_leidos = await Mensaje.count({
        where: {
          canal_id,
          usuario_id: { [Op.ne]: usuario_id }, // Excluir mensajes propios
          created_at: { [Op.gt]: fechaUltimaLectura },
          eliminado: false
        }
      });

      return {
        mensajes_no_leidos,
        participantes_online: 0, // TODO: Implementar con WebSocket state
        ultimo_mensaje: null
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del canal:', error);
      return {
        mensajes_no_leidos: 0,
        participantes_online: 0,
        ultimo_mensaje: null
      };
    }
  }

  /**
   * Obtener mensajes de un canal con paginación
   */
  async getCanalMessages(canal_id, usuario_id, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        before_message_id = null,
        include_threads = false
      } = options;

      // Verificar que el usuario tiene acceso al canal
      const acceso = await this.verificarAccesoCanal(canal_id, usuario_id);
      if (!acceso) {
        throw new Error('No tienes acceso a este canal');
      }

      const whereConditions = {
        canal_id,
        eliminado: false
      };

      // Si queremos mensajes antes de un mensaje específico
      if (before_message_id) {
        const mensajeRef = await Mensaje.findByPk(before_message_id);
        if (mensajeRef) {
          whereConditions.created_at = { [Op.lt]: mensajeRef.created_at };
        }
      }

      // Por defecto, solo mensajes raíz (no replies de threads)
      if (!include_threads) {
        whereConditions.parent_mensaje_id = null;
      }

      const mensajes = await Mensaje.findAll({
        where: whereConditions,
        include: [
          {
            model: require('../../auth/models/Usuario.model'),
            as: 'usuario',
            attributes: ['id', 'nombre', 'email', 'avatar']
          },
          {
            model: ArchivosMensaje,
            as: 'archivos',
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      // Marcar mensajes como leídos
      await this.marcarMensajesComoLeidos(mensajes.map(m => m.id), usuario_id);

      // Transformar para compatibilidad con frontend existente
      const mensajesTransformados = mensajes.reverse().map(mensaje => ({
        id: mensaje.id,
        contenido: mensaje.contenido,
        usuario_id: mensaje.usuario_id,
        tipo: mensaje.tipo,
        created_at: mensaje.created_at,
        usuario_info: {
          id: mensaje.usuario.id,
          nombre: mensaje.usuario.nombre,
          avatar: mensaje.usuario.avatar || mensaje.usuario.nombre.substring(0, 2).toUpperCase()
        },
        archivos: mensaje.archivos || []
      }));

      return mensajesTransformados;

    } catch (error) {
      console.error('❌ Error obteniendo mensajes del canal:', error);
      throw new Error('Error cargando mensajes');
    }
  }

  /**
   * Enviar mensaje a un canal
   */
  async enviarMensaje(canal_id, usuario_id, contenido, tipo = 'TEXTO', archivos = [], parent_mensaje_id = null) {
    try {
      // Verificar acceso al canal
      const acceso = await this.verificarAccesoCanal(canal_id, usuario_id);
      if (!acceso) {
        throw new Error('No tienes acceso a este canal');
      }

      // Crear el mensaje
      const mensaje = await Mensaje.create({
        canal_id,
        usuario_id,
        parent_mensaje_id,
        tipo,
        contenido: contenido?.trim(),
        metadatos: await this.extraerMetadatos(contenido)
      });

      // Procesar archivos adjuntos si los hay
      if (archivos && archivos.length > 0) {
        await this.procesarArchivosAdjuntos(mensaje.id, archivos);
      }

      // Actualizar estadísticas del canal
      await this.actualizarEstadisticasCanal(canal_id);

      // Cargar mensaje completo con relaciones
      const mensajeCompleto = await Mensaje.findByPk(mensaje.id, {
        include: [
          {
            model: require('../../auth/models/Usuario.model'),
            as: 'usuario',
            attributes: ['id', 'nombre', 'email', 'avatar']
          },
          {
            model: ArchivosMensaje,
            as: 'archivos',
            required: false
          }
        ]
      });

      // Transformar para compatibilidad con frontend
      return {
        id: mensajeCompleto.id,
        contenido: mensajeCompleto.contenido,
        usuario_id: mensajeCompleto.usuario_id,
        tipo: mensajeCompleto.tipo,
        created_at: mensajeCompleto.created_at,
        usuario_info: {
          id: mensajeCompleto.usuario.id,
          nombre: mensajeCompleto.usuario.nombre,
          avatar: mensajeCompleto.usuario.avatar || mensajeCompleto.usuario.nombre.substring(0, 2).toUpperCase()
        },
        archivos: mensajeCompleto.archivos || []
      };

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw new Error('Error enviando mensaje');
    }
  }

  /**
   * Verificar acceso de usuario a un canal
   */
  async verificarAccesoCanal(canal_id, usuario_id) {
    try {
      const canal = await Canal.findByPk(canal_id, {
        include: [
          {
            model: Workspace,
            as: 'workspace',
            include: [
              {
                model: ParticipanteWorkspace,
                as: 'participantes',
                where: { usuario_id },
                required: true
              }
            ]
          }
        ]
      });

      if (!canal) {
        return false;
      }

      const participacion = canal.workspace.participantes[0];
      
      return {
        acceso: true,
        rol: participacion.rol,
        workspace_id: canal.workspace_id
      };

    } catch (error) {
      console.error('❌ Error verificando acceso al canal:', error);
      return false;
    }
  }

  /**
   * Marcar mensajes como leídos
   */
  async marcarMensajesComoLeidos(mensaje_ids, usuario_id) {
    try {
      if (!mensaje_ids || mensaje_ids.length === 0) return;

      const lecturas = mensaje_ids.map(mensaje_id => ({
        mensaje_id,
        usuario_id,
        leido_at: new Date()
      }));

      await LecturasMensaje.bulkCreate(lecturas, {
        ignoreDuplicates: true
      });

    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
    }
  }

  /**
   * Procesar archivos adjuntos
   */
  async procesarArchivosAdjuntos(mensaje_id, archivos) {
    try {
      const archivosData = archivos.map(archivo => ({
        mensaje_id,
        nombre_original: archivo.originalname,
        nombre_archivo: archivo.filename,
        ruta_archivo: archivo.path,
        tipo_mime: archivo.mimetype,
        tamaño_bytes: archivo.size,
        es_imagen: archivo.mimetype.startsWith('image/'),
        metadata: {
          encoding: archivo.encoding,
          upload_date: new Date()
        }
      }));

      await ArchivosMensaje.bulkCreate(archivosData);

    } catch (error) {
      console.error('❌ Error procesando archivos adjuntos:', error);
      throw new Error('Error procesando archivos');
    }
  }

  /**
   * Extraer metadatos del mensaje
   */
  async extraerMetadatos(contenido) {
    if (!contenido) return {};

    const metadatos = {};

    // Extraer menciones @usuario
    const menciones = contenido.match(/@(\w+)/g);
    if (menciones) {
      metadatos.menciones = menciones.map(m => m.substring(1));
    }

    return metadatos;
  }

  /**
   * Actualizar estadísticas del canal
   */
  async actualizarEstadisticasCanal(canal_id) {
    try {
      const totalMensajes = await Mensaje.count({
        where: { canal_id, eliminado: false }
      });

      await Canal.update({
        estadisticas: {
          total_mensajes: totalMensajes,
          ultimo_mensaje_at: new Date()
        }
      }, {
        where: { id: canal_id }
      });

    } catch (error) {
      console.error('❌ Error actualizando estadísticas del canal:', error);
    }
  }

  /**
   * Crear workspace para auditoría
   */
  async crearWorkspaceAuditoria(auditoria_id, nombre, creado_por) {
    try {
      const workspace = await Workspace.create({
        nombre,
        descripcion: `Workspace para la auditoría ${nombre}`,
        tipo: 'AUDITORIA',
        icono: '📋',
        color: '#7C3AED',
        auditoria_id,
        creado_por
      });

      // Crear canales por defecto
      const canalesDefault = [
        {
          nombre: 'general',
          nombre_display: 'General',
          descripcion: 'Canal principal para comunicación general',
          tipo: 'GENERAL',
          icono: '💬',
          orden: 1
        },
        {
          nombre: 'documentos',
          nombre_display: 'Documentos',
          descripcion: 'Compartir y revisar documentos de auditoría',
          tipo: 'DOCUMENTOS',
          icono: '📄',
          orden: 2
        },
        {
          nombre: 'seguimiento',
          nombre_display: 'Seguimiento',
          descripcion: 'Seguimiento de tareas y progreso',
          tipo: 'SEGUIMIENTO',
          icono: '📊',
          orden: 3
        }
      ];

      for (const canalData of canalesDefault) {
        await Canal.create({
          ...canalData,
          workspace_id: workspace.id,
          creado_por
        });
      }

      // Agregar creador como admin del workspace
      await ParticipanteWorkspace.create({
        workspace_id: workspace.id,
        usuario_id: creado_por,
        rol: 'ADMIN',
        agregado_por: creado_por
      });

      return workspace;

    } catch (error) {
      console.error('❌ Error creando workspace para auditoría:', error);
      throw new Error('Error creando espacio de trabajo');
    }
  }
}

module.exports = new ChatRealService();