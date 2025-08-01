# Claude.md - Módulo Control de Versiones

> **📍 Ubicación**: `/server/domains/versiones/`
> 
> **🎯 Dominio**: Sistema de control de versiones de documentos

## 🎯 Propósito

Este módulo implementa un **sistema de control de versiones completo** para documentos del Portal de Auditorías Técnicas, siguiendo las especificaciones del PDF "Módulos Adicionales". Proporciona versionado automático, historial completo, comparación de versiones y gestión de integridad de archivos.

### Responsabilidades Principales
- **Versionado automático** con numeración semántica (v1.0, v1.1, v2.0)
- **Historial completo** de cambios con metadatos de autoría
- **Comparación entre versiones** para identificar diferencias
- **Restauración de versiones** anteriores como versión actual
- **Gestión de estados** (borrador, final, en_revisión, aprobado, obsoleto)
- **Validación de integridad** con hashing SHA-256
- **Limpieza automática** de versiones antiguas
- **Integración con bitácora** para trazabilidad completa

## 🏗️ Componentes Clave

### Models
- **`DocumentVersion.model.js`**: Esquema completo de versiones con 28 campos
- Soporte para numeración semántica automática
- Metadatos de autoría, aprobación y contexto de auditoría
- Relaciones con Usuario, Documento y Auditoría

### Services
- **`versiones.service.js`**: Lógica de negocio para gestión de versiones
- Creación automática de versiones con incremento configurable
- Gestión de archivos físicos con hash de integridad
- Estadísticas y limpieza de versiones antiguas

### Controllers y Routes
- **`versiones.controller.js`**: Manejo de requests HTTP con validaciones
- **`versiones.routes.js`**: Definición de endpoints REST con autenticación
- Soporte para upload de archivos con Multer
- Validaciones específicas por operación

## 🔌 Interfaces/APIs

### Endpoints Principales

#### Gestión de Versiones
```javascript
// Crear nueva versión de documento
POST /api/versiones/:documento_id
Content-Type: multipart/form-data
Body: {
  archivo: File,
  comentarios?: string,
  tipo_incremento?: 'mayor'|'menor'|'patch',
  requiere_aprobacion?: boolean,
  auditoria_id?: number,
  etapa_auditoria?: string
}

// Obtener historial completo
GET /api/versiones/:documento_id/historial?limite=50&incluir_obsoletas=true

// Descargar versión específica
GET /api/versiones/:version_id/descargar

// Restaurar versión anterior
POST /api/versiones/:version_id/restaurar
Body: { comentarios?: string }

// Aprobar versión
PUT /api/versiones/:version_id/aprobar
Body: { comentarios?: string }
```

#### Comparación y Análisis
```javascript
// Comparar dos versiones
GET /api/versiones/comparar/:version_id_1/:version_id_2

// Estadísticas del sistema
GET /api/versiones/estadisticas?documento_id=123&fecha_desde=2024-01-01

// Validar integridad de archivos
GET /api/versiones/validar-integridad?documento_id=123
```

#### Mantenimiento
```javascript
// Limpiar versiones antiguas
DELETE /api/versiones/limpiar?mantener_ultimas=10&dias_antiguedad=30

// Health check del módulo
GET /api/versiones/health
```

## 🔗 Dependencias

### Dependencias Internas
- **`../bitacora/bitacora.service.js`**: Registro automático de acciones
- **`../auth/middleware/authentication.js`**: Autenticación y autorización
- **`../../config/database.js`**: Conexión y transacciones de BD

### Dependencias Externas
- **`multer`**: Upload y gestión de archivos
- **`crypto`**: Generación de hashes SHA-256 para integridad
- **`express-validator`**: Validación de datos de entrada
- **`sequelize`**: ORM para gestión de BD

## ⚠️ Peculiaridades y Consideraciones Críticas

### 1. **Numeración Semántica Automática**
```javascript
// Sistema de versionado automático
const tiposIncremento = {
  'mayor': { ejemplo: 'v1.5.2 → v2.0.0', uso: 'cambios incompatibles' },
  'menor': { ejemplo: 'v1.5.2 → v1.6.0', uso: 'nuevas funcionalidades' },
  'patch': { ejemplo: 'v1.5.2 → v1.5.3', uso: 'correcciones menores' }
};

// Solo una versión puede ser "actual" por documento
await DocumentVersion.update(
  { es_version_actual: false },
  { where: { documento_id: documentoId, es_version_actual: true } }
);
```

