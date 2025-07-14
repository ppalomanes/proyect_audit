/**
 * Document Prompts - Generador de Prompts para Análisis de Documentos
 * Portal de Auditorías Técnicas
 */

class DocumentPrompts {
  constructor() {
    this.version = '1.2.0';
    this.promptTemplates = {
      'general': 'general_analysis',
      'technical': 'technical_specification',
      'compliance': 'compliance_check',
      'contract': 'contract_analysis',
      'manual': 'manual_review',
      'certification': 'certification_verification'
    };
  }

  /**
   * Generar prompt principal para análisis de documento
   */
  generateAnalysisPrompt(contenidoTexto, criterios = [], opciones = {}) {
    const {
      tipo_documento = 'general',
      nivel_detalle = 'completo',
      formato_salida = 'structured',
      incluir_metadatos = true,
      enfoque_auditoria = true
    } = opciones;

    // Seleccionar template base
    const baseTemplate = this._getBaseTemplate(tipo_documento);
    
    // Construir prompt específico
    let prompt = this._buildContextualPrompt(baseTemplate, contenidoTexto, opciones);
    
    // Agregar criterios específicos
    if (criterios && criterios.length > 0) {
      prompt += this._addCriteriaSection(criterios);
    }
    
    // Agregar instrucciones de formato
    prompt += this._addFormatInstructions(formato_salida, nivel_detalle);
    
    // Agregar contexto de auditoría si se solicita
    if (enfoque_auditoria) {
      prompt += this._addAuditContext();
    }

    return prompt;
  }

  /**
   * Prompt para análisis técnico especializado
   */
  generateTechnicalPrompt(contenidoTexto, especificaciones = [], opciones = {}) {
    const {
      verificar_hardware = true,
      verificar_software = true,
      verificar_redes = true,
      verificar_seguridad = true,
      incluir_recomendaciones = true
    } = opciones;

    let prompt = `# ANÁLISIS TÉCNICO ESPECIALIZADO

## DOCUMENTO A ANALIZAR:
${this._truncateContent(contenidoTexto, 6000)}

## OBJETIVO:
Realizar un análisis técnico exhaustivo del documento, evaluando especificaciones, configuraciones y cumplimiento de estándares técnicos.

## ÁREAS DE ANÁLISIS:`;

    if (verificar_hardware) {
      prompt += `
### 1. HARDWARE Y EQUIPOS:
- Especificaciones de servidores, computadoras y periféricos
- Cumplimiento de requisitos mínimos
- Compatibilidad entre componentes
- Estado y antigüedad de equipos`;
    }

    if (verificar_software) {
      prompt += `
### 2. SOFTWARE Y APLICACIONES:
- Sistemas operativos y versiones
- Aplicaciones instaladas y licencias
- Configuraciones de seguridad
- Actualizaciones y parches`;
    }

    if (verificar_redes) {
      prompt += `
### 3. INFRAESTRUCTURA DE RED:
- Topología de red documentada
- Equipos de conectividad (routers, switches)
- Configuraciones de red y VLAN
- Protocolos y servicios de red`;
    }

    if (verificar_seguridad) {
      prompt += `
### 4. SEGURIDAD INFORMÁTICA:
- Políticas de seguridad implementadas
- Sistemas de respaldo y recuperación
- Control de acceso y autenticación
- Protección contra malware`;
    }

    if (incluir_recomendaciones) {
      prompt += `
## FORMATO DE RESPUESTA:
Proporciona un análisis estructurado que incluya:
- Resumen ejecutivo de hallazgos principales
- Evaluación por área técnica
- Hallazgos críticos identificados
- Recomendaciones priorizadas
- Score general de cumplimiento técnico`;
    }

    return prompt;
  }

  // ===================
  // MÉTODOS AUXILIARES
  // ===================

  _getBaseTemplate(tipoDocumento) {
    const templates = {
      'general': {
        objetivo: 'Realizar un análisis completo del documento identificando contenido principal, estructura y elementos relevantes.',
        enfoque: 'general'
      },
      'technical': {
        objetivo: 'Analizar especificaciones técnicas, configuraciones y requisitos técnicos del documento.',
        enfoque: 'técnico especializado'
      },
      'compliance': {
        objetivo: 'Verificar cumplimiento de estándares, normas y criterios establecidos.',
        enfoque: 'cumplimiento normativo'
      }
    };

    return templates[tipoDocumento] || templates['general'];
  }

