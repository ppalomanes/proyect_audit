/**
 * Servicio de Bitácora - Sistema de Registro Automático
 * Portal de Auditorías Técnicas
 * 
 * Maneja todo el registro automático de acciones y proporciona
 * funcionalidades de consulta y análisis de trazabilidad
 */

const { getModels } = require('../../models');

class BitacoraService {
  constructor() {
    this.models = null;
  }

  /**
   * Registrar una acción en la bitácora
   */
  async registrarAccion(req, accionData) {
    try {
      const { BitacoraEntry } = await getModels();
      
      // Extraer información del request
      const datosCompletos = {
        tipo: accionData.tipo,
        descripcion: accionData.descripcion,
        usuario: req.user ? {
          id: req.user.id,
          email: req.user.email,
          rol: req.user.rol
        } : null,
        ip: this.extractClientIP(req),
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID || req.session?.id,
        auditoria_id: accionData.auditoria_id || null,
        documento_id: accionData.documento_id || null,
        seccion: accionData.seccion || this.extractSeccionFromURL(req.originalUrl),
        datos_anteriores: accionData.datos_anteriores || null,
        datos_nuevos: accionData.datos_nuevos || null,
        metadata: {
          ...accionData.metadata,
          url: req.originalUrl,
          metodo: req.method,
          timestamp: new Date().toISOString()
        },
        resultado: accionData.resultado || 'EXITOSO',
        error: accionData.error || null,
        tags: accionData.tags || [],
        critico: accionData.critico || this.esAccionCritica(accionData.tipo)
      };

      const entrada = await BitacoraEntry.registrarAccion(datosCompletos);
      
      if (entrada) {
        console.log(`📝 Bitácora: ${datosCompletos.tipo} - ${datosCompletos.descripcion} [Usuario: ${datosCompletos.usuario?.email || 'Sistema'}]`);
      }

      return entrada;
    } catch (error) {
      console.error('❌ Error en servicio de bitácora:', error);
      // No lanzar error para no afectar el flujo principal
      return null;
    }
  }

  /**
   * Registrar login de usuario
   */
  async registrarLogin(req, usuario, exitoso = true) {
    const accionData = {
      tipo: 'LOGIN',
      descripcion: exitoso 
        ? `Login exitoso: ${usuario.email}` 
        : `Intento de login fallido: ${usuario.email}`,
      resultado: exitoso ? 'EXITOSO' : 'ERROR',
      metadata: {
        metodo_autenticacion: 'JWT',
        duracion_sesion: '24h'
      },
      critico: !exitoso, // Solo los fallos son críticos
      tags: ['autenticacion', 'sesion']
    };

    return this.registrarAccion(req, accionData);
  }

  /**
   * Registrar logout de usuario
   */
  async registrarLogout(req, usuario) {
    const accionData = {
      tipo: 'LOGOUT',
      descripcion: `Logout: ${usuario.email}`,
      metadata: {
        duracion_sesion_real: this.calcularDuracionSesion(req)
      },
      tags: ['autenticacion', 'sesion']
    };

    return this.registrarAccion(req, accionData);
  }

  /**
   * Registrar carga de documento
   */
  async registrarCargaDocumento(req, documento, auditoria_id) {
    const accionData = {
      tipo: 'DOCUMENTO_CARGA',
      descripcion: `Documento cargado: ${documento.nombre_original} (${documento.tipo_documento})`,
      auditoria_id: auditoria_id,
      documento_id: documento.id,
      seccion: 'Carga de Documentos',
      datos_nuevos: {
        documento_id: documento.id,
        nombre: documento.nombre_original,
        tipo: documento.tipo_documento,
        tamaño: documento.tamaño_archivo,
        ruta: documento.ruta_archivo
      },
      metadata: {
        mime_type: documento.mime_type,
        tamaño_mb: Math.round(documento.tamaño_archivo / 1024 / 1024 * 100) / 100
      },
      critico: true,
      tags: ['documento', 'carga', documento.tipo_documento]
    };

    return this.registrarAccion(req, accionData);
  }

  /**
   * Registrar modificación de documento
   */
  async registrarModificacionDocumento(req, documentoAnterior, documentoNuevo, auditoria_id) {
    const accionData = {
      tipo: 'DOCUMENTO_MODIFICACION',
      descripcion: `Documento modificado: ${documentoNuevo.nombre_original}`,
      auditoria_id: auditoria_id,
      documento_id: documentoNuevo.id,
      seccion: 'Gestión de Documentos',
      datos_anteriores: {
        nombre: documentoAnterior.nombre_original,
        estado: documentoAnterior.estado,
        observaciones: documentoAnterior.observaciones
      },
      datos_nuevos: {
        nombre: documentoNuevo.nombre_original,
        estado: documentoNuevo.estado,
        observaciones: documentoNuevo.observaciones
      },
      metadata: {
        campos_modificados: this.detectarCambios(documentoAnterior, documentoNuevo)
      },
      critico: true,
      tags: ['documento', 'modificacion', documentoNuevo.tipo_documento]
    };

    return this.registrarAccion(req, accionData);
  }