### 2. **Gestión de Archivos Físicos**
```javascript
// Estructura de almacenamiento
/uploads/versiones/
├── {documento_id}/
│   ├── v1.0.0_1640995200000.pdf
│   ├── v1.1.0_1641081600000.pdf
│   └── v2.0.0_1641168000000.pdf

// Hash de integridad para cada archivo
const hash = crypto.createHash('sha256').update(archivo.buffer).digest('hex');

// Verificación de duplicados por hash
const duplicado = await DocumentVersion.findOne({
  where: { documento_id: documentoId, hash_archivo: hash }
});
```

### 3. **Estados y Flujo de Aprobación**
```javascript
const estados = {
  'borrador': 'Versión en desarrollo, puede modificarse',
  'final': 'Versión completada, pendiente de revisión',
  'en_revision': 'Siendo evaluada por auditor',
  'aprobado': 'Aprobada oficialmente, no puede eliminarse',
  'obsoleto': 'Reemplazada por versión más reciente'
};

// Reglas de eliminación
const puedeEliminar = !version.es_version_actual && version.estado_version !== 'aprobado';
```

### 4. **Integración con Flujo de Auditoría**
```javascript
// Captura automática del contexto de auditoría
const nuevaVersion = await DocumentVersion.crearNuevaVersion(documentoId, {
  auditoria_id: auditoriaActual.id,
  etapa_auditoria: 'ETAPA_2_CARGA', // Según flujo de 8 etapas
  metadata_version: {
    etapa_descripcion: 'Carga inicial de documentos',
    usuario_rol: usuario.rol,
    ip_origen: req.ip
  }
});

// Registro automático en bitácora
await bitacoraService.registrarAccion(req, {
  tipo: 'DOCUMENTO_VERSION_NUEVA',
  descripcion: `Nueva versión ${nuevaVersion.numero_version} en ${etapaAuditoria}`,
  seccion: 'Control de Versiones',
  documento_id: documentoId,
  critico: true
});
```

### 5. **Validación de Integridad y Recuperación**
```javascript
// Validación periódica de integridad
const validarIntegridad = async () => {
  const versiones = await DocumentVersion.findAll();
  
  for (const version of versiones) {
    try {
      const buffer = await fs.readFile(version.ruta_archivo);
      const hashCalculado = crypto.createHash('sha256').update(buffer).digest('hex');
      
      if (hashCalculado !== version.hash_archivo) {
        console.error(`❌ Integridad comprometida: ${version.numero_version}`);
        // Marcar como corrupto y notificar
      }
    } catch (error) {
      console.error(`❌ Archivo no encontrado: ${version.ruta_archivo}`);
    }
  }
};
```

## 💡 Fragmentos de Código Ilustrativos

