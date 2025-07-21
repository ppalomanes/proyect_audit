# Claude.md - Módulo ETL Frontend

> **📍 Ubicación**: `/client/src/domains/etl/`
> 
> **🎯 Dominio**: Interface de usuario para procesamiento ETL de Parque Informático

## 🎯 Propósito

Este módulo frontend implementa una **interface completa e intuitiva** para el procesamiento ETL de archivos Excel/CSV del parque informático, proporcionando **carga avanzada de archivos**, **monitoreo en tiempo real** del progreso y **validación visual** de reglas de negocio.

### Responsabilidades Principales
- **Interface de carga** con drag & drop para archivos Excel/CSV
- **Preview inteligente** de datos antes del procesamiento
- **Monitoreo visual** del progreso ETL en tiempo real con 7 etapas
- **Validación interactiva** con reglas de negocio configurables
- **Visualización de resultados** con métricas y estadísticas
- **Integración seamless** con motor ETL backend y sistema de temas

## 🏗️ Componentes Principales

### Componente Principal
- **`ETLProcessor.jsx`**: Orquestador principal con 3 pasos: Upload → Processing → Results
- **`etlStore.js`**: Estado global Zustand para gestión de datos ETL

### Componentes Especializados

#### ETLUploader Component
- **Ubicación**: `/components/ETLUploader.jsx`
- **Funcionalidad**: 
  - Drag & drop inteligente con validación automática
  - Preview de archivos CSV con headers y filas de muestra
  - Validación de tipo MIME y tamaño (máx 50MB)
  - Detección automática de formato Excel vs CSV
  - Interface visual con estados de error y éxito

#### ETLProgress Component  
- **Ubicación**: `/components/ETLProgress.jsx`
- **Funcionalidad**:
  - Timeline visual de 7 etapas: Parsing → Field Detection → Normalization → Validation → Scoring → Persistence → Complete
  - Barra de progreso animada con gradientes
  - Contadores en tiempo real de registros procesados
  - Estimación de tiempo transcurrido
  - Estados visuales con colores diferenciados por etapa

#### ExcelValidator Component
- **Ubicación**: `/components/ExcelValidator.jsx`
- **Funcionalidad**:
  - Tabs para Reglas, Campos Requeridos y Resultados
  - 6 reglas de negocio predefinidas (RAM, CPU, OS, Browser, Antivirus, Disk)
  - Visualización de 15 campos requeridos vs 28 totales
  - Categorización de issues: Críticos, Advertencias, Información
  - Score de validación con codificación por colores

## 🔄 Flujo de Interacción Usuario

### Paso 1: Carga de Archivo
```javascript
// Estado inicial - Drag & Drop Zone
<ETLUploader 
  onFileSelect={handleFileSelect}
  onFileRemove={handleFileRemove}
  processing={processing}
/>

// User Actions:
// 1. Arrastra archivo Excel/CSV al drop zone
// 2. O hace clic para abrir file picker
// 3. Sistema valida tipo MIME y tamaño
// 4. Preview automático para CSV (headers + 5 filas)
// 5. Configura opciones: strict_mode, auto_fix
// 6. Click "Procesar Archivo"
```

### Paso 2: Procesamiento
```javascript
// Monitoreo en tiempo real
<ETLProgress
  jobId={jobId}
  isProcessing={processing}
  onComplete={handleProcessingComplete}
  onError={handleProcessingError}
/>

// Progreso Visual:
// [📄 Parsing] → [🔍 Field Detection] → [⚙️ Normalization] 
// → [✅ Validation] → [📊 Scoring] → [💾 Persistence] → [🎉 Complete]

// Métricas en tiempo real:
// - % Progreso con barra animada
// - Tiempo transcurrido
// - Registros procesados vs total
// - Errores y advertencias detectados
```

### Paso 3: Resultados
```javascript
// Pantalla de resultados completa
<ResultsDisplay processResult={processResult} />

// Métricas principales:
// - Registros procesados exitosamente
// - Score de validación general
// - Desglose de errores/advertencias/info
// - Distribución por sitio y tipo de atención

// Acciones disponibles:
// - Descargar datos procesados
// - Exportar reporte de validación
// - Enviar a análisis IA
// - Iniciar nuevo procesamiento
```

## 🎨 Integración con Sistema de Temas

