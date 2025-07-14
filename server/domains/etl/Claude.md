# Claude.md - Módulo ETL

> **📍 Ubicación**: `/server/domains/etl/`
> 
> **🎯 Dominio**: Motor ETL para Parque Informático - IMPLEMENTADO

## 🎯 Propósito

Este módulo implementa un **motor ETL robusto y completo** específicamente diseñado para procesar archivos Excel/CSV del **Parque Informático** de proveedores, normalizando 28 campos heterogéneos en un esquema estandarizado con **validación automática** de reglas de negocio y **scoring inteligente**.

### Responsabilidades Principales ✅ IMPLEMENTADAS
- **Parsing inteligente** de Excel/CSV con ExcelJS y detección automática de formato
- **Normalización** de 28 campos de hardware/software a esquema único
- **Validación** de reglas de negocio con motor personalizado
- **Procesamiento transaccional** con rollback automático en errores
- **Integración** con módulo auditorías para tracking completo
- **Reporte detallado** de inconsistencias y sugerencias de corrección

## 🏗️ Componentes Implementados

### Controller Layer ✅
- **`etl.controller.js`**: 4 endpoints principales implementados
- **Endpoints**: procesar, estadísticas, validar, configuración

### Service Layer ✅
- **`etl.service.js`**: Orquestador principal del proceso ETL completo
- **Métodos principales**: procesarParqueInformatico(), obtenerEstadisticasAuditoria()

### Parsers Especializados ✅
- **`/parsers/excel-parser.js`**: Parser Excel con ExcelJS, detección auto-formato
- **`/parsers/csv-parser.js`**: Parser CSV con encoding detection y delimiters
- **Funcionalidades**: Mapeo inteligente de campos, detección de headers automática

### Validators ✅
- **`/validators/schema-validator.js`**: Validación de esquema base (tipos, formatos)
- **`/validators/business-rules.js`**: 9 reglas de negocio específicas implementadas
- **Reglas incluidas**: RAM mínima, compatibilidad OS/navegador, conectividad

### Transformers ✅
- **`/transformers/field-normalizer.js`**: Normalización de 28 campos completa
- **Funcionalidades**: Conversión unidades, mapeo enums, limpieza de datos

### Models (Sequelize) ✅
- **`ParqueInformatico.model.js`**: Esquema normalizado de 28 campos implementado

### Routes ✅
- **`etl.routes.js`**: 4 rutas con autenticación y autorización

## 🔌 Interfaces/APIs Implementadas

### Endpoints ETL Principales

#### Procesamiento Principal ✅
```javascript
// Procesar archivo Excel/CSV completo
POST /api/etl/procesar
Authorization: Bearer <token>
Content-Type: application/json
Body: {
  documento_id: "uuid-documento",
  auditoria_id: "uuid-auditoria", 
  strict_mode: false,          // Permite datos incompletos
  auto_fix: true,              // Aplica correcciones automáticas  
  skip_validation: []          // Reglas a omitir
}

Response: {
  success: true,
  message: "Procesamiento ETL completado exitosamente",
  data: {
    exito: true,
    registros_procesados: 245,
    registros_originales: 250,
    validaciones: {
      errores: [...],
      advertencias: [...],
      scoreValidacion: 87
    },
    estadisticas: {
      distribucion_por_sitio: {...},
      hardware_stats: {...}
    }
  }
}
```

#### Estadísticas y Monitoreo ✅
```javascript
// Obtener estadísticas de auditoría
GET /api/etl/estadisticas/:auditoria_id
Authorization: Bearer <token>

Response: {
  success: true,
  data: {
    total_registros: 245,
    registros_validos: 238,
    score_calidad_promedio: 87,
    distribucion_por_sitio: {
      "BOGOTA": 120,
      "MEDELLIN": 85,
      "CALI": 40
    },
    hardware_stats: {
      ram_promedio: 8,
      cpu_brands: {
        "Intel": 180,
        "AMD": 65
      },
      os_distribution: {
        "Windows 10": 200,
        "Windows 11": 45
      }
    }
  }
}
```

#### Configuración y Metadatos ✅
```javascript
// Obtener configuración de campos ETL
GET /api/etl/configuracion
Authorization: Bearer <token>

Response: {
  success: true,
  data: {
    campos_requeridos: ["usuario_id", "proveedor", "sitio", "atencion"],
    campos_opcionales: ["hostname", "cpu_brand", ...],
    tipos_atencion: ["INBOUND", "OUTBOUND", "MIXTO", "CHAT", "EMAIL", "SOPORTE"],
    formatos_soportados: ["xlsx", "xls", "csv"],
    validaciones_activas: [
      {
        name: "ram_minima_requirement",
        description: "RAM mínima requerida según tipo de atención"
      },
      // ... 8 reglas más
    ]
  }
}
```

## 🔗 Dependencias

### Dependencias Internas ✅
- **`../auditorias/models/Auditoria.model.js`**: Integración con auditorías
- **`../auditorias/models/Documento.model.js`**: Gestión de documentos origen
- **`../../models/index.js`**: Acceso a modelos Sequelize
- **`../auth/middleware/`**: Autenticación y autorización

### Dependencias Externas ✅
- **`exceljs`**: Parsing avanzado de archivos Excel (XLSX, XLS)
- **`papaparse`**: Parsing robusto CSV con detección automática
- **`iconv-lite`**: Detección y conversión de encoding
- **`express-validator`**: Validación de endpoints

## ⚠️ Características Críticas Implementadas

