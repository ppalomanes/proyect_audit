const { Documento, Bitacora } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configuración de secciones de documentos
const SECCIONES_DOCUMENTOS = {
  // Atención Presencial
  topologia: {
    nombre: 'Topología',
    obligatorio: false,
    formatos: ['PDF'],
    tamaño_max_mb: 10,
    descripcion: 'Diagrama de topología de red'
  },
  cuarto_tecnologia: {
    nombre: 'Cuarto de Tecnología',
    obligatorio: true,
    formatos: ['PDF', 'JPG', 'PNG', 'XLSX'],
    tamaño_max_mb: 25,
    descripcion: 'Fotografías e inventario del cuarto'
  },
  conectividad: {
    nombre: 'Conectividad',
    obligatorio: false,
    formatos: ['PDF'],
    tamaño_max_mb: 5,
    descripcion: 'Certificación de cableado'
  },
  energia: {
    nombre: 'Energía',
    obligatorio: true,
    formatos: ['PDF'],
    tamaño_max_mb: 15,
    descripcion: 'Mantenimiento UPS/generador y termografías'
  },
  temperatura_ct: {
    nombre: 'Temperatura CT',
    obligatorio: false,
    formatos: ['PDF'],
    tamaño_max_mb: 10,
    descripcion: 'Mantenimiento de climatización'
  },
  servidores: {
    nombre: 'Servidores',
    obligatorio: false,
    formatos: ['PDF', 'XLSX'],
    tamaño_max_mb: 10,
    descripcion: 'Detalles de software y servidores'
  },
  internet: {
    nombre: 'Internet',
    obligatorio: false,
    formatos: ['PDF', 'PNG', 'JPG'],
    tamaño_max_mb: 5,
    descripcion: 'Histograma de uso de ancho de banda'
  },
  seguridad_informatica: {
    nombre: 'Seguridad Informática',
    obligatorio: true,
    formatos: ['PDF'],
    tamaño_max_mb: 15,
    descripcion: 'Documentación de sistemas de seguridad'
  },
  personal_capacitado: {
    nombre: 'Personal Capacitado',
    obligatorio: false,
    formatos: ['PDF', 'XLSX'],
    tamaño_max_mb: 5,
    descripcion: 'Detalle de personal IT y horarios'
  },
  escalamiento: {
    nombre: 'Escalamiento',
    obligatorio: false,
    formatos: ['PDF'],
    tamaño_max_mb: 5,
    descripcion: 'Contactos y procedimientos'
  },
  informacion_entorno: {
    nombre: 'Información de Entorno',
    obligatorio: false,
    formatos: ['PDF', 'LOG', 'TXT'],
    tamaño_max_mb: 20,
    descripcion: 'Logs de navegación de usuarios'
  },
  // Parque Informático
  parque_hardware: {
    nombre: 'Hardware y Software',
    obligatorio: true,
    formatos: ['XLSX', 'XLS'],
    tamaño_max_mb: 50,
    descripcion: 'Inventario completo con formato estandarizado',
    validacion_especial: true
  }
};

class DocumentosService {

  /**
   * Configurar multer para upload de archivos
   */
  configurarUpload() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const { auditoria_id, seccion } = req.params;
        const directorioBase = path.join(process.cwd(), 'uploads', 'auditorias', auditoria_id, seccion);
        
        try {
          await fs.mkdir(directorioBase, { recursive: true });
          cb(null, directorioBase);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const nombreBase = path.basename(file.originalname, extension);
        const nombreSeguro = nombreBase.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}_${nombreSeguro}${extension}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      const { seccion } = req.params;
      const configSeccion = SECCIONES_DOCUMENTOS[seccion];
      
      if (!configSeccion) {
        return cb(new Error('Sección de documento no válida'));
      }

      const extension = path.extname(file.originalname).toLowerCase().substring(1);
      const formatosPermitidos = configSeccion.formatos.map(f => f.toLowerCase());
      
