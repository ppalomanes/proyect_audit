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
  }
];

// ===== RUTAS NOTIFICACIONES =====

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', (req, res) => {
  try {
    const { usuario_id, solo_no_leidas, limit = 10 } = req.query;
    
    let notificaciones = [...notificacionesPrueba];
    
    // Filtrar por usuario si se especifica
    if (usuario_id) {
      notificaciones = notificaciones.filter(n => n.usuario_id === parseInt(usuario_id));
    }
    
    // Filtrar solo no leídas si se especifica
    if (solo_no_leidas === 'true') {
      notificaciones = notificaciones.filter(n => !n.leida);
    }
    
    // Limitar resultados
    notificaciones = notificaciones.slice(0, parseInt(limit));
    
    // Ordenar por fecha más reciente
    notificaciones.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    
    res.json({
      success: true,
      data: notificaciones,
      total_no_leidas: notificacionesPrueba.filter(n => !n.leida).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo notificaciones',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/marcar-leida - Marcar notificación como leída
router.put('/:id/marcar-leida', (req, res) => {
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
      data: notificacion,
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

// PUT /api/notifications/marcar-todas-leidas - Marcar todas como leídas
router.put('/marcar-todas-leidas', (req, res) => {
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
      data: {
        notificaciones_actualizadas: notificacionesActualizadas
      },
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
      data: nuevaNotificacion,
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

module.exports = router;
