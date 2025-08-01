# Claude.md - Módulo Auditorías

> **📍 Ubicación**: `/server/domains/auditorias/`
> 
> **🎯 Dominio**: Gestión completa del proceso de auditoría técnica - Workflow 8 etapas

## 🎯 Propósito

Este módulo implementa el **orquestador central** del Portal de Auditorías Técnicas, gestionando el flujo completo de auditoría desde la configuración inicial hasta la generación de resultados, con **8 etapas estructuradas**, **validación automática** del parque informático y **trazabilidad completa** mediante bitácora integrada.

### Responsabilidades Principales
- **Workflow de 8 etapas** con transiciones controladas y validaciones automáticas
- **Gestión de 13 tipos de documentos** con control de versiones integrado
- **Validación automática** de parque informático con 28 campos normalizados
- **Integración total** con módulos ETL, IA, Chat y Notificaciones
- **Sistema de bitácora** para trazabilidad completa de acciones
- **Configuración de períodos** semestrales (mayo/noviembre)

## 🏗️ Componentes Clave

### Controller Layer
- **`auditorias.controller.js`**: Endpoints CRUD y gestión de workflow
- **`etapas.controller.js`**: Control de transiciones y validaciones de etapa
- **`documentos.controller.js`**: Upload, versionado y validación de documentos

### Service Layer
- **`auditorias.service.js`**: Orquestador principal del proceso de auditoría
- **`workflow.service.js`**: Lógica de transiciones y validaciones de etapas
- **`documentos.service.js`**: Gestión inteligente de documentos y versiones
- **`validacion.service.js`**: Validaciones automáticas y reglas de negocio

### Workflow Engine (8 Etapas)
- **`workflow/etapa1-configuracion.js`**: Configuración del período de auditoría
- **`workflow/etapa2-notificacion.js`**: Notificación automática a proveedores
- **`workflow/etapa3-carga-presencial.js`**: Carga de 11 secciones obligatorias
- **`workflow/etapa4-carga-parque.js`**: Procesamiento ETL del parque informático
- **`workflow/etapa5-validacion.js`**: Validación automática con IA
- **`workflow/etapa6-revision.js`**: Revisión y evaluación por auditores
- **`workflow/etapa7-resultados.js`**: Generación y notificación de resultados
- **`workflow/etapa8-cierre.js`**: Cierre del ciclo y archivado

### Models (Sequelize)
- **`Auditoria.model.js`**: Modelo principal con metadata del proceso
- **`Etapa.model.js`**: Control de estados y transiciones
- **`Documento.model.js`**: Gestión de archivos con versionado
- **`Bitacora.model.js`**: Registro detallado de todas las acciones
- **`Validacion.model.js`**: Resultados de validaciones automáticas
- **`Evaluacion.model.js`**: Evaluaciones realizadas por auditores

### Validators
- **`validators/documentos.validator.js`**: Validación de formatos y tamaños
- **`validators/etapas.validator.js`**: Validación de requisitos por etapa
- **`validators/parque.validator.js`**: Validación de 28 campos del parque

## 💡 Fragmentos de Código Ilustrativos