### Variables CSS Utilizadas
```css
/* Colores principales */
--accent-primary: #7B68EE      /* Botones principales */
--accent-secondary: #FD71AF    /* Hovers y secundarios */

/* Estados de validación */
--success: #10b981            /* Datos válidos */
--warning: #f59e0b            /* Advertencias */
--error: #ef4444              /* Errores críticos */
--info: #3b82f6               /* Información */

/* Backgrounds */
--bg-primary: tema dinámico    /* Cards principales */
--bg-secondary: tema dinámico  /* Fondo general */
--bg-tertiary: tema dinámico   /* Elementos internos */

/* Texto */
--text-primary: tema dinámico  /* Títulos */
--text-secondary: tema dinámico /* Descripción */
```

### Componentes Responsivos
- **Desktop**: Layout 3 columnas (2 columnas ETL + 1 columna validator)
- **Tablet**: Layout 2 columnas adaptativo
- **Mobile**: Stack vertical con componentes colapsibles

## 🔗 Integración Backend

### API Endpoints Utilizados
```javascript
// Configuración ETL
GET /api/etl/configuracion
Response: {
  campos_requeridos: string[],
  formatos_soportados: string[],
  validaciones_activas: ValidationRule[]
}

// Procesamiento de archivos
POST /api/etl/procesar
Body: {
  documento_id: string,
  auditoria_id: string,
  strict_mode?: boolean,
  auto_fix?: boolean
}

// Estadísticas de auditoría
GET /api/etl/estadisticas/:auditoriaId
Response: {
  hardware_stats: object,
  distribucion_por_sitio: object,
  distribucion_por_atencion: object
}
```

### Estado Global (Zustand)
```javascript
const useETLStore = create((set, get) => ({
  // Estado
  processing: false,
  processResult: null,
  statistics: null,
  configuration: null,
  error: null,

  // Acciones
  uploadAndProcess: async (file, auditoriaId, options) => {},
  getConfiguration: async () => {},
  getStatistics: async (auditoriaId) => {},
  clearError: () => {},
  clearResults: () => {}
}));
```

## 📊 Validaciones y Reglas de Negocio

### Reglas Predefinidas
```javascript
const BUSINESS_RULES = [
  {
    id: 'ram_requirement',
    field: 'ram_gb',
    operator: 'greaterThanInclusive',
    value: 4,
    severity: 'error'
  },
  {
    id: 'cpu_performance', 
    field: 'cpu_speed_ghz',
    operator: 'greaterThanInclusive',
    value: 2.5,
    severity: 'warning'
  },
  {
    id: 'os_compatibility',
    field: 'os_name',
    operator: 'in',
    value: ['Windows 10', 'Windows 11', 'Linux'],
    severity: 'error'
  }
  // ... 3 reglas adicionales
];
```

### Campos Requeridos (15 de 28)
- **Identificación**: proveedor, sitio, atencion, usuario_id
- **Hardware**: cpu_brand, cpu_model, cpu_speed_ghz, ram_gb, disk_type, disk_capacity_gb
- **Software**: os_name, os_version, browser_name, browser_version, antivirus_brand

## 💡 Fragmentos de Código Ilustrativos

### Upload con Preview Inteligente
```javascript
const previewFile = async (file) => {
  if (file.type === 'text/csv') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(0, 5);
        resolve({
          type: 'csv',
          headers: lines[0]?.split(',') || [],
          sampleRows: lines.slice(1).map(line => line.split(',')),
          totalLines: text.split('\n').length
        });
      };
      reader.readAsText(file, 'UTF-8');
    });
  }
  // Excel handling...
};
```

### Timeline de Progreso Dinámico
```javascript
const stages = [
  { id: 'PARSING', name: 'Analizando archivo', icon: '📄' },
  { id: 'FIELD_DETECTION', name: 'Detectando campos', icon: '🔍' },
  { id: 'NORMALIZATION', name: 'Normalizando datos', icon: '⚙️' },
  { id: 'VALIDATION', name: 'Validando reglas', icon: '✅' },
  { id: 'SCORING', name: 'Calculando scores', icon: '📊' },
  { id: 'PERSISTENCE', name: 'Guardando resultados', icon: '💾' },
  { id: 'COMPLETED', name: 'Procesamiento completado', icon: '🎉' }
];

// Renderizado dinámico con animaciones
{stages.map((stage, index) => {
  const isCompleted = getCurrentStageIndex() > index;
  const isCurrent = stage.id === currentStage;
  
  return (
    <StageIndicator
      key={stage.id}
      stage={stage}
      isCompleted={isCompleted}
      isCurrent={isCurrent}
      animate={isCurrent}
    />
  );
})}
```

