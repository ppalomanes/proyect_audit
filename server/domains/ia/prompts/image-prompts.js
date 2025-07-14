/**
 * Image Prompts - Generador de Prompts para Análisis de Imágenes
 * Portal de Auditorías Técnicas
 */

class ImagePrompts {
  constructor() {
    this.version = '1.1.0';
    this.analysisTypes = {
      'general': 'Análisis general de imagen',
      'technical': 'Análisis técnico de equipos',
      'compliance': 'Verificación de cumplimiento',
      'safety': 'Análisis de seguridad',
      'organization': 'Evaluación de organización',
      'infrastructure': 'Análisis de infraestructura'
    };
  }

  /**
   * Generar prompt principal para análisis de imagen
   */
  generateAnalysisPrompt(criterios = [], opciones = {}) {
    const {
      tipo_analisis = 'general',
      detectar_objetos = true,
      evaluar_organizacion = true,
      verificar_seguridad = true,
      nivel_detalle = 'completo',
      contexto_auditoria = true
    } = opciones;

    let prompt = this._buildBaseImagePrompt(tipo_analisis, contexto_auditoria);

    // Agregar secciones específicas
    if (detectar_objetos) {
      prompt += this._addObjectDetectionSection();
    }

    if (evaluar_organizacion) {
      prompt += this._addOrganizationSection();
    }

    if (verificar_seguridad) {
      prompt += this._addSafetySection();
    }

    // Agregar criterios específicos
    if (criterios && criterios.length > 0) {
      prompt += this._addCriteriaSection(criterios);
    }

    // Agregar instrucciones de formato
    prompt += this._addImageFormatInstructions(nivel_detalle);

    return prompt;
  }

  /**
   * Prompt para análisis técnico especializado
   */
  generateTechnicalPrompt(criterios = [], opciones = {}) {
    const {
      evaluar_hardware = true,
      evaluar_cableado = true,
      evaluar_ventilacion = true,
      evaluar_energia = true,
      incluir_recomendaciones = true
    } = opciones;

    let prompt = `# ANÁLISIS TÉCNICO ESPECIALIZADO DE IMAGEN

## OBJETIVO:
Realizar una evaluación técnica exhaustiva de la infraestructura IT visible en la imagen, enfocándose en aspectos críticos para operaciones de call center.

## CONTEXTO ESPECÍFICO:
Esta imagen forma parte de una auditoría técnica de un proveedor de servicios de call center. Evalúa la imagen considerando:
- Estándares de la industria de telecomunicaciones
- Mejores prácticas de gestión de infraestructura IT
- Requisitos de disponibilidad y confiabilidad
- Cumplimiento de normas de seguridad

## ÁREAS DE EVALUACIÓN TÉCNICA:`;

    if (evaluar_hardware) {
      prompt += `
### 1. EQUIPOS Y HARDWARE:
- Identifica todos los equipos tecnológicos visibles
- Evalúa el estado aparente de los equipos
- Verifica compatibilidad y consistencia entre equipos
- Analiza la distribución y ubicación de hardware

**Equipos a buscar específicamente:**
- Servidores, computadoras de escritorio, laptops
- Monitores, impresoras, scanners
- Equipos de red (routers, switches, modems)
- Equipos de comunicación (teléfonos IP, headsets)`;
    }

    if (evaluar_cableado) {
      prompt += `
### 2. GESTIÓN DE CABLEADO:
- Evalúa la organización del cableado de red y eléctrico
- Identifica uso de organizadores de cables, canaletas
- Verifica etiquetado y documentación de cables
- Analiza accesibilidad para mantenimiento

**Criterios de evaluación:**
- Excelente: Cableado organizado, etiquetado, en canaletas
- Bueno: Organizado pero con mejoras menores
- Regular: Parcialmente organizado, algunas deficiencias
- Deficiente: Cableado desordenado, sin organización`;
    }

    if (incluir_recomendaciones) {
      prompt += `
## FORMATO DE RESPUESTA TÉCNICA:
Proporciona un análisis estructurado que incluya:
- Evaluación técnica general con score
- Análisis por área técnica evaluada
- Hallazgos críticos identificados
- Recomendaciones técnicas priorizadas
- Cumplimiento de criterios específicos`;
    }

    return prompt;
  }

  // ===================
  // MÉTODOS AUXILIARES
  // ===================

  _buildBaseImagePrompt(tipoAnalisis, contextoAuditoria) {
    let prompt = `# ANÁLISIS DE IMAGEN - ${this.analysisTypes[tipoAnalisis]?.toUpperCase() || 'ANÁLISIS GENERAL'}

## INSTRUCCIONES GENERALES:
Analiza cuidadosamente la imagen proporcionada, enfocándote en elementos relacionados con infraestructura tecnológica, organización del espacio de trabajo y aspectos relevantes para auditorías técnicas.`;

    if (contextoAuditoria) {
      prompt += `
## CONTEXTO DE AUDITORÍA:
Esta imagen forma parte de una auditoría técnica para un proveedor de servicios de call center. Considera:
- Estándares de la industria de telecomunicaciones
- Requisitos de disponibilidad y confiabilidad operativa
- Mejores prácticas de gestión de infraestructura IT
- Normativas de seguridad y protección de datos
- Eficiencia operativa y mantenibilidad`;
    }

    prompt += `
## METODOLOGÍA DE ANÁLISIS:
1. **Observación sistemática**: Examina la imagen de forma metódica
2. **Identificación de elementos**: Cataloga todos los objetos y equipos visibles
3. **Evaluación de estado**: Assess la condición y organización
4. **Detección de problemas**: Identifica deficiencias o riesgos
5. **Generación de recomendaciones**: Propone mejoras específicas`;

    return prompt;
  }