  /**
   * Registrar procesamiento ETL
   */
  async registrarProcesamientoETL(req, resultado, auditoria_id, documento_id) {
    const accionData = {
      tipo: 'ETL_PROCESAMIENTO',
      descripcion: `Procesamiento ETL ${resultado.exito ? 'exitoso' : 'fallido'}: ${resultado.registros_procesados} registros`,
      auditoria_id: auditoria_id,
      documento_id: documento_id,
      seccion: 'Procesamiento ETL',
      datos_nuevos: {
        registros_procesados: resultado.registros_procesados,
        registros_rechazados: resultado.registros_rechazados,
        estadisticas: resultado.estadisticas_completas
      },
      metadata: {
        columnas_detectadas: resultado.columnas_detectadas,
        version_procesador: '2.0-AVANZADO',
        score_calidad: resultado.validaciones?.scoreValidacion
      },
      resultado: resultado.exito ? 'EXITOSO' : 'ERROR',
      error: resultado.exito ? null : resultado.error,
      critico: true,
      tags: ['etl', 'procesamiento', 'parque-informatico']
    };

    return this.registrarAccion(req, accionData);
  }

  /**
   * Registrar evaluación de auditor
   */
  async registrarEvaluacion(req, evaluacion, auditoria_id) {
    const accionData = {
      tipo: 'EVALUACION_REALIZADA',
      descripcion: `Evaluación realizada para auditoría ${auditoria_id}`,
      auditoria_id: auditoria_id,
      seccion: 'Evaluación de Auditor',
      datos_nuevos: {
        estado_evaluacion: evaluacion.estado,
        observaciones: evaluacion.observaciones,
        calificacion: evaluacion.calificacion,
        fecha_evaluacion: new Date()
      },
      metadata: {
        tipo_evaluacion: evaluacion.tipo,
        secciones_evaluadas: evaluacion.secciones_evaluadas
      },
      critico: true,
      tags: ['evaluacion', 'auditor', 'calificacion']
    };

    return this.registrarAccion(req, accionData);
  }

  /**
   * Registrar acceso a dashboard
   */
  async registrarAccesoDashboard(req, dashboard_tipo, filtros = {}) {
    const accionData = {
      tipo: 'DASHBOARD_ACCESO',
      descripcion: `Acceso a dashboard: ${dashboard_tipo}`,
      seccion: 'Dashboard',
      metadata: {
        dashboard_tipo: dashboard_tipo,
        filtros_aplicados: filtros,
        timestamp_acceso: new Date().toISOString()
      },
      critico: false,
      tags: ['dashboard', 'consulta', dashboard_tipo]
    };

    return this.registrarAccion(req, accionData);
  }

  /**
   * Registrar envío de notificación
   */
  async registrarNotificacion(req, notificacion, destinatarios) {
    const accionData = {
      tipo: 'NOTIFICACION_ENVIADA',
      descripcion: `Notificación enviada: ${notificacion.asunto}`,
      auditoria_id: notificacion.auditoria_id || null,
      seccion: 'Notificaciones',
      datos_nuevos: {
        tipo_notificacion: notificacion.tipo,
        asunto: notificacion.asunto,
        destinatarios: destinatarios,
        canales: notificacion.canales
      },
      metadata: {
        cantidad_destinatarios: destinatarios.length,
        canales_envio: notificacion.canales
      },
      critico: notificacion.critica || false,
      tags: ['notificacion', 'comunicacion', notificacion.tipo]
    };

    return this.registrarAccion(req, accionData);
  }

