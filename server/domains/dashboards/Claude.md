# Claude.md - Módulo Dashboards

> **📍 Ubicación**: `/server/domains/dashboards/`
> 
> **🎯 Dominio**: Dashboards inteligentes y métricas del sistema de auditorías
> 
> **🔗 Integración**: AUDITORIAS (datos) + ETL (métricas) + IA (insights) + AUTH (permisos)

## 🎯 Propósito

Este módulo implementará **dashboards interactivos y sistema de métricas** para proporcionar insights accionables sobre el proceso de auditorías, performance de proveedores y tendencias del sistema.

### Responsabilidades Principales (Planificadas)
- **Dashboards ejecutivos** con KPIs y métricas de alto nivel
- **Dashboards operativos** para auditores con métricas detalladas
- **Reportes automatizados** con generación programada
- **Alertas inteligentes** basadas en umbrales configurables
- **Analítica avanzada** con correlaciones y tendencias
- **Exportación** de datos en múltiples formatos (PDF, Excel, CSV)

## 🏗️ Estructura Preparada

### Arquitectura Propuesta
```
/server/domains/dashboards/
├── 📄 dashboards.controller.js       # Endpoints para dashboards y reportes
├── 📄 dashboards.service.js          # Lógica de agregación de métricas
├── 📄 dashboards.routes.js           # Rutas protegidas por rol
├── 📁 /models/
│   ├── Dashboard.model.js            # Configuración de dashboards personalizados
│   ├── Reporte.model.js              # Historial de reportes generados
│   └── AlertaMetrica.model.js        # Configuración de alertas
├── 📁 /aggregators/
│   ├── metrics-aggregator.js         # Agregador principal de métricas
│   ├── auditoria-aggregator.js       # Métricas específicas de auditorías
│   ├── proveedor-aggregator.js       # Métricas por proveedor
│   ├── etl-aggregator.js             # Métricas de procesamiento ETL
│   └── ia-aggregator.js              # Métricas de análisis IA
├── 📁 /charts/
│   ├── chart-generator.js            # Generador de gráficos
│   ├── chart-types.js                # Tipos de gráficos disponibles
│   └── chart-themes.js               # Temas visuales configurables
├── 📁 /exports/
│   ├── pdf-exporter.js               # Exportación a PDF
│   ├── excel-exporter.js             # Exportación a Excel
│   └── csv-exporter.js               # Exportación a CSV
├── 📁 /alerts/
│   ├── alert-engine.js               # Motor de alertas automáticas
│   ├── threshold-monitor.js          # Monitor de umbrales
│   └── alert-dispatcher.js           # Envío de alertas
├── 📁 /validators/
│   └── dashboards.validators.js      # Validaciones
└── 📄 Claude.md                      # Esta documentación
```

## 🔌 Interfaces/APIs Planificadas

### Endpoints Dashboards
```javascript
// Dashboards principales
GET    /api/dashboards/ejecutivo           // Dashboard ejecutivo (C-level)
GET    /api/dashboards/operativo           // Dashboard operativo (auditores)
GET    /api/dashboards/proveedor/:id       // Dashboard específico proveedor
GET    /api/dashboards/auditor/:id         // Dashboard personal auditor

// Métricas específicas
GET    /api/dashboards/metrics/auditorias  // KPIs de auditorías
GET    /api/dashboards/metrics/etl         // Métricas de procesamiento ETL
GET    /api/dashboards/metrics/ia          // Métricas de análisis IA
GET    /api/dashboards/metrics/proveedores // Performance de proveedores

// Configuración personalizada
GET    /api/dashboards/custom              // Dashboards personalizados
POST   /api/dashboards/custom              // Crear dashboard personalizado
PUT    /api/dashboards/custom/:id          // Actualizar dashboard
DELETE /api/dashboards/custom/:id          // Eliminar dashboard
```

## 💡 Características Técnicas Propuestas