  _addObjectDetectionSection() {
    return `
## DETECCIÓN DE OBJETOS Y EQUIPOS:

### Equipos Tecnológicos Principales:
- Computadoras (desktop, laptops, servidores)
- Equipos de red (routers, switches, access points)
- Dispositivos de comunicación (teléfonos, headsets)
- Equipos de impresión y digitalización
- Sistemas de almacenamiento

### Infraestructura de Soporte:
- Racks y gabinetes de equipos
- Sistemas de alimentación (UPS, PDU)
- Cableado estructurado y patch panels
- Sistemas de climatización
- Herramientas y equipos de mantenimiento

### Elementos de Organización:
- Etiquetas y documentación
- Organizadores de cables
- Mobiliario especializado
- Elementos de señalización
- Sistemas de inventario`;
  }

  _addOrganizationSection() {
    return `
## EVALUACIÓN DE ORGANIZACIÓN:

### Criterios de Organización:
- **Excelente**: Espacio perfectamente organizado, todo en su lugar
- **Bueno**: Bien organizado con mejoras menores posibles
- **Regular**: Organización básica, algunas deficiencias
- **Deficiente**: Desorganizado, requiere mejoras significativas
- **Crítico**: Completamente desorganizado, impacta operaciones

### Aspectos a Evaluar:
- Distribución lógica de equipos y espacios
- Gestión eficiente del cableado
- Limpieza y mantenimiento aparente
- Accesibilidad para operación y mantenimiento
- Uso eficiente del espacio disponible
- Separación adecuada entre diferentes tipos de equipos`;
  }

  _addSafetySection() {
    return `
## VERIFICACIÓN DE SEGURIDAD:

### Seguridad Física:
- Estabilidad y sujeción de equipos
- Gestión segura del cableado eléctrico
- Ausencia de obstrucciones en rutas de acceso
- Protección contra riesgos ambientales
- Sistemas de protección contra incendios

### Seguridad Informática:
- Control de acceso físico a equipos críticos
- Protección de información sensible visible
- Gestión segura de dispositivos portátiles
- Presencia de sistemas de monitoreo
- Separación adecuada de áreas críticas`;
  }

  _addCriteriaSection(criterios) {
    let section = `
## CRITERIOS ESPECÍFICOS DE EVALUACIÓN:
Evalúa la imagen considerando los siguientes criterios específicos:`;

    criterios.forEach((criterio, index) => {
      section += `
${index + 1}. **${criterio.nombre}**
   - Descripción: ${criterio.descripcion || 'No especificada'}
   - Tipo: ${criterio.tipo || 'general'}
   - Peso: ${criterio.peso || 1}`;
    });

    section += `
### EVALUACIÓN REQUERIDA PARA CADA CRITERIO:
- Cumplimiento visual (CUMPLE/NO_CUMPLE/PARCIAL/NO_VISIBLE)
- Evidencia específica observada en la imagen
- Ubicación aproximada en la imagen
- Score individual (0-100)
- Observaciones y recomendaciones`;

    return section;
  }

  _addImageFormatInstructions(nivelDetalle) {
    let instructions = `
## FORMATO DE RESPUESTA REQUERIDO:
Estructura tu análisis de manera clara y organizada, incluyendo:

- Resumen general del estado observado
- Objetos y equipos identificados
- Evaluación de organización y limpieza
- Aspectos de seguridad identificados
- Cumplimiento de criterios específicos
- Recomendaciones priorizadas`;

    if (nivelDetalle === 'basico') {
      instructions += `
### NIVEL BÁSICO - Enfócate en:
- Elementos más evidentes y relevantes
- Máximo 5 objetos principales
- 3 recomendaciones prioritarias
- Observaciones concisas`;
    } else if (nivelDetalle === 'detallado') {
      instructions += `
### NIVEL DETALLADO - Incluye:
- Análisis exhaustivo de todos los elementos visibles
- Descripción detallada de ubicaciones y estados
- Evaluación de impactos y riesgos específicos
- Recomendaciones específicas y accionables
- Referencias cruzadas entre elementos`;
    }

    return instructions;
  }

  /**
   * Obtener versión del generador
   */
  getVersion() {
    return this.version;
  }

  /**
   * Obtener tipos de análisis disponibles
   */
  getAnalysisTypes() {
    return Object.keys(this.analysisTypes);
  }
}

module.exports = ImagePrompts;
