// /server/domains/dashboards/aggregators/metrics-aggregator.js
// Agregador de métricas principales - Portal de Auditorías Técnicas

/**
 * Agregador centralizado de métricas y KPIs del sistema
 * Consolida datos de auditorías, ETL, IA y jobs para dashboards ejecutivos
 */
class MetricsAggregator {
  
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtener métricas ejecutivas principales
   */
  async getExecutiveMetrics(periodo = '30d') {
    const cacheKey = `executive_metrics_${periodo}`;
    
    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      console.log(`📊 Calculando métricas ejecutivas para período: ${periodo}`);
      
      // Obtener datos base (mock por ahora, en producción usar modelos reales)
      const auditoriasData = await this.getAuditoriasMetrics(periodo);
      const etlData = await this.getETLMetrics(periodo);
      const iaData = await this.getIAMetrics(periodo);
      const jobsData = await this.getJobsMetrics(periodo);
      
      const metrics = {
        periodo,
        timestamp: new Date().toISOString(),
        
        // KPIs Principales
        kpis: {
          auditorias_completadas: auditoriasData.completadas,
          auditorias_en_progreso: auditoriasData.en_progreso,
          tasa_cumplimiento_promedio: auditoriasData.tasa_cumplimiento,
          tiempo_promedio_auditoria: auditoriasData.tiempo_promedio,
          proveedores_activos: auditoriasData.proveedores_unicos,
          sitios_auditados: auditoriasData.sitios_unicos
        },
        
        // Métricas de Procesamiento
        procesamiento: {
          archivos_etl_procesados: etlData.archivos_procesados,
          registros_parque_procesados: etlData.registros_procesados,
          tasa_exito_etl: etlData.tasa_exito,
          analisis_ia_realizados: iaData.analisis_realizados,
          score_promedio_ia: iaData.score_promedio,
          jobs_completados: jobsData.completados,
          jobs_fallidos: jobsData.fallidos
        },
        
        // Tendencias
        tendencias: {
          auditorias_por_mes: await this.getAuditoriasTrend(periodo),
          cumplimiento_por_mes: await this.getCumplimientoTrend(periodo),
          performance_etl: await this.getETLPerformanceTrend(periodo),
          accuracy_ia: await this.getIAAccuracyTrend(periodo)
        },
        
        // Distribuciones
        distribuciones: {
          por_proveedor: await this.getDistribucionProveedores(periodo),
          por_tipo_incumplimiento: await this.getDistribucionIncumplimientos(periodo),
          por_categoria_hardware: await this.getDistribucionHardware(periodo)
        },
        
        // Alertas y Notificaciones
        alertas: await this.getAlertasActivas(),
        
        // Comparativas
        comparativa_periodo_anterior: await this.getComparativaPeriodoAnterior(periodo)
      };
      
      // Guardar en cache
      this.cache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Error calculando métricas ejecutivas:', error.message);
      throw error;
    }
  }

  /**
   * Obtener métricas de auditorías
   */
  async getAuditoriasMetrics(periodo) {
    // Mock data - en producción consultar modelos reales
    return {
      completadas: 45,
      en_progreso: 12,
      pendientes: 8,
      tasa_cumplimiento: 78.5,
      tiempo_promedio: '14 días',
      proveedores_unicos: 23,
      sitios_unicos: 89,
      por_etapa: {
        'Carga Documentos': 8,
        'Validación': 4,
        'Análisis IA': 3,
        'Revisión Auditor': 5,
        'Finalizada': 45
      }
    };
  }

  /**
   * Obtener métricas de ETL
   */
  async getETLMetrics(periodo) {
    return {
      archivos_procesados: 156,
      registros_procesados: 12840,
      tasa_exito: 94.2,
      tiempo_promedio_procesamiento: '3.2 min',
      errores_comunes: [
        { tipo: 'Formato RAM inválido', count: 23 },
        { tipo: 'OS no soportado', count: 18 },
        { tipo: 'Campo hostname vacío', count: 15 }
      ]
    };
  }

  /**
   * Obtener métricas de IA
   */
  async getIAMetrics(periodo) {
    return {
      analisis_realizados: 234,
      score_promedio: 82.3,
      tiempo_promedio_analisis: '2.8s',
      por_tipo: {
        'documentos': 156,
        'imagenes': 45,
        'scoring_parque': 33
      },
      accuracy_vs_auditor: 87.2
    };
  }

  /**
   * Obtener métricas de jobs
   */
  async getJobsMetrics(periodo) {
    return {
      completados: 1250,
      fallidos: 78,
      en_curso: 15,
      tasa_exito: 94.1,
      tiempo_promedio_ejecucion: '1.4 min'
    };
  }

  /**
   * Obtener tendencia de auditorías
   */
  async getAuditoriasTrend(periodo) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return meses.map(mes => ({
      mes,
      auditorias: Math.floor(Math.random() * 20) + 30,
      completadas: Math.floor(Math.random() * 15) + 25,
      cumplimiento_promedio: Math.floor(Math.random() * 20) + 70
    }));
  }

  /**
   * Obtener tendencia de cumplimiento
   */
  async getCumplimientoTrend(periodo) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return meses.map(mes => ({
      mes,
      cumplimiento: Math.floor(Math.random() * 15) + 75,
      incumplimientos_criticos: Math.floor(Math.random() * 10) + 5,
      incumplimientos_menores: Math.floor(Math.random() * 20) + 15
    }));
  }

  /**
   * Obtener tendencia de performance ETL
   */
  async getETLPerformanceTrend(periodo) {
    const semanas = ['S1', 'S2', 'S3', 'S4'];
    return semanas.map(semana => ({
      semana,
      archivos_procesados: Math.floor(Math.random() * 20) + 30,
      tiempo_promedio_ms: Math.floor(Math.random() * 2000) + 3000,
      tasa_exito: Math.floor(Math.random() * 10) + 90
    }));
  }

  /**
   * Obtener tendencia de accuracy IA
   */
  async getIAAccuracyTrend(periodo) {
    const semanas = ['S1', 'S2', 'S3', 'S4'];
    return semanas.map(semana => ({
      semana,
      accuracy_documentos: Math.floor(Math.random() * 10) + 85,
      accuracy_imagenes: Math.floor(Math.random() * 8) + 80,
      accuracy_scoring: Math.floor(Math.random() * 12) + 82
    }));
  }

  /**
   * Obtener distribución por proveedores
   */
  async getDistribucionProveedores(periodo) {
    const proveedores = ['Proveedor A', 'Proveedor B', 'Proveedor C', 'Proveedor D'];
    return proveedores.map(proveedor => ({
      proveedor,
      auditorias: Math.floor(Math.random() * 15) + 5,
      cumplimiento_promedio: Math.floor(Math.random() * 20) + 70,
      sitios: Math.floor(Math.random() * 20) + 10
    }));
  }

  /**
   * Obtener distribución de incumplimientos
   */
  async getDistribucionIncumplimientos(periodo) {
    return [
      { categoria: 'Hardware', count: 45, porcentaje: 32.1 },
      { categoria: 'Sistema Operativo', count: 38, porcentaje: 27.1 },
      { categoria: 'Conectividad', count: 28, porcentaje: 20.0 },
      { categoria: 'Software', count: 18, porcentaje: 12.9 },
      { categoria: 'Seguridad', count: 11, porcentaje: 7.9 }
    ];
  }

  /**
   * Obtener distribución de hardware
   */
  async getDistribucionHardware(periodo) {
    return {
      cpu: {
        intel: { count: 1240, porcentaje: 68.2 },
        amd: { count: 578, porcentaje: 31.8 }
      },
      ram: {
        '8gb': { count: 456, porcentaje: 25.1 },
        '16gb': { count: 1025, porcentaje: 56.4 },
        '32gb': { count: 337, porcentaje: 18.5 }
      },
      disco: {
        hdd: { count: 234, porcentaje: 12.9 },
        ssd: { count: 1584, porcentaje: 87.1 }
      }
    };
  }

  /**
   * Obtener alertas activas
   */
  async getAlertasActivas() {
    return [
      {
        id: 'alert_001',
        tipo: 'critica',
        titulo: 'Alto porcentaje de incumplimientos en RAM',
        descripcion: 'El 15% de equipos no cumple RAM mínima de 16GB',
        afectados: 156,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'alert_002',
        tipo: 'advertencia',
        titulo: 'Demora en procesamiento ETL',
        descripcion: 'Tiempo promedio de ETL aumentó 25% esta semana',
        afectados: 12,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  /**
   * Obtener comparativa con período anterior
   */
  async getComparativaPeriodoAnterior(periodo) {
    return {
      auditorias: {
        actual: 45,
        anterior: 38,
        cambio: '+18.4%',
        tendencia: 'up'
      },
      cumplimiento: {
        actual: 78.5,
        anterior: 76.2,
        cambio: '+3.0%',
        tendencia: 'up'
      },
      tiempo_promedio: {
        actual: 14,
        anterior: 16,
        cambio: '-12.5%',
        tendencia: 'up' // Menos tiempo es mejor
      }
    };
  }

  /**
   * Limpiar cache de métricas
   */
  clearCache(patron = null) {
    if (patron) {
      for (const key of this.cache.keys()) {
        if (key.includes(patron)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    
    console.log(`🧹 Cache de métricas limpiado${patron ? ` (patrón: ${patron})` : ' (completo)'}`);
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    return {
      entradas_total: this.cache.size,
      timeout_configurado: this.cacheTimeout,
      memoria_aproximada: JSON.stringify([...this.cache.values()]).length,
      keys_activos: [...this.cache.keys()]
    };
  }
}

module.exports = new MetricsAggregator();