  /**
   * Buscar entradas de bitácora con filtros
   */
  async buscarEntradas(filtros, paginacion = {}) {
    try {
      const { BitacoraEntry } = await getModels();
      
      const { page = 1, limit = 50 } = paginacion;
      const offset = (page - 1) * limit;

      const entradas = await BitacoraEntry.buscarConFiltros({
        ...filtros,
        limite: limit,
        offset: offset
      });

      // Contar total para paginación
      const total = await BitacoraEntry.count({
        where: this.buildWhereClause(filtros)
      });

      return {
        entradas: entradas.map(e => e.getResumen()),
        paginacion: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error buscando entradas de bitácora:', error);
      throw error;
    }
  }

  /**
   * Obtener bitácora específica de una auditoría
   */
  async obtenerBitacoraAuditoria(auditoria_id, incluirDetalles = false) {
    try {
      const { BitacoraEntry } = await getModels();
      
      const entradas = await BitacoraEntry.findAll({
        where: { auditoria_id: auditoria_id },
        order: [['fecha_accion', 'ASC']]
      });

      if (incluirDetalles) {
        return entradas.map(e => e.getContextoCompleto());
      } else {
        return entradas.map(e => e.getResumen());
      }
    } catch (error) {
      console.error('❌ Error obteniendo bitácora de auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de la bitácora
   */
  async obtenerEstadisticas(filtros = {}) {
    try {
      const { BitacoraEntry } = await getModels();
      return await BitacoraEntry.obtenerEstadisticas(filtros);
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de bitácora:', error);
      throw error;
    }
  }

  /**
   * Exportar bitácora para compliance
   */
  async exportarBitacora(filtros, formato = 'json') {
    try {
      const { BitacoraEntry } = await getModels();
      
      const entradas = await BitacoraEntry.buscarConFiltros({
        ...filtros,
        limite: 10000 // Límite alto para exportación
      });

      const datos = entradas.map(e => e.getContextoCompleto());

      switch (formato) {
        case 'json':
          return {
            formato: 'application/json',
            contenido: JSON.stringify(datos, null, 2),
            nombre_archivo: `bitacora_${new Date().toISOString().split('T')[0]}.json`
          };

        case 'csv':
          const csv = this.convertirACSV(datos);
          return {
            formato: 'text/csv',
            contenido: csv,
            nombre_archivo: `bitacora_${new Date().toISOString().split('T')[0]}.csv`
          };

        default:
          throw new Error(`Formato no soportado: ${formato}`);
      }
    } catch (error) {
      console.error('❌ Error exportando bitácora:', error);
      throw error;
    }
  }

  /**
   * Limpiar entradas antiguas
   */
  async limpiarEntradas(diasAntiguedad = 90) {
    try {
      const { BitacoraEntry } = await getModels();
      const eliminadas = await BitacoraEntry.limpiarEntradas(diasAntiguedad);
      
      console.log(`🧹 Bitácora: ${eliminadas} entradas eliminadas (> ${diasAntiguedad} días)`);
      return eliminadas;
    } catch (error) {
      console.error('❌ Error limpiando bitácora:', error);
      throw error;
    }
  }

  // === MÉTODOS AUXILIARES ===

  /**
   * Extraer IP del cliente considerando proxies
   */
  extractClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }

  /**
   * Extraer sección del sistema desde la URL
   */
  extractSeccionFromURL(url) {
    if (!url) return 'Desconocido';
    
    if (url.includes('/auth/')) return 'Autenticación';
    if (url.includes('/auditorias/')) return 'Auditorías';
    if (url.includes('/etl/')) return 'Procesamiento ETL';
    if (url.includes('/chat/')) return 'Chat';
    if (url.includes('/dashboard/')) return 'Dashboard';
    if (url.includes('/documentos/')) return 'Gestión de Documentos';
    if (url.includes('/notificaciones/')) return 'Notificaciones';
    
    return 'General';
  }

  /**
   * Determinar si una acción es crítica
   */
  esAccionCritica(tipo) {
    const accionesCriticas = [
      'DOCUMENTO_CARGA', 'DOCUMENTO_MODIFICACION', 'DOCUMENTO_ELIMINACION',
      'AUDITORIA_FINALIZACION', 'EVALUACION_REALIZADA',
      'ETL_PROCESAMIENTO', 'CONFIGURACION_CAMBIO',
      'USUARIO_CREACION', 'USUARIO_MODIFICACION'
    ];
    
    return accionesCriticas.includes(tipo);
  }

  /**
   * Detectar cambios entre dos objetos
   */
  detectarCambios(anterior, nuevo) {
    const cambios = [];
    
    for (const key in nuevo) {
      if (anterior[key] !== nuevo[key]) {
        cambios.push({
          campo: key,
          valor_anterior: anterior[key],
          valor_nuevo: nuevo[key]
        });
      }
    }
    
    return cambios;
  }

  /**
   * Calcular duración de sesión (aproximada)
   */
  calcularDuracionSesion(req) {
    if (req.session?.cookie?.originalMaxAge) {
      const ahora = new Date();
      const inicioSesion = new Date(ahora.getTime() - req.session.cookie.originalMaxAge);
      const duracion = Math.round((ahora - inicioSesion) / 1000 / 60); // minutos
      return `${duracion} minutos`;
    }
    return 'Desconocido';
  }

  /**
   * Construir cláusula WHERE para filtros
   */
  buildWhereClause(filtros) {
    const whereClause = {};
    
    if (filtros.usuario_id) whereClause.usuario_id = filtros.usuario_id;
    if (filtros.accion_tipo) whereClause.accion_tipo = filtros.accion_tipo;
    if (filtros.auditoria_id) whereClause.auditoria_id = filtros.auditoria_id;
    if (filtros.documento_id) whereClause.documento_id = filtros.documento_id;
    if (filtros.resultado) whereClause.resultado = filtros.resultado;
    if (filtros.es_critico !== undefined) whereClause.es_critico = filtros.es_critico;
    
    return whereClause;
  }

  /**
   * Convertir datos a formato CSV
   */
  convertirACSV(datos) {
    if (!datos || datos.length === 0) return '';
    
    const headers = [
      'Fecha', 'Usuario', 'Acción', 'Descripción', 'Resultado', 
      'IP', 'Sección', 'Auditoría ID', 'Documento ID'
    ];
    
    const rows = datos.map(d => [
      d.accion.fecha,
      d.usuario.email || 'Sistema',
      d.accion.tipo,
      d.accion.descripcion,
      d.accion.resultado,
      d.tecnico.ip,
      d.contexto.seccion,
      d.contexto.auditoria || '',
      d.contexto.documento || ''
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field || ''}"`).join(','))
      .join('\n');
  }
}

module.exports = BitacoraService;