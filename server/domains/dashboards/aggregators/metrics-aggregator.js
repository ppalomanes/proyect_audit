/**
 * Agregador principal de métricas para dashboards
 * Coordina la agregación de datos de múltiples módulos y calcula tendencias
 */
class MetricsAggregator {
  
  constructor() {
    this.auditoriasAggregator = require('./auditorias-aggregator');
  }
  
  /**
   * Calcular tendencias del sistema basadas en datos históricos
   */
  async calculateTrends(periodo = '30d') {
    try {
      console.log(`📈 Calculando tendencias del sistema (${periodo})`);
      
      // Obtener datos históricos por mes para los últimos períodos
      const tendencias = await this.getHistoricalTrends(periodo);
      
      // Calcular tendencias específicas
      const auditoriasTrend = await this.calculateAuditoriasTrend(periodo);
      const qualityTrend = await this.calculateQualityTrend(periodo);
      const timeTrend = await this.calculateTimeTrend(periodo);
      
      // Generar proyecciones
      const proyecciones = this.generateProjections({
        auditoriasTrend,
        qualityTrend,
        timeTrend
      });
      
      // Generar insights automáticos
      const insights = this.generateInsights({
        auditoriasTrend,
        qualityTrend,
        timeTrend
      });
      
      return {
        auditorias_monthly: auditoriasTrend,
        quality_trend: qualityTrend,
        time_trend: timeTrend,
        proyecciones,
        insights,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error calculando tendencias:', error);
      throw error;
    }
  }
  
  /**
   * Obtener datos históricos por período
   */
  async getHistoricalTrends(periodo) {
    try {
      const meses = this.getMonthsArray(periodo);
      const trends = [];
      
      for (const mes of meses) {
        const stats = await this.auditoriasAggregator.getExecutiveStats(`${mes.days}d`);
        trends.push({
          mes: mes.label,
          auditorias: stats.completadas,
          score_promedio: stats.score_promedio,
          tiempo_promedio: stats.tiempo_promedio,
          compliance_rate: stats.compliance_rate
        });
      }
      
      return trends;
      
    } catch (error) {
      console.error('❌ Error obteniendo tendencias históricas:', error);
      return [];
    }
  }
  
  /**
   * Calcular tendencia de auditorías completadas
   */
  async calculateAuditoriasTrend(periodo) {
    try {
      const meses = this.getMonthsArray(periodo);
      const trend = [];
      
      for (const mes of meses) {
        const stats = await this.auditoriasAggregator.getExecutiveStats(`${mes.days}d`);
        trend.push({
          periodo: mes.label,
          valor: stats.completadas,
          fecha: mes.fecha
        });
      }
      
      return trend;
      
    } catch (error) {
      console.error('❌ Error calculando tendencia auditorías:', error);
      return [];
    }
  }
  
  /**
   * Calcular tendencia de calidad (scores)
   */
  async calculateQualityTrend(periodo) {
    try {
      const meses = this.getMonthsArray(periodo);
      const trend = [];
      
      for (const mes of meses) {
        const stats = await this.auditoriasAggregator.getExecutiveStats(`${mes.days}d`);
        trend.push({
          periodo: mes.label,
          valor: stats.score_promedio,
          fecha: mes.fecha
        });
      }
      
      return trend;
      
    } catch (error) {
      console.error('❌ Error calculando tendencia calidad:', error);
      return [];
    }
  }
  
  /**
   * Calcular tendencia de tiempos de auditoría
   */
  async calculateTimeTrend(periodo) {
    try {
      const meses = this.getMonthsArray(periodo);
      const trend = [];
      
      for (const mes of meses) {
        const stats = await this.auditoriasAggregator.getExecutiveStats(`${mes.days}d`);
        trend.push({
          periodo: mes.label,
          valor: stats.tiempo_promedio,
          fecha: mes.fecha
        });
      }
      
      return trend;
      
    } catch (error) {
      console.error('❌ Error calculando tendencia tiempos:', error);
      return [];
    }
  }
  
  /**
   * Generar proyecciones basadas en tendencias
   */
  generateProjections(trends) {
    try {
      // Proyección simple basada en tendencia lineal
      const auditoriaProjection = this.calculateLinearProjection(trends.auditoriasTrend);
      const qualityProjection = this.calculateLinearProjection(trends.qualityTrend);
      
      return {
        next_month: {
          auditorias_estimadas: Math.round(auditoriaProjection),
          score_estimado: Math.round(qualityProjection * 10) / 10,
          confianza: this.calculateConfidence(trends.auditoriasTrend)
        },
        next_quarter: {
          auditorias_estimadas: Math.round(auditoriaProjection * 3),
          score_estimado: Math.round(qualityProjection * 10) / 10,
          confianza: this.calculateConfidence(trends.auditoriasTrend) * 0.8
        }
      };
      
    } catch (error) {
      console.error('❌ Error generando proyecciones:', error);
      return {
        next_month: { auditorias_estimadas: 0, score_estimado: 0, confianza: 0 },
        next_quarter: { auditorias_estimadas: 0, score_estimado: 0, confianza: 0 }
      };
    }
  }
  
  /**
   * Generar insights automáticos
   */
  generateInsights(trends) {
    const insights = [];
    
    try {
      // Analizar tendencia de auditorías
      const auditoriasTrend = this.analyzeTrendDirection(trends.auditoriasTrend);
      if (auditoriasTrend.direction === 'up') {
        insights.push({
          tipo: 'positivo',
          mensaje: `Incremento del ${auditoriasTrend.change}% en auditorías completadas`,
          impacto: 'alto'
        });
      } else if (auditoriasTrend.direction === 'down') {
        insights.push({
          tipo: 'alerta',
          mensaje: `Disminución del ${Math.abs(auditoriasTrend.change)}% en auditorías completadas`,
          impacto: 'alto'
        });
      }
      
      // Analizar tendencia de calidad
      const qualityTrend = this.analyzeTrendDirection(trends.qualityTrend);
      if (qualityTrend.direction === 'up') {
        insights.push({
          tipo: 'positivo',
          mensaje: `Mejora del ${qualityTrend.change}% en score de calidad`,
          impacto: 'medio'
        });
      } else if (qualityTrend.direction === 'down') {
        insights.push({
          tipo: 'critico',
          mensaje: `Deterioro del ${Math.abs(qualityTrend.change)}% en score de calidad`,
          impacto: 'critico'
        });
      }
      
      // Analizar tendencia de tiempos
      const timeTrend = this.analyzeTrendDirection(trends.timeTrend);
      if (timeTrend.direction === 'down') {
        insights.push({
          tipo: 'positivo',
          mensaje: `Reducción del ${Math.abs(timeTrend.change)}% en tiempo promedio de auditoría`,
          impacto: 'medio'
        });
      } else if (timeTrend.direction === 'up') {
        insights.push({
          tipo: 'alerta',
          mensaje: `Incremento del ${timeTrend.change}% en tiempo promedio de auditoría`,
          impacto: 'medio'
        });
      }
      
    } catch (error) {
      console.error('❌ Error generando insights:', error);
    }
    
    return insights;
  }
  
  /**
   * Health check del agregador principal
   */
  async healthCheck() {
    try {
      await this.auditoriasAggregator.healthCheck();
      return { status: 'healthy' };
    } catch (error) {
      throw new Error(`Metrics aggregator no disponible: ${error.message}`);
    }
  }
  
  // =================== MÉTODOS AUXILIARES ===================
  
  /**
   * Obtener array de meses para análisis de tendencias
   */
  getMonthsArray(periodo) {
    const meses = [];
    const today = new Date();
    
    let numMeses = 6; // Default
    switch (periodo) {
      case '30d':
        numMeses = 6;
        break;
      case '90d':
        numMeses = 6;
        break;
      case '1y':
        numMeses = 12;
        break;
    }
    
    for (let i = numMeses - 1; i >= 0; i--) {
      const fecha = new Date(today);
      fecha.setMonth(fecha.getMonth() - i);
      
      meses.push({
        label: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        fecha: fecha.toISOString(),
        days: 30 // Aproximado para cálculos
      });
    }
    
    return meses;
  }
  
  /**
   * Calcular proyección lineal simple
   */
  calculateLinearProjection(trendData) {
    if (!trendData || trendData.length < 2) return 0;
    
    const valores = trendData.map(t => t.valor).filter(v => v !== null && v !== undefined);
    if (valores.length < 2) return valores[valores.length - 1] || 0;
    
    // Tendencia lineal simple: diferencia entre último y penúltimo valor
    const ultimoValor = valores[valores.length - 1];
    const penultimoValor = valores[valores.length - 2];
    const tendencia = ultimoValor - penultimoValor;
    
    return ultimoValor + tendencia;
  }
  
  /**
   * Calcular nivel de confianza basado en consistencia de datos
   */
  calculateConfidence(trendData) {
    if (!trendData || trendData.length < 3) return 0.5;
    
    const valores = trendData.map(t => t.valor).filter(v => v !== null && v !== undefined);
    if (valores.length < 3) return 0.5;
    
    // Calcular variabilidad (menor variabilidad = mayor confianza)
    const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length;
    const varianza = valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / valores.length;
    const coeficienteVariacion = Math.sqrt(varianza) / promedio;
    
    // Convertir a score de confianza (0-1)
    return Math.max(0.1, Math.min(0.95, 1 - coeficienteVariacion));
  }
  
  /**
   * Analizar dirección de tendencia
   */
  analyzeTrendDirection(trendData) {
    if (!trendData || trendData.length < 2) {
      return { direction: 'stable', change: 0 };
    }
    
    const valores = trendData.map(t => t.valor).filter(v => v !== null && v !== undefined);
    if (valores.length < 2) {
      return { direction: 'stable', change: 0 };
    }
    
    const primerValor = valores[0];
    const ultimoValor = valores[valores.length - 1];
    
    if (primerValor === 0) {
      return { direction: 'stable', change: 0 };
    }
    
    const cambio = ((ultimoValor - primerValor) / primerValor) * 100;
    
    let direction = 'stable';
    if (cambio > 5) direction = 'up';
    else if (cambio < -5) direction = 'down';
    
    return {
      direction,
      change: Math.round(Math.abs(cambio) * 10) / 10
    };
  }
}

module.exports = new MetricsAggregator();