### Orquestador Principal de Auditorías
```javascript
// auditorias.service.js - Servicio principal
class AuditoriasService {
  
  async crearNuevaAuditoria(datos, usuario) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Crear auditoría principal
      const auditoria = await Auditoria.create({
        codigo: await this.generarCodigoAuditoria(),
        proveedor_id: datos.proveedor_id,
        auditor_principal_id: datos.auditor_principal_id,
        fecha_programada: datos.fecha_programada,
        estado: 'CONFIGURACION',
        etapa_actual: 1,
        alcance: datos.alcance,
        observaciones: datos.observaciones,
        creado_por: usuario.id,
        fecha_creacion: new Date()
      }, { transaction });

      // 2. Inicializar estructura de etapas
      await this.inicializarEtapas(auditoria.id, transaction);

      // 3. Crear workspace de chat específico
      await chatService.crearWorkspaceAuditoria(auditoria.id, {
        nombre: `Auditoría ${auditoria.codigo}`,
        participantes: [datos.proveedor_id, datos.auditor_principal_id]
      });

      // 4. Registrar en bitácora
      await this.registrarAccion(auditoria.id, 'AUDITORIA_CREADA', {
        usuario_id: usuario.id,
        descripcion: `Nueva auditoría ${auditoria.codigo} creada`,
        datos_despues: auditoria
      });

      await transaction.commit();
      return auditoria;
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creando auditoría: ${error.message}`);
    }
  }

  async avanzarEtapa(auditoria_id, usuario, opciones = {}) {
    const auditoria = await Auditoria.findByPk(auditoria_id);
    if (!auditoria) throw new Error('Auditoría no encontrada');

    // Validar si puede avanzar
    const puedeAvanzar = await workflowService.validarTransicion(auditoria);
    if (!puedeAvanzar.valido) {
      throw new Error(`No puede avanzar: ${puedeAvanzar.razon}`);
    }

    const etapaAnterior = auditoria.etapa_actual;
    const etapaNueva = etapaAnterior + 1;

    // Ejecutar transición
    await auditoria.update({
      etapa_actual: etapaNueva,
      estado: this.obtenerEstadoPorEtapa(etapaNueva),
      fecha_ultima_actualizacion: new Date()
    });

    // Ejecutar acciones automáticas de la nueva etapa
    await workflowService.ejecutarAccionesEtapa(auditoria, etapaNueva);

    // Registrar transición
    await this.registrarAccion(auditoria_id, 'ETAPA_AVANZADA', {
      usuario_id: usuario.id,
      descripcion: `Avance de etapa ${etapaAnterior} → ${etapaNueva}`,
      datos_antes: { etapa: etapaAnterior },
      datos_despues: { etapa: etapaNueva }
    });

    return {
      etapa_anterior: etapaAnterior,
      etapa_nueva: etapaNueva,
      estado_nuevo: auditoria.estado
    };
  }
}
```

### Gestión Inteligente de Documentos
```javascript
// documentos.service.js - Gestión de documentos con versionado
class DocumentosService {
  
  async cargarDocumento(auditoria_id, seccion, archivo, metadatos, usuario) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Validar formato y tamaño
      const validacion = await this.validarArchivo(archivo, seccion);
      if (!validacion.valido) {
        throw new Error(`Archivo inválido: ${validacion.errores.join(', ')}`);
      }

      // 2. Generar nueva versión
      const versionAnterior = await Documento.findOne({
        where: { auditoria_id, seccion },
        order: [['version', 'DESC']]
      });
      
      const nuevaVersion = versionAnterior 
        ? this.incrementarVersion(versionAnterior.version)
        : '1.0';

      // 3. Guardar archivo físico
      const rutaArchivo = await this.guardarArchivo(archivo, {
        auditoria_id,
        seccion,
        version: nuevaVersion
      });

      // 4. Crear registro en base de datos
      const documento = await Documento.create({
        auditoria_id,
        seccion,
        nombre_original: archivo.originalname,
        nombre_archivo: path.basename(rutaArchivo),
        ruta_archivo: rutaArchivo,
        tamaño_bytes: archivo.size,
        tipo_mime: archivo.mimetype,
        version: nuevaVersion,
        fecha_revision: metadatos.fecha_revision,
        observaciones: metadatos.observaciones,
        cargado_por: usuario.id,
        fecha_carga: new Date(),
        estado: 'ACTIVO'
      }, { transaction });

      // 5. Marcar versión anterior como histórica
      if (versionAnterior) {
        await versionAnterior.update({ estado: 'HISTORICO' }, { transaction });
      }

      // 6. Registrar en bitácora
      await this.registrarAccion(auditoria_id, 'DOCUMENTO_CARGADO', {
        usuario_id: usuario.id,
        descripcion: `Documento ${seccion} v${nuevaVersion} cargado`,
        seccion: seccion,
        datos_despues: documento
      });

