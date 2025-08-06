// server/domains/notificaciones/notificaciones.routes.js
const express = require('express');
const router = express.Router();

// Datos de prueba para notificaciones
const notificacionesPrueba = [
  {
    id: 1,
    titulo: 'Nueva auditoría asignada',
    mensaje: 'Se le ha asignado la auditoría AUD-2025-001 para el proveedor Demo S.A.S',
    tipo: 'info',
    prioridad: 'alta',
    usuario_id: 1,
    leida: false,
    fecha_creacion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    fecha_lectura: null,
    acciones: [
      {
        texto: 'Ver auditoría',
        url: '/auditorias/1'
      }
    ]
  },
  {
    id: 2,
    titulo: 'Documentos cargados',
    mensaje: 'El proveedor TechServ Colombia ha cargado nuevos documentos',
    tipo: 'success',
    prioridad: 'media',
    usuario_id: 1,
    leida: true,
    fecha_creacion: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
    fecha_lectura: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    acciones: [
      {
        texto: 'Revisar documentos',
        url: '/auditorias/2/documentos'
      }
    ]
  },
  {
    id: 3,
    titulo: 'Validación ETL completada',
    mensaje: 'El procesamiento del parque informático ha sido completado con éxito',
    tipo: 'success',
    prioridad: 'baja',
    usuario_id: 1,
    leida: false,
    fecha_creacion: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutos atrás
    fecha_lectura: null,
    acciones: [
      {
        texto: 'Ver resultados',
        url: '/etl/resultados'
      }
    ]
  },
  {
    id: 4,
    titulo: 'Error en análisis IA',
    mensaje: 'Hubo un problema procesando los documentos con IA. Revisión manual requerida.',
    tipo: 'error',
    prioridad: 'alta',
    usuario_id: 1,
    leida: false,
    fecha_creacion: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutos atrás
    fecha_lectura: null,
    acciones: [
      {
        texto: 'Ver detalles',
        url: '/ia-scoring/errores'
      }
    ]
  },
  {
    id: 5,
    titulo: 'Nuevo mensaje recibido',
    mensaje: 'TechServ Colombia ha enviado una consulta sobre la auditoría',
    tipo: 'info',
    prioridad: 'media',
    usuario_id: 1,
    leida: false,
    fecha_creacion: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutos atrás
    fecha_lectura: null,
    acciones: [
      {
        texto: 'Ver mensaje',
        url: '/chat'
      }
    ]
  }
];

// ===== RUTAS NOTIFICACIONES =====

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', (req, res) => {
  try {
    const { usuario_id, solo_no_leidas, limit = 10, tipo, leida, prioridad } = req.query;
    
    let notificaciones = [...notificacionesPrueba];
    
    // Filtrar por usuario si se especifica
    if (usuario_id) {
      notificaciones = notificaciones.filter(n => n.usuario_id === parseInt(usuario_id));
    }
    
    // Filtrar por tipo si se especifica
    if (tipo && tipo !== 'todas') {
      notificaciones = notificaciones.filter(n => n.tipo === tipo);
    }
    
    // Filtrar por estado leída si se especifica
    if (leida && leida !== 'todas') {
      const esLeida = leida === 'leidas';
      notificaciones = notificaciones.filter(n => n.leida === esLeida);
    }
    
    // Filtrar solo no leídas si se especifica (legacy)
    if (solo_no_leidas === 'true') {
      notificaciones = notificaciones.filter(n => !n.leida);
    }
    
    // Filtrar por prioridad si se especifica
    if (prioridad && prioridad !== 'todas') {
      notificaciones = notificaciones.filter(n => n.prioridad === prioridad);
    }
    
    // Ordenar por fecha más reciente
    notificaciones.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    
    // Limitar resultados
    notificaciones = notificaciones.slice(0, parseInt(limit));
    
    const noLeidas = notificacionesPrueba.filter(n => !n.leida).length;
    
    res.json({
      success: true,
      notificaciones: notificaciones,
      no_leidas: noLeidas,
      total: notificacionesPrueba.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo notificaciones',
      error: error.message
    });
  }
});

// PATCH /api/notifications/:id/read - Marcar notificación como leída
router.patch('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    
    const notificacion = notificacionesPrueba.find(n => n.id === parseInt(id));
    
    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    notificacion.leida = true;
    notificacion.fecha_lectura = new Date().toISOString();
    
    res.json({
      success: true,
      notificacion: notificacion,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marcando notificación',
      error: error.message
    });
  }
});

// PATCH /api/notifications/read-all - Marcar todas como leídas
router.patch('/read-all', (req, res) => {
  try {
    const { usuario_id } = req.body;
    
    let notificacionesActualizadas = 0;
    const ahora = new Date().toISOString();
    
    notificacionesPrueba.forEach(notificacion => {
      if ((!usuario_id || notificacion.usuario_id === parseInt(usuario_id)) && !notificacion.leida) {
        notificacion.leida = true;
        notificacion.fecha_lectura = ahora;
        notificacionesActualizadas++;
      }
    });
    
    res.json({
      success: true,
      notificaciones_actualizadas: notificacionesActualizadas,
      message: `${notificacionesActualizadas} notificaciones marcadas como leídas`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marcando notificaciones',
      error: error.message
    });
  }
});

// POST /api/notifications - Crear nueva notificación
router.post('/', (req, res) => {
  try {
    const nuevaNotificacion = {
      id: notificacionesPrueba.length + 1,
      fecha_creacion: new Date().toISOString(),
      fecha_lectura: null,
      leida: false,
      ...req.body
    };
    
    notificacionesPrueba.unshift(nuevaNotificacion);
    
    res.status(201).json({
      success: true,
      notificacion: nuevaNotificacion,
      message: 'Notificación creada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando notificación',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:id - Eliminar notificación
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const index = notificacionesPrueba.findIndex(n => n.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    const notificacionEliminada = notificacionesPrueba.splice(index, 1)[0];
    
    res.json({
      success: true,
      notificacion: notificacionEliminada,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error eliminando notificación',
      error: error.message
    });
  }
});

module.exports = router;
