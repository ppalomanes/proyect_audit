const { Op } = require('sequelize');

// === MOCK DATA PARA DESARROLLO ===
const USE_MOCK_DATA = true;

const MOCK_ESPACIOS = [
  {
    id: 1,
    nombre: "Auditoría Proveedor XYZ - Q1 2025",
    descripcion: "Espacio de colaboración para auditoría técnica",
    tipo: "AUDITORIA",
    estado: "ACTIVO",
    auditoria_id: 123,
    mi_rol: "ADMINISTRADOR",
    canales: [
      { id: 1, nombre: "General", icono: "💬", tipo: "GENERAL", mensajes_no_leidos: 5 },
      { id: 2, nombre: "Equipo Auditores", icono: "👥", tipo: "EQUIPO", mensajes_no_leidos: 2 },
      { id: 3, nombre: "Comunicación Proveedor", icono: "🏢", tipo: "PROVEEDOR", mensajes_no_leidos: 0 },
      { id: 4, nombre: "Documentos", icono: "📄", tipo: "DOCUMENTOS", mensajes_no_leidos: 3 }
    ]
  },
  {
    id: 2,
    nombre: "Espacio del Equipo [ES]",
    descripcion: "Chat grupal entre auditores",
    tipo: "EQUIPO",
    estado: "ACTIVO",
    mi_rol: "PARTICIPANTE",
    canales: [
      { id: 5, nombre: "General Team", icono: "🚀", tipo: "GENERAL", mensajes_no_leidos: 1 },
      { id: 6, nombre: "Coordinación", icono: "📋", tipo: "EQUIPO", mensajes_no_leidos: 0 }
    ]
  }
];

const MOCK_CANALES = [
  {
    id: 1,
    nombre: "General",
    descripcion: "Canal principal para discusiones generales",
    tipo: "GENERAL",
    icono: "💬",
    privado: false,
    espacio_id: 1,
    pestanas_habilitadas: {
      canal: true,
      publicaciones: true,
      lista: false,
      tablero: false,
      calendario: false,
      documentos: true,
      actividad: true
    }
  },
  {
    id: 2,
    nombre: "Equipo Auditores",
    descripcion: "Comunicación interna del equipo",
    tipo: "EQUIPO",
    icono: "👥",
    privado: true,
    espacio_id: 1,
    pestanas_habilitadas: {
      canal: true,
      publicaciones: false,
      lista: true,
      tablero: true,
      calendario: false,
      documentos: true,
      actividad: true
    }
  }
];

const MOCK_MENSAJES = [
  {
    id: 1,
    contenido: "Buenos días, iniciamos la auditoría técnica para el Q1 2025.",
    tipo: "TEXTO",
    canal_id: 1,
    autor: {
      id: 1,
      nombre: "Ana Martínez",
      email: "ana@portal.com",
      avatar: "AM"
    },
    creado_en: new Date(Date.now() - 3600000),
    reacciones: { "👍": [2, 3], "✅": [2] },
    thread_count: 2
  },
  {
    id: 2,
    contenido: "¡Buenísima! Confirmamos recepción. Tenemos listos todos los documentos.",
    tipo: "TEXTO",
    canal_id: 1,
    respuesta_a: 1,
    autor: {
      id: 2,
      nombre: "Carlos Ruiz",
      email: "carlos@proveedor.com",
      avatar: "CR"
    },
    creado_en: new Date(Date.now() - 1800000),
    reacciones: {}
  }
];

// === GESTIÓN DE ESPACIOS ===

/**
 * Obtener espacios del usuario
 */
const obtenerEspacios = async (usuarioId, filtros = {}) => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`📁 Obteniendo espacios para usuario ${usuarioId}`);
      return MOCK_ESPACIOS.filter(espacio => {
        if (filtros.tipo && espacio.tipo !== filtros.tipo) return false;
        if (filtros.estado && espacio.estado !== filtros.estado) return false;
        return true;
      });
    }

    // Implementación real con base de datos aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error obteniendo espacios:', error);
    throw error;
  }
};

/**
 * Crear nuevo espacio
 */