      await transaction.commit();
      return documento;
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

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
      porcentaje_completitud: (seccionesCargadas.length / seccionesObligatorias.length) * 100
    };
  }
}
```

### Motor de Workflow de 8 Etapas
```javascript
// workflow.service.js - Motor de transiciones
class WorkflowService {
  
  async validarTransicion(auditoria) {
    const etapaActual = auditoria.etapa_actual;
    const configuracionEtapa = ESTADOS_AUDITORIA[auditoria.estado];
    
    if (!configuracionEtapa) {
      return { valido: false, razon: 'Estado de auditoría inválido' };
    }

    // Validar requisitos específicos por etapa
    switch (etapaActual) {
      case 3: // CARGA_PRESENCIAL
        const documentosCompletos = await documentosService.validarDocumentosCompletos(auditoria.id);
        if (!documentosCompletos.completo) {
          return { 
            valido: false, 
            razon: `Documentos faltantes: ${documentosCompletos.secciones_faltantes.join(', ')}`
          };
        }
        break;

      case 4: // CARGA_PARQUE  
        const parqueValido = await this.validarParqueInformatico(auditoria.id);
        if (!parqueValido.valido) {
          return { valido: false, razon: parqueValido.razon };
        }
        break;

      case 6: // REVISION_AUDITOR
        const evaluacionCompleta = await this.validarEvaluacionCompleta(auditoria.id);
        if (!evaluacionCompleta.completa) {
          return { valido: false, razon: 'Evaluación de auditor incompleta' };
        }
        break;
    }

    return { valido: true };
  }

  async ejecutarAccionesEtapa(auditoria, nuevaEtapa) {
    switch (nuevaEtapa) {
      case 2: // NOTIFICACION
        await notificationsService.enviarNotificacionInicioAuditoria(auditoria);
        break;

      case 5: // VALIDACION_AUTOMATICA
        await this.ejecutarValidacionAutomatica(auditoria);
        break;

      case 7: // NOTIFICACION_RESULTADOS
        await this.generarYEnviarResultados(auditoria);
        break;

      case 8: // COMPLETADA
        await this.archivarAuditoria(auditoria);
        break;
    }
  }

  async ejecutarValidacionAutomatica(auditoria) {
    // 1. Ejecutar ETL del parque informático
    const resultadoETL = await etlService.procesarParqueInformatico(auditoria.id);
    
    // 2. Ejecutar scoring con IA
    const resultadoIA = await iaService.analizarDocumentosAuditoria(auditoria.id);
    
    // 3. Consolidar resultados
    const validacion = await Validacion.create({
      auditoria_id: auditoria.id,
      tipo: 'AUTOMATICA',
      resultado_etl: resultadoETL,
      resultado_ia: resultadoIA,
      score_general: this.calcularScoreGeneral(resultadoETL, resultadoIA),
      fecha_validacion: new Date()
    });

    return validacion;
  }
}
```

---

## 🔍 Patrones de Uso para Claude

### Desarrollo en este Módulo
1. **Consultar** este `Claude.md` para entender el workflow completo
2. **Examinar** modelos en `/models/` para relaciones de datos
3. **Revisar** `/workflow/` para lógica de etapas específicas
4. **Verificar** integración con chat en `/chat/chat.service.js`

### Debugging Común
- **Transiciones bloqueadas**: Verificar validaciones en `workflow.service.js`
- **Documentos no cargan**: Revisar configuración en `SECCIONES_DOCUMENTOS`
- **Bitácora faltante**: Validar middleware de registro automático
- **Notificaciones no llegan**: Verificar integración con módulo notifications

### Extensión del Módulo
- **Nuevas etapas**: Agregar en `ESTADOS_AUDITORIA` y crear workflow
- **Nuevos documentos**: Configurar en `SECCIONES_DOCUMENTOS`
- **Validaciones custom**: Extender `validacion.service.js`
- **Reportes adicionales**: Crear en `/reports/`

---

**📝 Generado automáticamente por**: Claude.md Strategy
**🔄 Última sincronización**: CI/CD Pipeline  
**📊 Estado**: ✅ Completo y Validado