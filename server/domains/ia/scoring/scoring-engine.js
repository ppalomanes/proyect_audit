/**
 * Scoring Engine - Motor de Puntuación Inteligente
 * Portal de Auditorías Técnicas
 */

class ScoringEngine {
  constructor() {
    this.complianceThresholds = {
      'excelente': 90,
      'bueno': 75,
      'aceptable': 60,
      'deficiente': 40,
      'critico': 0
    };

    this.scoringCriteria = {
      'document': {
        'completeness': 25,     // Completitud de información
        'accuracy': 25,         // Precisión técnica
        'compliance': 25,       // Cumplimiento de estándares
        'clarity': 25          // Claridad y estructura
      },
      'image': {
        'technical_compliance': 30,  // Cumplimiento técnico
        'organization': 25,          // Organización del espacio
        'safety': 20,              // Aspectos de seguridad
        'equipment_state': 25      // Estado de equipos
      }
    };
  }

  /**
   * Calcular score para análisis de documento
   */
  async calculateDocumentScore(analisisEstructurado, criterios = []) {
    try {
      console.log('📊 Calculando score para documento...');

      const scores = {
        completeness: this._evaluateCompleteness(analisisEstructurado),
        accuracy: this._evaluateAccuracy(analisisEstructurado),
        compliance: this._evaluateCompliance(analisisEstructurado, criterios),
        clarity: this._evaluateClarity(analisisEstructurado)
      };

      // Calcular score ponderado
      const criteriaWeights = this.scoringCriteria.document;
      const weightedScore = Object.keys(scores).reduce((total, key) => {
        return total + (scores[key] * criteriaWeights[key] / 100);
      }, 0);

      // Aplicar ajustes por criterios específicos
      const criteriaAdjustment = this._applyCriteriaAdjustment(
        analisisEstructurado,
        criterios,
        'document'
      );

      const finalScore = Math.min(100, Math.max(0, weightedScore + criteriaAdjustment));

      const scoreBreakdown = {
        score_final: Math.round(finalScore),
        scores_detallados: {
          completitud: Math.round(scores.completeness),
          precision: Math.round(scores.accuracy),
          cumplimiento: Math.round(scores.compliance),
          claridad: Math.round(scores.clarity)
        },
        ajuste_criterios: criteriaAdjustment,
        nivel_cumplimiento: this._getComplianceLevel(finalScore),
        ponderaciones_aplicadas: criteriaWeights,
        recomendaciones: this._generateDocumentRecommendations(scores, finalScore)
      };

      console.log(`✅ Score calculado: ${Math.round(finalScore)}%`);

      return scoreBreakdown;

    } catch (error) {
      console.error('❌ Error calculando score de documento:', error);
      throw error;
    }
  }

  /**
   * Calcular score para análisis de imagen
   */
  async calculateImageScore(analisisEstructurado, criterios = []) {
    try {
      console.log('📸 Calculando score para imagen...');

      const scores = {
        technical_compliance: this._evaluateTechnicalCompliance(analisisEstructurado),
        organization: this._evaluateOrganization(analisisEstructurado),
        safety: this._evaluateSafety(analisisEstructurado),
        equipment_state: this._evaluateEquipmentState(analisisEstructurado)
      };

      // Calcular score ponderado
      const criteriaWeights = this.scoringCriteria.image;
      const weightedScore = Object.keys(scores).reduce((total, key) => {
        return total + (scores[key] * criteriaWeights[key] / 100);
      }, 0);

      // Aplicar ajustes por criterios específicos
      const criteriaAdjustment = this._applyCriteriaAdjustment(
        analisisEstructurado,
        criterios,
        'image'
      );

      const finalScore = Math.min(100, Math.max(0, weightedScore + criteriaAdjustment));

      const scoreBreakdown = {
        score_final: Math.round(finalScore),
        scores_detallados: {
          cumplimiento_tecnico: Math.round(scores.technical_compliance),
          organizacion: Math.round(scores.organization),
          seguridad: Math.round(scores.safety),
          estado_equipos: Math.round(scores.equipment_state)
        },
        ajuste_criterios: criteriaAdjustment,
        nivel_cumplimiento: this._getComplianceLevel(finalScore),
        ponderaciones_aplicadas: criteriaWeights,
        recomendaciones: this._generateImageRecommendations(scores, finalScore)
      };

      console.log(`✅ Score de imagen calculado: ${Math.round(finalScore)}%`);

      return scoreBreakdown;

    } catch (error) {
      console.error('❌ Error calculando score de imagen:', error);
      throw error;
    }
  }