### Validación Visual Categorizada
```javascript
const renderValidationIssues = (issues, category) => {
  return (
    <div className="space-y-3">
      {issues.map((issue, index) => (
        <div 
          key={index}
          className="border rounded-lg p-4"
          style={{
            backgroundColor: category.bgColor,
            borderColor: category.color
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="text-lg">{category.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {issue.campo && `Campo: ${issue.campo}`}
              </div>
              <p className="text-sm mt-1">{issue.mensaje}</p>
              {issue.accion_sugerida && (
                <div className="text-xs mt-2 p-2 rounded bg-opacity-10">
                  💡 Sugerencia: {issue.accion_sugerida}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🎯 Casos de Uso Principales

### 1. Auditor carga archivo Excel de parque informático
```
1. Auditor arrastra archivo .xlsx al drop zone
2. Sistema muestra preview básico (nombre, tamaño)
3. Auditor configura opciones: auto_fix = true, strict_mode = false
4. Click "Procesar Archivo"
5. Progress bar inicia con etapa "Parsing"
6. Sistema procesa 245 registros en 3 minutos
7. Resultados muestran: 238 válidos, 7 advertencias, score 92%
8. Auditor descarga datos procesados para siguiente etapa
```

### 2. Proveedor carga CSV con errores de formato
```
1. Proveedor selecciona archivo .csv
2. Preview muestra headers detectados y 5 filas de muestra
3. Sistema detecta problemas: "8GB" en lugar de "8"
4. Proveedor activa auto_fix = true
5. Procesamiento normaliza automáticamente valores
6. Validator muestra advertencias por campos inconsistentes
7. Proveedor revisa reglas de negocio en tab "Reglas"
8. Corrige archivo y reprocesa con mejores resultados
```

### 3. Supervisor revisa estadísticas agregadas
```
1. Supervisor accede a estadísticas post-procesamiento
2. Ve distribución por sitio: BOG-001 (45), MED-002 (38)
3. Hardware stats: RAM promedio 6.4GB
4. Identifica sitios con equipos por debajo de estándares
5. Exporta reporte para planificación de upgrades
```

## ⚠️ Consideraciones Técnicas

### Performance
- **Lazy loading** de componentes ETL para optimizar bundle size
- **Debounced file validation** para evitar validaciones múltiples
- **Memoización** de componentes pesados (ExcelValidator)
- **Virtual scrolling** para listas grandes de resultados

### Accesibilidad
- **ARIA labels** en dropzones y progress bars
- **Keyboard navigation** completa en todos los componentes
- **Screen reader** compatible con anuncios de progreso
- **High contrast** support en todos los temas

### Error Handling
- **Graceful degradation** si backend ETL no está disponible
- **Retry logic** para uploads fallidos
- **Offline indicators** cuando sin conexión
- **Detailed error messages** con acciones sugeridas

---

## 🔍 Patrones de Uso para Claude

### Desarrollo en este Módulo
1. **Consultar** este `Claude.md` para entender flujo completo de ETL frontend
2. **Revisar** componentes en `/components/` para funcionalidad específica
3. **Verificar** integración con `etlStore.js` para gestión de estado
4. **Validar** compatibilidad con sistema de temas en `index.css`

### Debugging Común
- **Archivos no cargan**: Verificar validación MIME types en `ETLUploader`
- **Progreso no actualiza**: Revisar simulación en `ETLProgress` component
- **Temas inconsistentes**: Validar uso correcto de variables CSS
- **Performance lenta**: Verificar memoización y lazy loading

### Extensión del Módulo
- **Nuevos tipos archivo**: Agregar validación en `validateFile()`
- **Nuevas reglas validación**: Extender `defaultBusinessRules` array
- **Nuevas métricas**: Ampliar `renderValidationIssues()`
- **Nueva etapa progreso**: Actualizar `stages` array en ETLProgress

---

**📝 Generado automáticamente por**: Claude.md Strategy
**🔄 Última sincronización**: ETL Frontend Implementation
**📊 Estado**: ✅ Completo y Funcional