### Creación de Versión con Validaciones
```javascript
// versiones.service.js - Método principal
const crearVersion = async (documentoId, archivo, usuario, opciones = {}) => {
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Validar archivo y generar hash
    const hash = crypto.createHash('sha256').update(archivo.buffer).digest('hex');
    
    // 2. Verificar duplicados
    const existente = await DocumentVersion.findOne({
      where: { documento_id: documentoId, hash_archivo: hash }
    });
    
    if (existente) {
      throw new Error('Ya existe una versión con el mismo contenido');
    }
    
    // 3. Crear directorio si no existe
    const directorioDocumento = path.join(this.directorioBase, documentoId.toString());
    await this.asegurarDirectorio(directorioDocumento);
    
    // 4. Crear nueva versión en BD (con versionado automático)
    const nuevaVersion = await DocumentVersion.crearNuevaVersion(
      documentoId,
      {
        nombre_archivo: archivo.originalname,
        tamano_archivo: archivo.size,
        tipo_mime: archivo.mimetype,
        hash_archivo: hash,
        creado_por: usuario.id,
        creado_por_email: usuario.email,
        comentarios_version: opciones.comentarios,
        auditoria_id: opciones.auditoriaId,
        etapa_auditoria: opciones.etapaAuditoria
      },
      opciones.tipoIncremento // 'mayor', 'menor', 'patch'
    );
    
    // 5. Guardar archivo físico con nombre único
    const timestamp = Date.now();
    const extension = path.extname(archivo.originalname);
    const nombreArchivo = `v${nuevaVersion.version_mayor}.${nuevaVersion.version_menor}.${nuevaVersion.version_patch}_${timestamp}${extension}`;
    const rutaCompleta = path.join(directorioDocumento, nombreArchivo);
    
    await fs.writeFile(rutaCompleta, archivo.buffer);
    await nuevaVersion.update({ ruta_archivo: rutaCompleta });
    
    // 6. Registrar en bitácora
    await this.bitacoraService.registrarAccion(null, {
      tipo: 'DOCUMENTO_VERSION_NUEVA',
      descripcion: `Nueva versión ${nuevaVersion.numero_version} creada`,
      usuario: usuario,
      documento_id: documentoId,
      metadata: { version: nuevaVersion.numero_version, hash: hash },
      critico: true
    });
    
    await transaction.commit();
    return { success: true, version: nuevaVersion };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

### Comparación Inteligente de Versiones
```javascript
// Comparación con análisis de diferencias
const compararVersiones = async (versionId1, versionId2) => {
  const [version1, version2] = await Promise.all([
    DocumentVersion.findByPk(versionId1),
    DocumentVersion.findByPk(versionId2)
  ]);
  
  const comparacion = {
    version_antigua: version1.getResumen(),
    version_nueva: version2.getResumen(),
    diferencias: {
      cambio_mayor: version2.version_mayor !== version1.version_mayor,
      cambio_menor: version2.version_menor !== version1.version_menor,
      cambio_patch: version2.version_patch !== version1.version_patch,
      cambio_estado: version2.estado_version !== version1.estado_version,
      mismo_archivo: version2.hash_archivo === version1.hash_archivo,
      diferencia_tamaño: version2.tamano_archivo - version1.tamano_archivo,
      tiempo_transcurrido: version2.fecha_creacion - version1.fecha_creacion
    },
    recomendacion: this.generarRecomendacion(version1, version2)
  };
  
  return comparacion;
};
```

### Restauración Segura de Versiones
```javascript
// Restauración con validaciones de seguridad
const restaurarVersion = async (versionId, usuarioId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const versionARestaurar = await DocumentVersion.findByPk(versionId);
    
    if (!versionARestaurar) {
      throw new Error('Versión no encontrada');
    }
    
    // Verificar integridad del archivo antes de restaurar
    const archivoExiste = await fs.access(versionARestaurar.ruta_archivo)
      .then(() => true).catch(() => false);
      
    if (!archivoExiste) {
      throw new Error('Archivo físico no disponible para restauración');
    }
    
    // Validar hash si está disponible
    if (versionARestaurar.hash_archivo) {
      const buffer = await fs.readFile(versionARestaurar.ruta_archivo);
      const hashCalculado = crypto.createHash('sha256').update(buffer).digest('hex');
      
      if (hashCalculado !== versionARestaurar.hash_archivo) {
        throw new Error('Integridad del archivo comprometida, no se puede restaurar');
      }
    }
    
    // Marcar todas las versiones como no actuales
    await DocumentVersion.update(
      { es_version_actual: false },
      { 
        where: { documento_id: versionARestaurar.documento_id },
        transaction 
      }
    );
    
    // Crear nueva versión basada en la restaurada
    const nuevaVersion = await DocumentVersion.crearNuevaVersion(
      versionARestaurar.documento_id,
      {
        nombre_archivo: versionARestaurar.nombre_archivo,
        ruta_archivo: versionARestaurar.ruta_archivo, // Reutilizar archivo
        tamano_archivo: versionARestaurar.tamano_archivo,
        tipo_mime: versionARestaurar.tipo_mime,
        hash_archivo: versionARestaurar.hash_archivo,
        creado_por: usuarioId,
        tipo_cambio: 'restauracion',
        comentarios_version: `Restaurada desde versión ${versionARestaurar.numero_version}`,
        version_anterior_id: versionARestaurar.id
      },
      'menor' // Incremento menor por restauración
    );
    
    await transaction.commit();
    return nuevaVersion;
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

## 🔍 Patrones de Uso para Claude

### Desarrollo en este Módulo
1. **Consultar** este `Claude.md` para entender el sistema de versiones
2. **Examinar** `DocumentVersion.model.js` para el esquema completo
3. **Revisar** `versiones.service.js` para la lógica de negocio
4. **Verificar** integración con bitácora en todos los métodos

### Debugging Común
- **Versiones duplicadas**: Verificar lógica de hash en `crearVersion()`
- **Archivos faltantes**: Revisar `validarIntegridad()` y gestión de rutas
- **Permisos de eliminación**: Verificar `puedeSerEliminada()` en modelo
- **Versionado incorrecto**: Revisar `crearNuevaVersion()` y tipos de incremento

### Extensión del Módulo
- **Nuevos estados**: Agregar en ENUM `estado_version` del modelo
- **Nuevos tipos cambio**: Agregar en ENUM `tipo_cambio`
- **Nuevas validaciones**: Extender validadores en controller
- **Nuevos endpoints**: Agregar en `versiones.routes.js`

---

**📝 Generado automáticamente por**: Claude.md Strategy
**🔄 Última sincronización**: Implementación completa módulos adicionales
**📊 Estado**: ✅ Documentación completa y funcional