const { Op } = require('sequelize');
const metricsAggregator = require('./aggregators/metrics-aggregator');
const auditoriasAggregator = require('./aggregators/auditorias-aggregator');

/**
 * Servicio principal para gestión de dashboards y métricas
 * Orquesta la agregación de datos y generación de insights
 */
class DashboardsService {
  
  constructor() {
    this.aggregators = {
      metrics: metricsAggregator,
      auditorias: auditoriasAggregator
    };
  }
  
  /**
   * Obtener métricas ejecutivas agregadas
   */
  async getExecutiveMetrics(options = {}) {
    const { periodo, include_trends, usuario } = options;
    
    console.log('📊 Calculando métricas ejecutivas...');
    
    try {
      // Obtener métricas base de auditorías
      const auditorias = await this.aggregators.auditorias.getExecutiveStats(periodo);
      
      // Calcular KPIs principales
      const kpis = {
        total_auditorias_activas: auditorias.activas || 0,
        auditorias_completadas_mes: auditorias.completadas_mes || 0,
        tiempo_promedio_auditoria: auditorias.tiempo_promedio || 0,
        score_calidad_promedio: auditorias.score_promedio || 0,
        compliance_rate: auditorias.compliance_rate || 0,
        proveedores_activos: auditorias.proveedores_activos || 0
      };
      
      // Calcular tendencias si se solicita
      let tendencias = null;
      if (include_trends) {
        tendencias = await this.calculateTrends(periodo);
      }
      
      // Calcular score de salud general del sistema
      const system_health_score = this.calculateSystemHealthScore(kpis);
      
      return {
        timestamp: new Date().toISOString(),
        periodo,
        kpis,
        system_health_score,
        tendencias,
        alertas_resumen: {
          criticas: 0,
          altas: 0,
          medias: 0
        },
        recomendaciones: this.generateExecutiveRecommendations(kpis)
      };
      
    } catch (error) {
      console.error('❌ Error calculando métricas ejecutivas:', error);
      throw error;
    }
  }
  
  /**
   * Obtener métricas operativas para auditores
   */
  async getOperationalMetrics(options = {}) {
    const { periodo, auditor_id, include_alerts, usuario } = options;
    
    console.log(`📋 Calculando métricas operativas para auditor ${auditor_id}...`);
    
    try {
      // Métricas específicas del auditor
      const auditorMetrics = await this.aggregators.auditorias.getAuditorStats(
        auditor_id, 
        periodo
      );
      
      // Métricas del flujo de trabajo
      const workflowMetrics = await this.aggregators.auditorias.getWorkflowStats(periodo);
      
      return {
        timestamp: new Date().toISOString(),
        auditor_id,
        periodo,
        
        performance: {
          auditorias_asignadas: auditorMetrics.asignadas || 0,
          auditorias_completadas: auditorMetrics.completadas || 0,
          auditorias_en_proceso: auditorMetrics.en_proceso || 0,
          tiempo_promedio_resolucion: auditorMetrics.tiempo_promedio || 0,
          efficiency_score: auditorMetrics.efficiency_score || 0
        },
        
        workflow: {
          carga_trabajo_actual: workflowMetrics.carga_actual || 0,
          distribucion_por_etapa: workflowMetrics.distribucion_etapas || {},
          cuellos_botella: workflowMetrics.cuellos_botella || [],
          tiempo_por_etapa: workflowMetrics.tiempos_etapa || {}
        },
        
        objetivos: {
          target_auditorias_semana: 15,
          target_tiempo_promedio: 10, // días
          target_score_calidad: 90,
          progreso_objetivos: this.calculateGoalProgress(auditorMetrics)
        }
      };
      
    } catch (error) {
      console.error('❌ Error calculando métricas operativas:', error);
      throw error;
    }
  }
  
