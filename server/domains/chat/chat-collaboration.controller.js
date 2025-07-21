const express = require('express');
const {
  obtenerEspacios,
  crearEspacio,
  obtenerEspacio,
  actualizarEspacio,
  archivarEspacio,
  obtenerCanalesEspacio,
  crearCanal,
  obtenerMensajesCanal,
  enviarMensaje,
  obtenerParticipantesEspacio,
  agregarParticipante,
  eliminarParticipante,
  marcarCanalComoLeido,
  buscarEnEspacio,
  obtenerEstadisticasEspacio
} = require('./chat-collaboration.service');

const { authenticateToken } = require('../../auth/middleware/authentication');
const { validateChatInput } = require('./validators/chat.validators');

const router = express.Router();

// === GESTIÓN DE ESPACIOS ===

// GET /api/chat/espacios - Obtener espacios del usuario
router.get('/espacios', authenticateToken, async (req, res) => {
  try {
    const { usuario } = req;
    const { tipo, estado } = req.query;
    
    const espacios = await obtenerEspacios(usuario.id, { tipo, estado });
    
    res.json({
      success: true,
      espacios
    });
  } catch (error) {
    console.error('❌ Error obteniendo espacios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/chat/espacios - Crear nuevo espacio
router.post('/espacios', authenticateToken, validateChatInput, async (req, res) => {
  try {
    const { usuario } = req;
    const { auditoria_id, nombre, descripcion, tipo } = req.body;
    
    const espacio = await crearEspacio({
      auditoria_id,
      nombre,
      descripcion,
      tipo,
      propietario_id: usuario.id
    });
    
    res.status(201).json({
      success: true,
      espacio
    });
  } catch (error) {
    console.error('❌ Error creando espacio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/chat/espacios/:id - Obtener espacio específico
router.get('/espacios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    
    const espacio = await obtenerEspacio(id, usuario.id);
    
    if (!espacio) {
      return res.status(404).json({
        success: false,
        error: 'Espacio no encontrado'
      });
    }
    
    res.json({
      success: true,
      espacio
    });
  } catch (error) {
    console.error('❌ Error obteniendo espacio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/chat/espacios/:id - Actualizar espacio
router.put('/espacios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    const actualizaciones = req.body;
    
    const espacio = await actualizarEspacio(id, actualizaciones, usuario.id);
    
    res.json({
      success: true,
      espacio
    });
  } catch (error) {
    console.error('❌ Error actualizando espacio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

// DELETE /api/chat/espacios/:id - Archivar espacio
router.delete('/espacios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    
    await archivarEspacio(id, usuario.id);
    
    res.json({
      success: true,
      message: 'Espacio archivado correctamente'
    });
  } catch (error) {
    console.error('❌ Error archivando espacio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

// === GESTIÓN DE CANALES ===

// GET /api/chat/espacios/:id/canales - Obtener canales del espacio
router.get('/espacios/:id/canales', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    const { tipo, privado } = req.query;
    
    const canales = await obtenerCanalesEspacio(id, usuario.id, { tipo, privado });
    
    res.json({
      success: true,
      canales
    });
  } catch (error) {
    console.error('❌ Error obteniendo canales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/chat/espacios/:id/canales - Crear canal en espacio
router.post('/espacios/:id/canales', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    const { nombre, descripcion, tipo, privado, categoria } = req.body;
    
    const canal = await crearCanal({
      espacio_id: id,
      nombre,
      descripcion,
      tipo,
      privado: privado || false,
      categoria,
      creado_por: usuario.id
    });
    
    res.status(201).json({
      success: true,
      canal
    });
  } catch (error) {
    console.error('❌ Error creando canal:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// === GESTIÓN DE MENSAJES ===

// GET /api/chat/canales/:id/mensajes - Obtener mensajes del canal
router.get('/canales/:id/mensajes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    const { 
      limite = 50, 
      offset = 0, 
      tipo, 
      desde, 
      hasta,
      solo_threads = false 
    } = req.query;
    
    const mensajes = await obtenerMensajesCanal(id, usuario.id, {
      limite: parseInt(limite),
      offset: parseInt(offset),
      tipo,
      desde,
      hasta,
      solo_threads: solo_threads === 'true'
    });
    
    res.json({
      success: true,
      mensajes
    });
  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/chat/canales/:id/mensajes - Enviar mensaje
router.post('/canales/:id/mensajes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    const { 
      contenido, 
      tipo = 'TEXTO', 
      respuesta_a, 
      formato = 'PLAIN',
      prioridad = 'NORMAL',
      etiquetas = [],
      programado_para 
    } = req.body;
    
    const mensaje = await enviarMensaje({
      canal_id: id,
      usuario_id: usuario.id,
      contenido,
      tipo,
      respuesta_a,
      formato,
      prioridad,
      etiquetas,
      programado_para
    });
    
    res.status(201).json({
      success: true,
      mensaje
    });
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/chat/canales/:id/read - Marcar canal como leído
router.post('/canales/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    
    await marcarCanalComoLeido(id, usuario.id);
    
    res.json({
      success: true,
      message: 'Canal marcado como leído'
    });
  } catch (error) {
    console.error('❌ Error marcando como leído:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// === GESTIÓN DE PARTICIPANTES ===

// GET /api/chat/espacios/:id/participantes - Obtener participantes
router.get('/espacios/:id/participantes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, estado } = req.query;
    
    const participantes = await obtenerParticipantesEspacio(id, { rol, estado });
    
    res.json({
      success: true,
      participantes
    });
  } catch (error) {
    console.error('❌ Error obteniendo participantes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/chat/espacios/:id/participantes - Agregar participante
router.post('/espacios/:id/participantes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    const { usuario_id, rol = 'PARTICIPANTE' } = req.body;
    
    const participante = await agregarParticipante(id, usuario_id, rol, usuario.id);
    
    res.status(201).json({
      success: true,
      participante
    });
  } catch (error) {
    console.error('❌ Error agregando participante:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/chat/espacios/:id/participantes/:userId - Eliminar participante
router.delete('/espacios/:id/participantes/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { usuario } = req;
    
    await eliminarParticipante(id, userId, usuario.id);
    
    res.json({
      success: true,
      message: 'Participante eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando participante:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

// === BÚSQUEDA Y ESTADÍSTICAS ===

// GET /api/chat/espacios/:id/buscar - Buscar en el espacio
router.get('/espacios/:id/buscar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    const { q: busqueda, tipo, limite = 25 } = req.query;
    
    if (!busqueda || busqueda.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }
    
    const resultados = await buscarEnEspacio(id, busqueda, usuario.id, {
      tipo,
      limite: parseInt(limite)
    });
    
    res.json({
      success: true,
      resultados
    });
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/chat/espacios/:id/estadisticas - Obtener estadísticas
router.get('/espacios/:id/estadisticas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req;
    
    const estadisticas = await obtenerEstadisticasEspacio(id, usuario.id);
    
    res.json({
      success: true,
      estadisticas
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// === INTEGRACIÓN CON AUDITORÍAS ===

// POST /api/chat/auditorias/:id/espacio - Crear espacio para auditoría
router.post('/auditorias/:id/espacio', authenticateToken, async (req, res) => {
  try {
    const { id: auditoriaId } = req.params;
    const { usuario } = req;
    
    // Verificar que la auditoría existe (integración con módulo auditorías)
    // Esta funcionalidad se implementará cuando se integre con el módulo auditorías
    
    const espacio = await crearEspacio({
      auditoria_id: auditoriaId,
      nombre: `Auditoría ${auditoriaId}`,
      descripcion: `Espacio de colaboración para auditoría ${auditoriaId}`,
      tipo: 'AUDITORIA',
      propietario_id: usuario.id
    });
    
    res.status(201).json({
      success: true,
      espacio
    });
  } catch (error) {
    console.error('❌ Error creando espacio para auditoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