const crearEspacio = async (datosEspacio) => {
  try {
    if (USE_MOCK_DATA) {
      const nuevoEspacio = {
        id: Date.now(),
        ...datosEspacio,
        estado: 'ACTIVO',
        canales: []
      };
      
      MOCK_ESPACIOS.push(nuevoEspacio);
      console.log(`✅ Espacio mock creado: ${nuevoEspacio.nombre}`);
      return nuevoEspacio;
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error creando espacio:', error);
    throw error;
  }
};

/**
 * Obtener espacio específico
 */
const obtenerEspacio = async (espacioId, usuarioId) => {
  try {
    if (USE_MOCK_DATA) {
      const espacio = MOCK_ESPACIOS.find(e => e.id == espacioId);
      if (!espacio) {
        return null;
      }
      
      console.log(`📂 Obteniendo espacio ${espacioId} para usuario ${usuarioId}`);
      return {
        ...espacio,
        canales: MOCK_CANALES.filter(c => c.espacio_id == espacioId)
      };
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error obteniendo espacio:', error);
    throw error;
  }
};

/**
 * Actualizar espacio
 */
const actualizarEspacio = async (espacioId, actualizaciones, usuarioId) => {
  try {
    if (USE_MOCK_DATA) {
      const espacioIndex = MOCK_ESPACIOS.findIndex(e => e.id == espacioId);
      if (espacioIndex === -1) {
        throw new Error('Espacio no encontrado');
      }
      
      MOCK_ESPACIOS[espacioIndex] = {
        ...MOCK_ESPACIOS[espacioIndex],
        ...actualizaciones
      };
      
      console.log(`✅ Espacio mock actualizado: ${espacioId}`);
      return MOCK_ESPACIOS[espacioIndex];
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error actualizando espacio:', error);
    throw error;
  }
};

/**
 * Archivar espacio
 */
const archivarEspacio = async (espacioId, usuarioId) => {
  try {
    if (USE_MOCK_DATA) {
      const espacioIndex = MOCK_ESPACIOS.findIndex(e => e.id == espacioId);
      if (espacioIndex === -1) {
        throw new Error('Espacio no encontrado');
      }
      
      MOCK_ESPACIOS[espacioIndex].estado = 'ARCHIVADO';
      console.log(`🗃️ Espacio mock archivado: ${espacioId}`);
      return;
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error archivando espacio:', error);
    throw error;
  }
};

// === GESTIÓN DE CANALES ===

/**
 * Obtener canales del espacio
 */
const obtenerCanalesEspacio = async (espacioId, usuarioId, filtros = {}) => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`📺 Obteniendo canales del espacio ${espacioId}`);
      return MOCK_CANALES.filter(canal => {
        if (canal.espacio_id != espacioId) return false;
        if (filtros.tipo && canal.tipo !== filtros.tipo) return false;
        if (filtros.privado !== undefined && canal.privado !== filtros.privado) return false;
        return true;
      }).map(canal => ({
        ...canal,
        mensajes_no_leidos: Math.floor(Math.random() * 10),
        es_participante: true
      }));
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error obteniendo canales:', error);
    throw error;
  }
};

/**
 * Crear canal
 */
const crearCanal = async (datosCanal) => {
  try {
    if (USE_MOCK_DATA) {
      const nuevoCanal = {
        id: Date.now(),
        ...datosCanal,
        estado: 'ACTIVO',
        pestanas_habilitadas: {
          canal: true,
          publicaciones: true,
          lista: false,
          tablero: false,
          calendario: false,
          documentos: true,
          actividad: true
        }
      };
      
      MOCK_CANALES.push(nuevoCanal);
      console.log(`📺 Canal mock creado: ${nuevoCanal.nombre}`);
      return nuevoCanal;
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error creando canal:', error);
    throw error;
  }
};

// === GESTIÓN DE MENSAJES ===

/**
 * Obtener mensajes del canal
 */
const obtenerMensajesCanal = async (canalId, usuarioId, filtros = {}) => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`💬 Obteniendo mensajes del canal ${canalId}`);
      return MOCK_MENSAJES.filter(mensaje => {
        if (mensaje.canal_id != canalId) return false;
        if (filtros.tipo && mensaje.tipo !== filtros.tipo) return false;
        if (filtros.solo_threads && !mensaje.es_thread_principal) return false;
        return true;
      }).slice(0, filtros.limite || 50);
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
    throw error;
  }
};

/**
 * Enviar mensaje
 */
const enviarMensaje = async (datosMensaje) => {
  try {
    if (USE_MOCK_DATA) {
      const nuevoMensaje = {
        id: Date.now(),
        ...datosMensaje,
        autor: {
          id: datosMensaje.usuario_id,
          nombre: "Usuario Actual",
          email: "usuario@portal.com",
          avatar: "UA"
        },
        creado_en: new Date(),
        reacciones: {},
        thread_count: 0
      };
      
      MOCK_MENSAJES.push(nuevoMensaje);
      console.log(`💬 Mensaje mock enviado en canal ${datosMensaje.canal_id}`);
      return nuevoMensaje;
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    throw error;
  }
};

/**
 * Marcar canal como leído
 */
const marcarCanalComoLeido = async (canalId, usuarioId) => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`👁️ Canal mock ${canalId} marcado como leído por usuario ${usuarioId}`);
      return;
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error marcando como leído:', error);
    throw error;
  }
};

// === GESTIÓN DE PARTICIPANTES ===

/**
 * Obtener participantes del espacio
 */