  _buildContextualPrompt(template, contenido, opciones) {
    let prompt = `# ANÁLISIS DE DOCUMENTO - ${template.enfoque.toUpperCase()}

## CONTEXTO DE AUDITORÍA:
Este análisis forma parte de una auditoría técnica de proveedores de servicios de call center. El documento debe ser evaluado considerando estándares de calidad, cumplimiento normativo y viabilidad técnica.

## DOCUMENTO A ANALIZAR:
${this._truncateContent(contenido, 6000)}

## OBJETIVO DEL ANÁLISIS:
${template.objetivo}

## INSTRUCCIONES ESPECÍFICAS:`;

    if (opciones.incluir_metadatos) {
      prompt += `
- Incluir metadatos relevantes del documento
- Identificar tipo de documento y características`;
    }

    return prompt;
  }

  _addCriteriaSection(criterios) {
    let section = `
## CRITERIOS ESPECÍFICOS DE EVALUACIÓN:`;

    criterios.forEach((criterio, index) => {
      section += `
${index + 1}. **${criterio.nombre}**
   - Descripción: ${criterio.descripcion || 'No especificada'}
   - Peso: ${criterio.peso || 1}
   - Tipo: ${criterio.tipo || 'general'}`;
    });

    section += `
### EVALUACIÓN REQUERIDA:
Para cada criterio, proporcionar:
- Estado de cumplimiento (CUMPLE/NO_CUMPLE/PARCIAL)
- Evidencia encontrada en el documento
- Observaciones específicas
- Score numérico (0-100)`;

    return section;
  }

  _addFormatInstructions(formatoSalida, nivelDetalle) {
    let instructions = `
## FORMATO DE RESPUESTA REQUERIDO:
Responde en formato JSON estructurado con las siguientes secciones:
{
  "resumen_ejecutivo": "string - Resumen de 2-3 líneas",
  "tipo_documento": "string - Tipo identificado",
  "hallazgos_principales": ["array de strings"],
  "cumplimiento_criterios": {
    "criterio_id": {
      "cumple": boolean,
      "score": number,
      "evidencia": "string",
      "observaciones": "string"
    }
  },
  "recomendaciones": [
    {
      "categoria": "string",
      "descripcion": "string",
      "prioridad": "alta|media|baja"
    }
  ],
  "score_general": number
}`;

    if (nivelDetalle === 'basico') {
      instructions += `
### NIVEL DE DETALLE: BÁSICO
- Enfocarse en hallazgos principales
- Máximo 3 recomendaciones prioritarias
- Respuesta concisa y directa`;
    } else if (nivelDetalle === 'detallado') {
      instructions += `
### NIVEL DE DETALLE: DETALLADO
- Incluir análisis exhaustivo de cada sección
- Proporcionar evidencia específica para cada hallazgo
- Incluir contexto y explicaciones técnicas
- Generar recomendaciones específicas y accionables`;
    }

    return instructions;
  }

  _addAuditContext() {
    return `
## CONTEXTO DE AUDITORÍA TÉCNICA:
Esta evaluación se realiza en el marco de una auditoría técnica para proveedores de call center, por lo tanto:

1. **Estándares aplicables**: ISO 27001, ITIL, mejores prácticas de la industria
2. **Aspectos críticos**: Seguridad, disponibilidad, escalabilidad, cumplimiento
3. **Enfoque de riesgo**: Identificar riesgos operativos, técnicos y de seguridad
4. **Perspectiva de negocio**: Considerar impacto en operaciones de call center

### CRITERIOS DE EVALUACIÓN ESTÁNDAR:
- **Excelente (90-100)**: Cumple completamente con mejores prácticas
- **Bueno (75-89)**: Cumple con estándares mínimos, mejoras menores
- **Aceptable (60-74)**: Cumple parcialmente, requiere mejoras
- **Deficiente (40-59)**: No cumple estándares, mejoras significativas requeridas
- **Crítico (0-39)**: Incumplimiento grave, acción inmediata requerida`;
  }

  _truncateContent(content, maxLength) {
    if (content.length <= maxLength) {
      return content;
    }
    
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > maxLength * 0.8 ? 
      truncated.substring(0, lastSpace) + '...\n[CONTENIDO TRUNCADO]' :
      truncated + '...\n[CONTENIDO TRUNCADO]';
  }

  /**
   * Obtener versión del generador de prompts
   */
  getVersion() {
    return this.version;
  }

  /**
   * Listar templates disponibles
   */
  getAvailableTemplates() {
    return Object.keys(this.promptTemplates);
  }
}

module.exports = DocumentPrompts;