      if (!formatosPermitidos.includes(extension)) {
        return cb(new Error(`Formato no permitido. Formatos válidos: ${configSeccion.formatos.join(', ')}`));
      }

      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB límite general
      }
    });
  }

  /**
   * Cargar documento
   */
  async cargarDocumento(auditoria_id, seccion, archivo, metadatos, usuario) {
    // Validar sección
    const configSeccion = SECCIONES_DOCUMENTOS[seccion];
    if (!configSeccion) {
      throw new Error('Sección de documento no válida');
    }

    // Validar archivo
    const validacionArchivo = await this.validarArchivo(archivo, seccion);
    if (!validacionArchivo.valido) {
      throw new Error(`Archivo inválido: ${validacionArchivo.errores.join(', ')}`);
    }

    try {
      // Calcular hash del archivo
      const hashArchivo = await this.calcularHashArchivo(archivo.path);

      // Verificar si ya existe una versión con el mismo hash
      const documentoExistente = await Documento.findOne({
        where: {
          auditoria_id,
          seccion,
          hash_archivo: hashArchivo,
          estado: 'ACTIVO'
        }
      });

      if (documentoExistente) {
        // Eliminar archivo duplicado
        await fs.unlink(archivo.path);
        throw new Error('Este archivo ya fue cargado previamente');
      }

      // Obtener versión anterior
      const versionAnterior = await Documento.findOne({
        where: { auditoria_id, seccion, estado: 'ACTIVO' },
        order: [['version_mayor', 'DESC'], ['version_menor', 'DESC']]
      });

      // Calcular nueva versión
      let nuevaVersion = '1.0';
      let versionMayor = 1;
      let versionMenor = 0;

      if (versionAnterior) {
        if (metadatos.version_mayor) {
          versionMayor = versionAnterior.version_mayor + 1;
          versionMenor = 0;
        } else {
          versionMayor = versionAnterior.version_mayor;
          versionMenor = versionAnterior.version_menor + 1;
        }
        nuevaVersion = `${versionMayor}.${versionMenor}`;
      }

      // Crear registro del documento
      const documento = await Documento.create({
        auditoria_id,
        seccion,
        nombre_original: archivo.originalname,
        nombre_archivo: archivo.filename,
        ruta_archivo: archivo.path,
        tamaño_bytes: archivo.size,
        tipo_mime: archivo.mimetype,
        extension: path.extname(archivo.originalname).toLowerCase().substring(1),
        version: nuevaVersion,
        version_mayor: versionMayor,
        version_menor: versionMenor,
        fecha_revision: metadatos.fecha_revision || new Date(),
        observaciones: metadatos.observaciones,
        es_obligatorio: configSeccion.obligatorio,
        cargado_por: usuario.id,
        fecha_carga: new Date(),
        ip_carga: metadatos.ip,
        user_agent: metadatos.user_agent,
        hash_archivo: hashArchivo,
        estado: 'ACTIVO'
      });

      // Marcar versión anterior como histórica
      if (versionAnterior) {
        await versionAnterior.update({ estado: 'HISTORICO' });
      }

      // Validar documento si es necesario
      if (configSeccion.validacion_especial) {
        await this.ejecutarValidacionEspecial(documento);
      }

      // Registrar en bitácora
      await this.registrarAccionDocumento('DOCUMENTO_CARGADO', documento, usuario, {
        version_anterior: versionAnterior?.version,
        tamaño_archivo: archivo.size
      });

      return await this.obtenerDocumentoCompleto(documento.id);

    } catch (error) {
      // Limpiar archivo en caso de error
      try {
        await fs.unlink(archivo.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo tras fallo:', unlinkError);
      }
      throw error;
    }
  }

  /**
   * Obtener documentos de una auditoría
   */
  async obtenerDocumentosAuditoria(auditoria_id, filtros = {}) {
    const where = { auditoria_id };
    
    if (filtros.seccion) where.seccion = filtros.seccion;
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.solo_actuales) where.estado = 'ACTIVO';

    const documentos = await Documento.findAll({
      where,
      order: [['seccion', 'ASC'], ['version_mayor', 'DESC'], ['version_menor', 'DESC']]
    });

    // Agrupar por sección y enriquecer con metadatos
    const documentosPorSeccion = {};
    
    for (const doc of documentos) {
      if (!documentosPorSeccion[doc.seccion]) {
        documentosPorSeccion[doc.seccion] = {
          seccion: doc.seccion,
          nombre: SECCIONES_DOCUMENTOS[doc.seccion]?.nombre || doc.seccion,
          obligatorio: SECCIONES_DOCUMENTOS[doc.seccion]?.obligatorio || false,
          descripcion: SECCIONES_DOCUMENTOS[doc.seccion]?.descripcion || '',
          version_actual: null,
          versiones_historicas: [],
          estadisticas: {
            total_versiones: 0,
            tamaño_total: 0,
            ultima_actualizacion: null
          }
        };
      }

      const seccionInfo = documentosPorSeccion[doc.seccion];
      
      if (doc.estado === 'ACTIVO') {
        seccionInfo.version_actual = {
          ...doc.toJSON(),
          tamaño_humano: doc.obtenerTamañoHumano(),
          es_version_actual: true
        };
      } else {
        seccionInfo.versiones_historicas.push({
          ...doc.toJSON(),
          tamaño_humano: doc.obtenerTamañoHumano(),
          es_version_actual: false
        });
      }

      // Actualizar estadísticas
      seccionInfo.estadisticas.total_versiones++;
      seccionInfo.estadisticas.tamaño_total += doc.tamaño_bytes;
      
      if (!seccionInfo.estadisticas.ultima_actualizacion || 
          doc.fecha_carga > seccionInfo.estadisticas.ultima_actualizacion) {
        seccionInfo.estadisticas.ultima_actualizacion = doc.fecha_carga;
      }
    }

    return Object.values(documentosPorSeccion);
  }

  /**
   * Validar si todos los documentos obligatorios están completos
   */
  async validarDocumentosCompletos(auditoria_id) {
    const seccionesObligatorias = Object.keys(SECCIONES_DOCUMENTOS)
      .filter(s => SECCIONES_DOCUMENTOS[s].obligatorio);

    const documentosCargados = await Documento.findAll({
      where: { 
        auditoria_id,
        estado: 'ACTIVO'
      },
      attributes: ['seccion']
    });

    const seccionesCargadas = documentosCargados.map(d => d.seccion);
    const seccionesFaltantes = seccionesObligatorias.filter(s => 
      !seccionesCargadas.includes(s)
    );

    return {
      completo: seccionesFaltantes.length === 0,
      secciones_obligatorias: seccionesObligatorias.length,
      secciones_cargadas: seccionesCargadas.length,
      secciones_faltantes: seccionesFaltantes,
      porcentaje_completitud: Math.round((seccionesCargadas.length / seccionesObligatorias.length) * 100),
      detalle_secciones: seccionesObligatorias.map(s => ({
        seccion: s,
        nombre: SECCIONES_DOCUMENTOS[s].nombre,
        cargado: seccionesCargadas.includes(s)
      }))
    };
  }

  /**
   * Descargar documento
   */
  async descargarDocumento(documento_id, usuario) {
    const documento = await Documento.findByPk(documento_id);
    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    // Verificar que el archivo existe
    try {
      await fs.access(documento.ruta_archivo);
    } catch (error) {
      throw new Error('Archivo no encontrado en el sistema');
    }

    // Registrar descarga en bitácora
    await this.registrarAccionDocumento('DOCUMENTO_DESCARGADO', documento, usuario);

    return {
      ruta_archivo: documento.ruta_archivo,
      nombre_original: documento.nombre_original,
      tipo_mime: documento.tipo_mime,
      tamaño: documento.tamaño_bytes
    };
  }

  /**
   * Eliminar documento (marca como eliminado)
   */
  async eliminarDocumento(documento_id, usuario, razon = '') {
    const documento = await Documento.findByPk(documento_id);
    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    if (documento.estado === 'ELIMINADO') {
      throw new Error('El documento ya está eliminado');
    }

    // Marcar como eliminado (soft delete)
    await documento.update({ estado: 'ELIMINADO' });

    // Registrar eliminación en bitácora
    await this.registrarAccionDocumento('DOCUMENTO_ELIMINADO', documento, usuario, {
      razon_eliminacion: razon
    });

    return { eliminado: true, documento_id };
  }

  /**
   * Obtener historial de versiones de un documento
   */
  async obtenerHistorialVersiones(auditoria_id, seccion) {
    const versiones = await Documento.findAll({
      where: { auditoria_id, seccion },
      order: [['version_mayor', 'DESC'], ['version_menor', 'DESC']]
    });

    return versiones.map(doc => ({
      ...doc.toJSON(),
      tamaño_humano: doc.obtenerTamañoHumano(),
      es_version_actual: doc.esVersionActual(),
      tiempo_desde_carga: this.calcularTiempoDesdeCarga(doc.fecha_carga)
    }));
  }

  /**
   * Validar archivo según configuración de sección
   */
  async validarArchivo(archivo, seccion) {
    const configSeccion = SECCIONES_DOCUMENTOS[seccion];
    const errores = [];

    // Validar tamaño
    const tamañoMaxBytes = configSeccion.tamaño_max_mb * 1024 * 1024;
    if (archivo.size > tamañoMaxBytes) {
      errores.push(`El archivo excede el tamaño máximo de ${configSeccion.tamaño_max_mb}MB`);
    }

    // Validar extensión
    const extension = path.extname(archivo.originalname).toLowerCase().substring(1);
    const formatosPermitidos = configSeccion.formatos.map(f => f.toLowerCase());
    
    if (!formatosPermitidos.includes(extension)) {
      errores.push(`Formato ${extension} no permitido. Formatos válidos: ${configSeccion.formatos.join(', ')}`);
    }

    // Validaciones específicas por tipo de archivo
    if (extension === 'xlsx' || extension === 'xls') {
      const validacionExcel = await this.validarArchivoExcel(archivo);
      if (!validacionExcel.valido) {
        errores.push(...validacionExcel.errores);
      }
    }

    return {
      valido: errores.length === 0,
      errores,
      configuracion: configSeccion
    };
  }

  /**
   * Validar archivo Excel específicamente para parque informático
   */
  async validarArchivoExcel(archivo) {
    const errores = [];
    
    try {
      // Aquí se integraría con el módulo ETL para validación
      const etlService = require('../../etl/etl.service');
      const validacion = await etlService.validarFormatoExcel(archivo.path);
      
      if (!validacion.valido) {
        errores.push(...validacion.errores);
      }
      
    } catch (error) {
      errores.push('Error validando estructura del archivo Excel');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Ejecutar validación especial para ciertos tipos de documentos
   */
  async ejecutarValidacionEspecial(documento) {
    if (documento.seccion === 'parque_hardware') {
      try {
        // Marcar como pendiente de validación ETL
        await documento.update({ 
          validado: null,
          errores_validacion: { pendiente_etl: true }
        });

        // Programar validación ETL asíncrona
        const etlService = require('../../etl/etl.service');
        await etlService.programarValidacionArchivo(documento.id);
        
      } catch (error) {
        console.error('Error programando validación ETL:', error);
        await documento.update({ 
          validado: false,
          errores_validacion: { error: 'No se pudo programar validación automática' }
        });
      }
    }
  }

  /**
   * Obtener configuración de secciones
   */
  obtenerConfiguracionSecciones() {
    return SECCIONES_DOCUMENTOS;
  }

  /**
   * Obtener documento completo con metadatos
   */
  async obtenerDocumentoCompleto(documento_id) {
    const documento = await Documento.findByPk(documento_id);
    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    const configSeccion = SECCIONES_DOCUMENTOS[documento.seccion];
    
    return {
      ...documento.toJSON(),
      tamaño_humano: documento.obtenerTamañoHumano(),
      configuracion_seccion: configSeccion,
      tiempo_desde_carga: this.calcularTiempoDesdeCarga(documento.fecha_carga),
      es_version_actual: documento.esVersionActual()
    };
  }

  // Métodos auxiliares
  async calcularHashArchivo(rutaArchivo) {
    const hash = crypto.createHash('sha256');
    const data = await fs.readFile(rutaArchivo);
    hash.update(data);
    return hash.digest('hex');
  }

  async registrarAccionDocumento(tipoAccion, documento, usuario, detallesExtra = {}) {
    try {
      await Bitacora.registrar({
        auditoria_id: documento.auditoria_id,
        usuario_id: usuario.id,
        tipo_accion: tipoAccion,
        descripcion: `${tipoAccion.replace('_', ' ').toLowerCase()}: ${documento.nombre_original} (${documento.seccion})`,
        seccion: documento.seccion,
        datos_despues: {
          documento_id: documento.id,
          seccion: documento.seccion,
          version: documento.version,
          ...detallesExtra
        },
        categoria: 'OPERACIONAL',
        severidad: 'BAJA'
      });
    } catch (error) {
      console.error('Error registrando acción de documento:', error);
    }
  }

  calcularTiempoDesdeCarga(fechaCarga) {
    const ahora = new Date();
    const carga = new Date(fechaCarga);
    const diferencia = ahora - carga;
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (dias > 0) {
      return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else {
      return 'hace menos de 1 hora';
    }
  }
}

module.exports = new DocumentosService();