const obtenerParticipantesEspacio = async (espacioId, filtros = {}) => {
  try {
    if (USE_MOCK_DATA) {
      const participantesMock = [
        {
          id: 1,
          usuario: { id: 1, nombre: "Ana Martínez", avatar: "AM" },
          rol: "ADMINISTRADOR",
          estado: "ACTIVO",
          fecha_union: new Date(Date.now() - 86400000 * 30)
        },
        {
          id: 2,
          usuario: { id: 2, nombre: "Carlos Ruiz", avatar: "CR" },
          rol: "PROVEEDOR",
          estado: "ACTIVO",
          fecha_union: new Date(Date.now() - 86400000 * 15)
        },
        {
          id: 3,
          usuario: { id: 3, nombre: "María González", avatar: "MG" },
          rol: "AUDITOR",
          estado: "ACTIVO",
          fecha_union: new Date(Date.now() - 86400000 * 10)
        }
      ];
      
      return participantesMock.filter(p => {
        if (filtros.rol && p.rol !== filtros.rol) return false;
        if (filtros.estado && p.estado !== filtros.estado) return false;
        return true;
      });
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error obteniendo participantes:', error);
    throw error;
  }
};

/**
 * Agregar participante al espacio
 */
const agregarParticipante = async (espacioId, usuarioId, rol, invitadoPor) => {
  try {
    if (USE_MOCK_DATA) {
      const nuevoParticipante = {
        id: Date.now(),
        usuario: { id: usuarioId, nombre: `Usuario ${usuarioId}`, avatar: `U${usuarioId}` },
        rol,
        estado: "ACTIVO",
        fecha_union: new Date(),
        invitado_por: invitadoPor
      };
      
      console.log(`👥 Participante mock agregado: Usuario ${usuarioId} al espacio ${espacioId}`);
      return nuevoParticipante;
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error agregando participante:', error);
    throw error;
  }
};

/**
 * Eliminar participante del espacio
 */
const eliminarParticipante = async (espacioId, usuarioId, eliminadoPor) => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`👤 Participante mock eliminado: Usuario ${usuarioId} del espacio ${espacioId}`);
      return;
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error eliminando participante:', error);
    throw error;
  }
};

// === BÚSQUEDA Y ESTADÍSTICAS ===

/**
 * Buscar en el espacio
 */
const buscarEnEspacio = async (espacioId, busqueda, usuarioId, filtros = {}) => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`🔍 Búsqueda mock en espacio ${espacioId}: "${busqueda}"`);
      
      return MOCK_MENSAJES.filter(mensaje => 
        mensaje.contenido.toLowerCase().includes(busqueda.toLowerCase())
      ).map(mensaje => ({
        ...mensaje,
        canal: MOCK_CANALES.find(c => c.id === mensaje.canal_id)
      })).slice(0, filtros.limite || 25);
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas del espacio
 */
const obtenerEstadisticasEspacio = async (espacioId, usuarioId) => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`📊 Obteniendo estadísticas mock del espacio ${espacioId}`);
      
      return {
        totales: {
          canales: 6,
          mensajes: 145,
          participantes: 8
        },
        participantes_activos: [
          { usuario: { id: 1, nombre: "Ana Martínez", avatar: "AM" }, ultima_actividad: new Date() },
          { usuario: { id: 2, nombre: "Carlos Ruiz", avatar: "CR" }, ultima_actividad: new Date(Date.now() - 3600000) },
          { usuario: { id: 3, nombre: "María González", avatar: "MG" }, ultima_actividad: new Date(Date.now() - 7200000) }
        ],
        canales_activos: [
          { id: 1, nombre: "General", icono: "💬", estadisticas: { total_mensajes: 45 } },
          { id: 2, nombre: "Equipo Auditores", icono: "👥", estadisticas: { total_mensajes: 32 } },
          { id: 3, nombre: "Documentos", icono: "📄", estadisticas: { total_mensajes: 28 } }
        ],
        mi_estadisticas: {
          rol: "ADMINISTRADOR",
          fecha_union: new Date(Date.now() - 86400000 * 30),
          ultima_actividad: new Date(),
          estadisticas_personales: {
            mensajes_enviados: 23,
            canales_activos: 4,
            tiempo_total_minutos: 1250
          }
        }
      };
    }

    // Implementación real aquí
    throw new Error('Base de datos no configurada. Usando datos mock.');
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
};

module.exports = {
  // Espacios
  obtenerEspacios,
  crearEspacio,
  obtenerEspacio,
  actualizarEspacio,
  archivarEspacio,
  
  // Canales
  obtenerCanalesEspacio,
  crearCanal,
  
  // Mensajes
  obtenerMensajesCanal,
  enviarMensaje,
  marcarCanalComoLeido,
  
  // Participantes
  obtenerParticipantesEspacio,
  agregarParticipante,
  eliminarParticipante,
  
  // Búsqueda y estadísticas
  buscarEnEspacio,
  obtenerEstadisticasEspacio
};