### 1. **Esquema Normalizado de 28 Campos** ✅
```javascript
// Campos completamente implementados y validados
const CAMPOS_NORMALIZADOS = {
  // Metadatos: audit_id, audit_date, audit_cycle, audit_version
  // Identificación: proveedor, sitio, atencion, usuario_id, hostname  
  // Hardware CPU: cpu_brand, cpu_model, cpu_speed_ghz, cpu_cores
  // Hardware RAM: ram_gb, ram_type
  // Hardware Disco: disk_type, disk_capacity_gb
  // Software OS: os_name, os_version, os_architecture
  // Software Navegador: browser_name, browser_version
  // Software Antivirus: antivirus_brand, antivirus_version, antivirus_updated
  // Periféricos: headset_brand, headset_model
  // Conectividad: isp_name, connection_type, speed_download_mbps, speed_upload_mbps
};
```

### 2. **Mapeo Inteligente de Campos** ✅
```javascript
// Sistema de mapeo automático implementado
const FIELD_MAPPING = {
  usuario_id: ['usuario_id', 'id_usuario', 'user_id', 'cedula', 'documento'],
  ram_gb: ['ram_gb', 'memoria_ram', 'ram', 'memory_gb', 'memoria'],
  cpu_brand: ['cpu_brand', 'marca_cpu', 'processor_brand'],
  // ... 25 campos más con múltiples variaciones
};
```

### 3. **Reglas de Negocio Completas** ✅
```javascript
// 9 reglas de validación implementadas
const BUSINESS_RULES = [
  'ram_minima_requirement',      // RAM según tipo atención
  'cpu_performance_requirement', // Performance mínimo CPU
  'os_compatibility',           // Compatibilidad SO
  'browser_compatibility',      // Compatibilidad navegador
  'antivirus_requirement',      // Antivirus instalado
  'connectivity_requirement',   // Velocidades internet
  'disk_space_requirement',     // Espacio disco
  'headset_requirement',        // Audio para call center
  'data_completeness'           // Completitud datos básicos
];
```

### 4. **Procesamiento Transaccional** ✅
```javascript
// Implementado con rollback automático
const procesarParqueInformatico = async (documentoId, auditoriaId, opciones) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Parsear archivo
    // 2. Normalizar datos  
    // 3. Validar reglas
    // 4. Aplicar correcciones
    // 5. Insertar en BD
    // 6. Actualizar documento
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

### 5. **Normalización Inteligente por Campo** ✅
```javascript
// Ejemplos de normalización implementada
normalizeRamField("8 GB") → 8
normalizeRamField("4096 MB") → 4
normalizeCpuSpeedField("2.5 GHz") → 2.5
normalizeCpuSpeedField("2500 MHz") → 2.5
normalizeOsNameField("windows 10 pro") → "Windows 10"
normalizeBrowserNameField("google chrome") → "Chrome"
```

## 💡 Casos de Uso Implementados

### Caso 1: Procesamiento Excel Estándar ✅
```javascript
// Archivo: parque_informatico_proveedor.xlsx
// Resultado: 245 registros procesados, 238 válidos, score 87%
const resultado = await etlService.procesarParqueInformatico(
  "doc-uuid", 
  "audit-uuid",
  { auto_fix: true, strict_mode: false }
);
```

### Caso 2: Validación Estricta ✅
```javascript
// Solo acepta registros 100% válidos
const resultado = await etlService.procesarParqueInformatico(
  "doc-uuid",
  "audit-uuid", 
  { strict_mode: true, auto_fix: false }
);
```

### Caso 3: Procesamiento con Reglas Personalizadas ✅
```javascript
// Omitir validaciones específicas
const resultado = await etlService.procesarParqueInformatico(
  "doc-uuid",
  "audit-uuid",
  { skip_validation: ['antivirus_requirement', 'headset_requirement'] }
);
```

## 🔍 Patrones de Uso para Claude

### Desarrollo en este Módulo ✅
1. **Consultar** este `Claude.md` para entender el flujo ETL completo
2. **Examinar** `etl.service.js` para lógica principal implementada
3. **Revisar** `/parsers/` para procesamiento de archivos específicos
4. **Verificar** `/validators/` para reglas de negocio y esquema

### Debugging Común ✅
- **Campos no mapeados**: Verificar `excel-parser.js` fieldMappings
- **Validaciones fallan**: Revisar `business-rules.js` reglas específicas
- **Normalización incorrecta**: Verificar `field-normalizer.js` por tipo
- **Performance lenta**: Optimizar procesamiento por lotes

### Extensión del Módulo ✅
- **Nuevos formatos**: Agregar parser en `/parsers/` (JSON, XML)
- **Nuevas reglas**: Agregar en `business-rules.js` 
- **Nuevos campos**: Actualizar esquema en `ParqueInformatico.model.js`
- **Custom scoring**: Modificar `etl.service.js` cálculo scores

## 📊 Estado Actual

### ✅ COMPLETAMENTE IMPLEMENTADO
- **Servicio ETL principal**: 100% funcional
- **Parsers Excel/CSV**: Detección automática implementada
- **Normalización 28 campos**: Todas las transformaciones
- **9 reglas de negocio**: Validación completa
- **4 endpoints REST**: Con autenticación/autorización
- **Procesamiento transaccional**: Con rollback automático
- **Estadísticas y reportes**: Métricas detalladas

### 🚀 LISTO PARA PRODUCCIÓN
El módulo ETL está **completamente implementado** y listo para:
- Procesar archivos Excel/CSV de parque informático
- Validar datos según reglas de negocio específicas
- Generar estadísticas y reportes detallados
- Integrarse con el flujo de auditorías

---

**📝 Generado automáticamente por**: Claude.md Strategy
**🔄 Última actualización**: Implementación completa ETL Service
**📊 Estado**: ✅ PRODUCCIÓN - Módulo completamente funcional