### 1. **Sistema de Métricas Jerárquicas**
```javascript
// Estructura de métricas por nivel organizacional
const metricasEjecutivas = {
  // KPIs de alto nivel para C-suite
  overview: {
    total_auditorias_mes: 45,
    tiempo_promedio_auditoria: '12.5 días',
    score_calidad_promedio: 87.3,
    proveedores_activos: 28,
    compliance_rate: 94.2
  },
  
  tendencias: {
    auditorias_por_mes: [32, 38, 45, 52], // Últimos 4 meses
    score_calidad_tendencia: [85.1, 86.8, 87.3, 88.1],
    tiempo_promedio_tendencia: [15.2, 14.1, 12.5, 11.8]
  },
  
  alertas_criticas: [
    {
      tipo: 'vencimiento_proximo',
      cantidad: 3,
      severidad: 'alta',
      descripcion: '3 auditorías vencen en las próximas 48 horas'
    }
  ]
};

const metricasOperativas = {
  // Métricas detalladas para auditores
  workflow: {
    etapa_1_promedio: '2.1 días',
    etapa_2_promedio: '3.5 días',
    etapa_3_promedio: '4.2 días',
    cuellos_botella: ['etapa_3_validacion', 'etapa_6_informe'],
    auditorias_por_auditor: {
      'Juan Pérez': 8,
      'María González': 12,
      'Carlos Ruiz': 6
    }
  },
  
  calidad: {
    documentos_rechazados_rate: 12.3,
    ia_accuracy_promedio: 89.7,
    etl_error_rate: 2.1,
    revision_manual_required: 15.8
  },
  
  performance: {
    auditorias_completadas_semana: 12,
    target_semanal: 15,
    performance_rate: 80.0,
    overtime_hours: 8.5
  }
};
```

### 2. **Motor de Agregación Inteligente**
```javascript
class MetricsAggregator {
  async calculateDashboardMetrics(tipo, usuario, filtros = {}) {
    const { fechaInicio, fechaFin, proveedor_id, auditor_id } = filtros;
    
    // Construir query base con filtros
    const baseQuery = this.buildBaseQuery(fechaInicio, fechaFin, filtros);
    
    switch (tipo) {
      case 'ejecutivo':
        return await this.getExecutiveMetrics(baseQuery);
      case 'operativo':
        return await this.getOperationalMetrics(baseQuery, usuario);
      case 'proveedor':
        return await this.getProviderMetrics(baseQuery, proveedor_id);
      case 'auditor':
        return await this.getAuditorMetrics(baseQuery, auditor_id);
    }
  }
  
  async getExecutiveMetrics(baseQuery) {
    const [auditorias, etlStats, iaStats] = await Promise.all([
      this.auditoriasAggregator.getExecutiveStats(baseQuery),
      this.etlAggregator.getProcessingStats(baseQuery),
      this.iaAggregator.getAnalysisStats(baseQuery)
    ]);
    
    return {
      overview: {
        total_auditorias: auditorias.total,
        auditorias_completadas: auditorias.completadas,
        completion_rate: auditorias.completion_rate,
        score_promedio: auditorias.score_promedio,
        tiempo_promedio: auditorias.tiempo_promedio
      },
      
      procesamiento: {
        documentos_procesados: etlStats.total_documentos,
        etl_success_rate: etlStats.success_rate,
        ia_analysis_rate: iaStats.analysis_completion_rate,
        automation_efficiency: this.calculateAutomationEfficiency(etlStats, iaStats)
      },
      
      tendencias: await this.calculateTrends(baseQuery),
      alertas: await this.getActiveAlerts()
    };
  }
}
```

### 3. **Sistema de Alertas Configurables**
```javascript
const alertasConfiguradas = [
  {
    nombre: 'Auditorías Vencidas',
    tipo: 'threshold',
    metrica: 'auditorias_vencidas_count',
    operador: 'greater_than',
    valor_umbral: 0,
    severidad: 'critica',
    frecuencia_check: '1_hour',
    canales_notificacion: ['email', 'websocket'],
    destinatarios: ['admin', 'auditor_principal']
  },
  
  {
    nombre: 'Performance ETL Degradado',
    tipo: 'threshold',
    metrica: 'etl_error_rate',
    operador: 'greater_than',
    valor_umbral: 5.0, // 5% error rate
    severidad: 'alta',
    frecuencia_check: '15_minutes',
    canales_notificacion: ['email'],
    destinatarios: ['admin', 'tech_lead']
  }
];
```

## ⚠️ Estado Actual: 📋 PENDIENTE DE IMPLEMENTACIÓN

### 🔨 Por Implementar
- [ ] **Agregadores de métricas**: Cálculo de KPIs por módulo
- [ ] **Motor de dashboards**: Generación dinámica de vistas
- [ ] **Sistema de alertas**: Monitoreo automático de umbrales
- [ ] **Generación de gráficos**: Charts interactivos con Chart.js
- [ ] **Exportación**: PDF, Excel, CSV con formateo
- [ ] **Dashboards personalizados**: Configuración por usuario

### 📁 Estructura Existente
- ✅ **Directorio base**: `/server/domains/dashboards/` creado
- ✅ **Subdirectorios**: `/aggregators/`, `/charts/`, `/exports/` preparados
- ✅ **Claude.md**: Arquitectura completa y métricas definidas

---

**📝 Generado automáticamente por**: Claude.md Strategy  
**🔄 Última sincronización**: Planificación completa del módulo  
**📊 Estado**: 📋 **PENDIENTE DE IMPLEMENTACIÓN** - Arquitectura y métricas definidas