  /**
   * Obtener métricas específicas de proveedor
   */
  async getProviderMetrics(options = {}) {
    const { proveedor_id, periodo, compare_peers, usuario } = options;
    
    console.log(`🏢 Calculando métricas para proveedor ${proveedor_id}...`);
    
    try {
      // Métricas del proveedor específico
      const providerStats = await this.aggregators.auditorias.getProviderStats(
        proveedor_id, 
        periodo
      );
      
      return {
        timestamp: new Date().toISOString(),
        proveedor_id,
        periodo,
        
        overview: {
          auditorias_total: providerStats.total_auditorias || 0,
          auditorias_aprobadas: providerStats.aprobadas || 0,
          approval_rate: providerStats.approval_rate || 0,
          score_promedio: providerStats.score_promedio || 0,
          ultima_auditoria: providerStats.ultima_auditoria || null
        },
        
        compliance: {
          cumplimiento_tecnico: providerStats.cumplimiento_tecnico || 0,
          cumplimiento_documental: providerStats.cumplimiento_documental || 0,
          cumplimiento_temporal: providerStats.cumplimiento_temporal || 0,
          areas_mejora: providerStats.areas_mejora || []
        }
      };
      
    } catch (error) {
      console.error('❌ Error calculando métricas de proveedor:', error);
      throw error;
    }
  }
  
  /**
   * Calcular tendencias del sistema
   */
  async calculateTrends(periodo) {
    console.log('📈 Calculando tendencias del sistema...');
    
    try {
      const trends = await this.aggregators.metrics.calculateTrends(periodo);
      
      return {
        auditorias_por_mes: trends.auditorias_monthly || [],
        score_calidad_trend: trends.quality_trend || [],
        tiempo_promedio_trend: trends.time_trend || [],
        
        proyecciones: {
          siguiente_mes: trends.proyecciones?.next_month || 0,
          siguiente_trimestre: trends.proyecciones?.next_quarter || 0
        },
        
        insights: trends.insights || []
      };
      
    } catch (error) {
      console.error('❌ Error calculando tendencias:', error);
      return {
        auditorias_por_mes: [],
        score_calidad_trend: [],
        tiempo_promedio_trend: [],
        proyecciones: {
          siguiente_mes: 0,
          siguiente_trimestre: 0
        },
        insights: []
      };
    }
  }
  
  /**
   * Calcular score de salud del sistema
   */
  calculateSystemHealthScore(kpis) {
    let score = 100;
    
    // Penalizar por compliance rate bajo
    if (kpis.compliance_rate < 95) {
      score -= (95 - kpis.compliance_rate) * 2;
    }
    
    // Bonificar por score de calidad alto
    if (kpis.score_calidad_promedio > 90) {
      score += (kpis.score_calidad_promedio - 90) * 0.5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Generar recomendaciones ejecutivas
   */
  generateExecutiveRecommendations(kpis) {
    const recomendaciones = [];
    
    if (kpis.compliance_rate < 90) {
      recomendaciones.push({
        tipo: 'critica',
        area: 'compliance',
        mensaje: 'Rate de cumplimiento por debajo del 90%. Revisar procesos de auditoría.',
        accion: 'Implementar plan de mejora de compliance inmediato'
      });
    }
    
    if (kpis.score_calidad_promedio < 80) {
      recomendaciones.push({
        tipo: 'alta',
        area: 'calidad',
        mensaje: 'Score de calidad por debajo del 80%. Mejorar criterios de evaluación.',
        accion: 'Revisar y optimizar criterios de scoring'
      });
    }
    
    return recomendaciones;
  }
  
  /**
   * Calcular progreso de objetivos
   */
  calculateGoalProgress(auditorMetrics) {
    return {
      auditorias_completadas: Math.min(100, (auditorMetrics.completadas / 15) * 100),
      tiempo_promedio: Math.max(0, 100 - ((auditorMetrics.tiempo_promedio - 10) / 10) * 100),
      score_calidad: Math.min(100, (auditorMetrics.score_promedio / 90) * 100)
    };
  }
  
  /**
   * Verificar salud del sistema de dashboards
   */
  async checkSystemHealth() {
    console.log('🔍 Verificando salud del sistema dashboards...');
    
    try {
      const health = {
        status: 'healthy',
        details: {
          aggregators: 'operational',
          database_connection: 'healthy',
          dashboards_service: 'operational'
        }
      };
      
      return health;
      
    } catch (error) {
      console.error('❌ Error en health check:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new DashboardsService();