  // ===================
  // MÉTODOS DE EVALUACIÓN PARA DOCUMENTOS
  // ===================

  _evaluateCompleteness(analisis) {
    const hallazgos = analisis.hallazgos || [];
    const estructura = analisis.estructura || {};
    
    let score = 50; // Base score
    
    // Bonificar por número de hallazgos
    score += Math.min(30, hallazgos.length * 5);
    
    // Bonificar por estructura detectada
    if (estructura.secciones && estructura.secciones.length > 0) score += 10;
    if (estructura.fechas && estructura.fechas.length > 0) score += 5;
    if (estructura.numeros && Object.keys(estructura.numeros).length > 0) score += 5;
    
    return Math.min(100, score);
  }

  _evaluateAccuracy(analisis) {
    let score = 70; // Base score asumiendo precisión media
    
    // Penalizar por respuestas vagas o genéricas
    const respuesta = analisis.respuesta_original || '';
    if (respuesta.length < 100) score -= 20;
    if (this._hasVagueLanguage(respuesta)) score -= 10;
    
    // Bonificar por términos técnicos específicos
    if (this._hasTechnicalTerms(respuesta)) score += 15;
    
    return Math.max(0, Math.min(100, score));
  }

  _evaluateCompliance(analisis, criterios) {
    if (!criterios || criterios.length === 0) return 75; // Score por defecto
    
    const cumplimiento = analisis.cumplimiento_criterios || {};
    const criteriosCumplidos = Object.values(cumplimiento).filter(c => 
      c === 'CUMPLE' || c === 'DETECTADO'
    ).length;
    
    return (criteriosCumplidos / criterios.length) * 100;
  }

  _evaluateClarity(analisis) {
    const respuesta = analisis.respuesta_original || '';
    let score = 60; // Base score
    
    // Evaluar estructura de la respuesta
    if (this._hasGoodStructure(respuesta)) score += 20;
    if (this._hasSpecificDetails(respuesta)) score += 15;
    if (respuesta.length > 200 && respuesta.length < 2000) score += 5;
    
    return Math.min(100, score);
  }

  // ===================
  // MÉTODOS DE EVALUACIÓN PARA IMÁGENES
  // ===================

  _evaluateTechnicalCompliance(analisis) {
    let score = 60; // Base score
    
    const descripcion = analisis.descripcion || '';
    
    // Buscar términos que indican cumplimiento técnico
    const technicalIndicators = ['organizado', 'correcto', 'adecuado', 'estándar'];
    const negativeIndicators = ['desordenado', 'incorrecto', 'inadecuado', 'problemático'];
    
    technicalIndicators.forEach(indicator => {
      if (descripcion.toLowerCase().includes(indicator)) score += 8;
    });
    
    negativeIndicators.forEach(indicator => {
      if (descripcion.toLowerCase().includes(indicator)) score -= 12;
    });
    
    return Math.max(0, Math.min(100, score));
  }

  _evaluateOrganization(analisis) {
    const descripcion = analisis.descripcion || '';
    const objetos = analisis.objetos_detectados || [];
    
    let score = 50; // Base score
    
    // Evaluar organización basada en descripción
    if (descripcion.toLowerCase().includes('organizado')) score += 25;
    if (descripcion.toLowerCase().includes('limpio')) score += 15;
    if (descripcion.toLowerCase().includes('ordenado')) score += 20;
    
    // Penalizar por desorganización
    if (descripcion.toLowerCase().includes('desordenado')) score -= 30;
    if (descripcion.toLowerCase().includes('caótico')) score -= 25;
    
    // Bonificar por número de objetos bien identificados
    score += Math.min(15, objetos.length * 2);
    
    return Math.max(0, Math.min(100, score));
  }

  _evaluateSafety(analisis) {
    const descripcion = analisis.descripcion || '';
    let score = 70; // Asumir seguridad media por defecto
    
    // Indicadores de seguridad
    const safetyIndicators = ['seguro', 'protegido', 'adecuado'];
    const riskIndicators = ['riesgo', 'peligro', 'inseguro', 'exposición'];
    
    safetyIndicators.forEach(indicator => {
      if (descripcion.toLowerCase().includes(indicator)) score += 10;
    });
    
    riskIndicators.forEach(indicator => {
      if (descripcion.toLowerCase().includes(indicator)) score -= 15;
    });
    
    return Math.max(0, Math.min(100, score));
  }

