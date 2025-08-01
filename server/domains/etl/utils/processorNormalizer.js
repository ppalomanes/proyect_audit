// /server/domains/etl/utils/processorNormalizer.js
// Portal de Auditorías Técnicas - Normalización Avanzada de Procesadores
// Integrado desde normalizador-procesadores con umbrales específicos del Portal

/**
 * Normaliza y clasifica información de procesadores según umbrales del Portal de Auditorías
 * @param {string} processor - Texto que describe el procesador
 * @param {Object} customRules - Reglas personalizadas de validación (opcional)
 * @returns {Object} Objeto con la información normalizada
 */
const normalizeProcessor = (processor, customRules = null) => {
  if (!processor || typeof processor !== "string") {
    return {
      original: processor || "",
      brand: "Desconocido",
      model: "Desconocido",
      generation: null,
      speed: null,
      normalized: "Desconocido",
      meetsRequirements: false,
      reason: "Datos de procesador no válidos",
    };
  }

  // Guardar el texto original antes de cualquier limpieza
  const original = processor.trim();

  // Limpiar el texto manteniendo información importante
  let cleaned = processor
    .replace(/\[.*?\]/g, "") // Eliminar texto entre corchetes
    .replace(/\(R\)|\(TM\)|\(tm\)|\(r\)/gi, "") // Eliminar símbolos de marca registrada
    .replace(/\((?!R\)|TM\)|tm\)|r\)).*?\)/g, " ") // Eliminar otros textos entre paréntesis
    .replace(
      /processor|cpu|procesador|@|with|con|de|dual|quad|core|cores|núcleos/gi,
      " "
    )
    .replace(/\bv\d+\b/gi, "") // Eliminar versiones como "v2"
    .replace(/\s+/g, " ") // Reemplazar múltiples espacios por uno solo
    .trim();

  // Variables para almacenar información extraída
  let brand = null;
  let model = null;
  let generation = null;
  let speed = null;
  let modelNumber = null;
  let architecture = null;

  // === DETECCIÓN DE MARCA ===
  if (/\b(?:intel|intell|inten)\b/i.test(cleaned)) {
    brand = "Intel";
  } else if (/\b(?:amd|advanced\s*micro\s*devices)\b/i.test(cleaned)) {
    brand = "AMD";
  } else {
    // Intentar detectar marca por contexto
    const knownBrands = [
      { pattern: /\bi[3579][-\s]/i, brand: "Intel" },
      { pattern: /core\s*i[3579]/i, brand: "Intel" },
      { pattern: /pentium|celeron|xeon/i, brand: "Intel" },
      { pattern: /ryzen|phenom|athlon|threadripper|epyc/i, brand: "AMD" },
    ];

    for (const { pattern, brand: detectedBrand } of knownBrands) {
      if (pattern.test(cleaned)) {
        brand = detectedBrand;
        break;
      }
    }

    if (!brand) {
      brand = "Otro";
    }
  }

  // === DETECCIÓN DE MODELO INTEL ===
  if (brand === "Intel") {
    if (
      /core\s*i[3579]/i.test(cleaned) ||
      /\bi[3579](?:[-\s]\d|$)/i.test(cleaned)
    ) {
      // Identificar modelos i3, i5, i7, i9
      if (/i3/i.test(cleaned)) {
        model = "Core i3";
      } else if (/i5/i.test(cleaned)) {
        model = "Core i5";
      } else if (/i7/i.test(cleaned)) {
        model = "Core i7";
      } else if (/i9/i.test(cleaned)) {
        model = "Core i9";
      }

      // Extraer número de modelo
      const modelPatterns = [
        /i[3579][-\s]+(\d{3,5}[A-Z]*)/i, // i5-10400F, i7-9700K
        /i[3579](\d{4,5}[A-Z]*)/i, // i54440 (sin separador)
        /i[3579][-\s]+(\d+)/i, // Patrón simple
      ];

      for (const pattern of modelPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          modelNumber = match[1];
          break;
        }
      }

      // Extraer generación del número de modelo
      if (modelNumber && /^\d{4}/.test(modelNumber)) {
        generation = parseInt(modelNumber.charAt(0));
      } else if (modelNumber && /^\d{3}/.test(modelNumber)) {
        generation = parseInt(modelNumber.charAt(0));
      }

      // Detectar sufijos (F, K, T, etc.)
      if (modelNumber && /[A-Z]$/.test(modelNumber)) {
        const suffix = modelNumber.match(/([A-Z]+)$/)[1];
        const suffixMeaning = {
          K: "Desbloqueado",
          F: "Sin gráficos integrados",
          T: "Bajo consumo",
          U: "Ultra bajo consumo",
          H: "Alto rendimiento",
        };
        architecture = suffixMeaning[suffix] || `Sufijo ${suffix}`;
      }
    } else if (/celeron/i.test(cleaned)) {
      model = "Celeron";
    } else if (/pentium/i.test(cleaned)) {
      model = "Pentium";
    } else if (/xeon/i.test(cleaned)) {
      model = "Xeon";
    } else {
      // Intentar detectar Core sin la palabra "Core"
      const coreMatch = cleaned.match(/\bi([3579])[-\s]+(\d{3,5}[A-Z]*)/i);
      if (coreMatch) {
        model = `Core i${coreMatch[1]}`;
        modelNumber = coreMatch[2];
        if (/^\d{4}/.test(modelNumber)) {
          generation = parseInt(modelNumber.charAt(0));
        }
      } else {
        model = "Otro Intel";
      }
    }
  }

  // === DETECCIÓN DE MODELO AMD ===
  else if (brand === "AMD") {
    if (/ryzen/i.test(cleaned)) {
      if (/ryzen\s*3/i.test(cleaned)) {
        model = "Ryzen 3";
      } else if (/ryzen\s*5/i.test(cleaned)) {
        model = "Ryzen 5";
      } else if (/ryzen\s*7/i.test(cleaned)) {
        model = "Ryzen 7";
      } else if (/ryzen\s*9/i.test(cleaned)) {
        model = "Ryzen 9";
      } else {
        model = "Ryzen";
      }

      // Extraer número de modelo
      const ryzenPatterns = [
        /ryzen\s*\d\s*(\d{4}[A-Z]*)/i, // Ryzen 5 3600X
        /ryzen\s*(\d{4}[A-Z]*)/i, // Ryzen 3600X
      ];

      for (const pattern of ryzenPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          modelNumber = match[1];
          // Extraer generación (primer dígito del modelo)
          generation = parseInt(modelNumber.charAt(0));
          break;
        }
      }

      // Detectar sufijos AMD
      if (modelNumber && /[A-Z]+$/.test(modelNumber)) {
        const suffix = modelNumber.match(/([A-Z]+)$/)[1];
        const suffixMeaning = {
          X: "Alto rendimiento",
          XT: "Rendimiento mejorado",
          G: "Con gráficos integrados",
        };
        architecture = suffixMeaning[suffix] || `Sufijo ${suffix}`;
      }
    } else if (/athlon/i.test(cleaned)) {
      model = "Athlon";
    } else if (/phenom/i.test(cleaned)) {
      model = "Phenom";
    } else if (/epyc/i.test(cleaned)) {
      model = "EPYC";
    } else {
      model = "Otro AMD";
    }
  }

  // === DETECCIÓN DE VELOCIDAD ===
  const speedPatterns = [
    /(\d+[\.,]\d+)\s*(?:GHz|ghz|Ghz)/i, // 3.4GHz
    /@\s*(\d+[\.,]\d+)/i, // @ 3.4
    /(\d+[\.,]\d+)\s*[Gg][Hh]/i, // 3.4Gh
  ];

  for (const pattern of speedPatterns) {
    const speedMatch = cleaned.match(pattern);
    if (speedMatch) {
      const speedNum = parseFloat(speedMatch[1].replace(",", "."));
      speed = speedNum.toFixed(1) + " GHz";
      break;
    }
  }

  // Buscar velocidad en números aislados si no se encontró
  if (!speed) {
    const numericMatches = cleaned.match(/\b(\d+[\.,]\d+)\b/g);
    if (numericMatches) {
      const possibleSpeeds = numericMatches
        .map((m) => parseFloat(m.replace(",", ".")))
        .filter((n) => n >= 1.0 && n <= 5.5);

      if (possibleSpeeds.length > 0) {
        const maxSpeed = Math.max(...possibleSpeeds);
        speed = maxSpeed.toFixed(1) + " GHz";
      }
    }
  }

  // Buscar generación explícita si no se encontró
  if (!generation) {
    const genMatches = [
      /(\d{1,2})(?:th|nd|rd|º|°|ª|va)\s*gen/i,
      /gen(?:eration)?[\s:-]*(\d{1,2})/i,
    ];

    for (const pattern of genMatches) {
      const match = cleaned.match(pattern);
      if (match) {
        generation = parseInt(match[1]);
        break;
      }
    }
  }

  // === CONSTRUCCIÓN DE CADENA NORMALIZADA ===
  let normalized = `${brand} ${model}`;

  if (modelNumber) {
    if (brand === "Intel" && /Core i[3579]/i.test(model)) {
      normalized += `-${modelNumber}`;
    } else {
      normalized += ` ${modelNumber}`;
    }
  }

  if (speed) {
    normalized += ` @ ${speed}`;
  }

  // === VALIDACIÓN SEGÚN UMBRALES DEL PORTAL DE AUDITORÍAS ===
  let meetsRequirements = false;
  let reason = "";

  const speedValue = speed ? parseFloat(speed.replace(" GHz", "")) : 0;

  // Umbrales específicos del Portal de Auditorías Técnicas
  if (brand === "Intel" && model === "Core i5") {
    // Intel Core i5 3.0 GHz 8va Gen o superior
    const minGeneration = 8;
    const minSpeed = 3.0;

    if (generation && generation >= minGeneration) {
      if (speedValue >= minSpeed) {
        meetsRequirements = true;
      } else {
        reason = `Velocidad insuficiente: ${speed || "Desconocida"} (requiere ${minSpeed} GHz o superior)`;
      }
    } else {
      reason = `Generación insuficiente: ${generation || "Desconocida"} Gen (requiere ${minGeneration}va Gen o superior)`;
    }
  } else if (brand === "AMD" && model === "Ryzen 5") {
    // AMD Ryzen 5 3.7 GHz o superior
    const minSpeed = 3.7;

    if (speedValue >= minSpeed) {
      meetsRequirements = true;
    } else {
      reason = `Velocidad insuficiente: ${speed || "Desconocida"} (requiere ${minSpeed} GHz o superior)`;
    }
  } else if (
    (brand === "Intel" && (model === "Core i7" || model === "Core i9")) ||
    (brand === "AMD" && (model === "Ryzen 7" || model === "Ryzen 9"))
  ) {
    // Procesadores de alta gama - siempre cumplen
    meetsRequirements = true;
  } else if (brand === "Intel" && model === "Xeon") {
    // Xeon - verificar si es serie reciente
    if (modelNumber && (/v[3-9]/i.test(modelNumber) || /Gold|Silver|Bronze|Platinum/i.test(modelNumber))) {
      meetsRequirements = true;
    } else {
      reason = "Se requiere Xeon E5 v3+ o serie Gold/Silver/Bronze/Platinum";
    }
  } else if (brand === "AMD" && model === "EPYC") {
    // EPYC - todos cumplen
    meetsRequirements = true;
  } else {
    reason = `Procesador no cumple especificaciones mínimas: ${brand} ${model}`;
  }

  return {
    original,
    brand,
    model,
    modelNumber,
    generation,
    architecture,
    speed,
    speedValue,
    normalized,
    meetsRequirements,
    reason,
  };
};

module.exports = {
  normalizeProcessor,
};