  _evaluateEquipmentState(analisis) {
    const descripcion = analisis.descripcion || '';
    const objetos = analisis.objetos_detectados || [];
    
    let score = 65; // Base score
    
    // Evaluar estado de equipos mencionado
    const goodCondition = ['nuevo', 'buen estado', 'funcional', 'operativo'];
    const poorCondition = ['dañado', 'deteriorado', 'obsoleto', 'roto'];
    
    goodCondition.forEach(condition => {
      if (descripcion.toLowerCase().includes(condition)) score += 12;
    });
    
    poorCondition.forEach(condition => {
      if (descripcion.toLowerCase().includes(condition)) score -= 18;
    });
    
    // Bonificar por diversidad de equipos detectados
    score += Math.min(10, objetos.length);
    
    return Math.max(0, Math.min(100, score));
  }

  // ===================
  // MÉTODOS AUXILIARES
  // ===================

  _applyCriteriaAdjustment(analisis, criterios, type) {
    if (!criterios || criterios.length === 0) return 0;
    
    let adjustment = 0;
    const maxAdjustment = 20; // Máximo ajuste ±20 puntos
    
    criterios.forEach(criterio => {
      const peso = criterio.peso || 1;
      const cumple = this._checkCriteriaCompliance(analisis, criterio);
      
      if (cumple) {
        adjustment += peso * 2; // Bonificación por cumplir criterio
      } else {
        adjustment -= peso * 1.5; // Penalización por no cumplir
      }
    });
    
    return Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));
  }

  _checkCriteriaCompliance(analisis, criterio) {
    const contenido = JSON.stringify(analisis).toLowerCase();
    const nombreCriterio = (criterio.nombre || criterio).toLowerCase();
    
    return contenido.includes(nombreCriterio);
  }

  _getComplianceLevel(score) {
    if (score >= this.complianceThresholds.excelente) return 'excelente';
    if (score >= this.complianceThresholds.bueno) return 'bueno';
    if (score >= this.complianceThresholds.aceptable) return 'aceptable';
    if (score >= this.complianceThresholds.deficiente) return 'deficiente';
    return 'critico';
  }

  _generateDocumentRecommendations(scores, finalScore) {
    const recommendations = [];
    
    if (scores.completeness < 70) {
      recommendations.push({
        categoria: 'completitud',
        mensaje: 'Mejorar completitud de la documentación',
        prioridad: 'alta'
      });
    }
    
    if (scores.accuracy < 60) {
      recommendations.push({
        categoria: 'precision',
        mensaje: 'Verificar precisión técnica de la información',
        prioridad: 'alta'
      });
    }
    
    if (scores.compliance < 50) {
      recommendations.push({
        categoria: 'cumplimiento',
        mensaje: 'Revisar cumplimiento de criterios específicos',
        prioridad: 'media'
      });
    }
    
    if (finalScore < 60) {
      recommendations.push({
        categoria: 'general',
        mensaje: 'Requiere revisión integral del documento',
        prioridad: 'alta'
      });
    }
    
    return recommendations;
  }

  _generateImageRecommendations(scores, finalScore) {
    const recommendations = [];
    
    if (scores.organization < 70) {
      recommendations.push({
        categoria: 'organizacion',
        mensaje: 'Mejorar organización del espacio de trabajo',
        prioridad: 'media'
      });
    }
    
    if (scores.safety < 60) {
      recommendations.push({
        categoria: 'seguridad',
        mensaje: 'Revisar aspectos de seguridad identificados',
        prioridad: 'alta'
      });
    }
    
    if (scores.equipment_state < 50) {
      recommendations.push({
        categoria: 'equipos',
        mensaje: 'Evaluar estado y mantenimiento de equipos',
        prioridad: 'alta'
      });
    }
    
    return recommendations;
  }

  _hasVagueLanguage(text) {
    const vagueTerms = ['posiblemente', 'parece', 'podría', 'tal vez', 'quizás'];
    return vagueTerms.some(term => text.toLowerCase().includes(term));
  }

  _hasTechnicalTerms(text) {
    const technicalTerms = ['hardware', 'software', 'servidor', 'red', 'configuración', 'sistema'];
    return technicalTerms.some(term => text.toLowerCase().includes(term));
  }

  _hasGoodStructure(text) {
    // Verificar si tiene estructura (párrafos, listas, etc.)
    return text.includes('\n') || text.includes('1.') || text.includes('-') || text.includes('•');
  }

  _hasSpecificDetails(text) {
    // Verificar si contiene detalles específicos (números, fechas, nombres)
    return /\d/.test(text) && text.length > 150;
  }
}

module.exports = ScoringEngine;
