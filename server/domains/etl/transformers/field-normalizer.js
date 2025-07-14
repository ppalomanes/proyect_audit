/**
 * Normalizador de Campos - ETL Portal de Auditorías
 * Transformación inteligente de valores a esquema normalizado
 */

class FieldNormalizer {
  constructor() {
    this.normalizationRules = {
      // Reglas específicas por tipo de campo
      proveedor: {
        type: 'string',
        maxLength: 255,
        transform: (value) => this.normalizeStringField(value, { capitalize: true })
      },
      
      sitio: {
        type: 'string',
        maxLength: 100,
        transform: (value) => this.normalizeStringField(value, { uppercase: true })
      },
      
      atencion: {
        type: 'enum',
        values: ['INBOUND', 'OUTBOUND', 'MIXTO', 'CHAT', 'EMAIL', 'SOPORTE'],
        transform: (value) => this.normalizeAtencionField(value)
      },
      
      usuario_id: {
        type: 'string',
        maxLength: 50,
        transform: (value) => this.normalizeIdField(value)
      },
      
      hostname: {
        type: 'string',
        maxLength: 100,
        transform: (value) => this.normalizeHostnameField(value)
      },
      
      // Hardware - CPU
      cpu_brand: {
        type: 'enum',
        values: ['Intel', 'AMD', 'Apple', 'Otro'],
        transform: (value) => this.normalizeCpuBrandField(value)
      },
      
      cpu_model: {
        type: 'string',
        maxLength: 200,
        transform: (value) => this.normalizeStringField(value)
      },
      
      cpu_speed_ghz: {
        type: 'decimal',
        min: 0.5,
        max: 10.0,
        transform: (value) => this.normalizeCpuSpeedField(value)
      },
      
      cpu_cores: {
        type: 'integer',
        min: 1,
        max: 64,
        transform: (value) => this.normalizeIntegerField(value, { min: 1, max: 64 })
      },
      
      // Hardware - Memoria
      ram_gb: {
        type: 'integer',
        min: 1,
        max: 1024,
        transform: (value) => this.normalizeRamField(value)
      },
      
      ram_type: {
        type: 'enum',
        values: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'Otro'],
        transform: (value) => this.normalizeRamTypeField(value)
      },
      
      // Hardware - Almacenamiento
      disk_type: {
        type: 'enum',
        values: ['HDD', 'SSD', 'NVME', 'Híbrido', 'Otro'],
        transform: (value) => this.normalizeDiskTypeField(value)
      },
      
      disk_capacity_gb: {
        type: 'integer',
        min: 50,
        max: 10000,
        transform: (value) => this.normalizeDiskCapacityField(value)
      },
      
      // Software - OS
      os_name: {
        type: 'enum',
        values: ['Windows 10', 'Windows 11', 'macOS', 'Linux', 'Chrome OS', 'Otro'],
        transform: (value) => this.normalizeOsNameField(value)
      },
      
      os_version: {
        type: 'string',
        maxLength: 50,
        transform: (value) => this.normalizeStringField(value)
      },
      
      os_architecture: {
        type: 'enum',
        values: ['x64', 'x86', 'ARM64', 'ARM', 'Otro'],
        transform: (value) => this.normalizeArchitectureField(value)
      },
      
      // Software - Navegador
      browser_name: {
        type: 'enum',
        values: ['Chrome', 'Firefox', 'Edge', 'Safari', 'Opera', 'Internet Explorer', 'Otro'],
        transform: (value) => this.normalizeBrowserNameField(value)
      },
      
      browser_version: {
        type: 'string',
        maxLength: 50,
        transform: (value) => this.normalizeVersionField(value)
      },
      
      // Software - Antivirus
      antivirus_brand: {
        type: 'string',
        maxLength: 100,
        transform: (value) => this.normalizeAntivirusField(value)
      },
      
      antivirus_version: {
        type: 'string',
        maxLength: 50,
        transform: (value) => this.normalizeVersionField(value)
      },
      
      antivirus_updated: {
        type: 'boolean',
        transform: (value) => this.normalizeBooleanField(value)
      },
      
      // Periféricos
      headset_brand: {
        type: 'string',
        maxLength: 100,
        transform: (value) => this.normalizeStringField(value, { capitalize: true })
      },
      
      headset_model: {
        type: 'string',
        maxLength: 100,
        transform: (value) => this.normalizeStringField(value)
      },
      
      // Conectividad
      isp_name: {
        type: 'string',
        maxLength: 100,
        transform: (value) => this.normalizeStringField(value, { capitalize: true })
      },
      
      connection_type: {
        type: 'enum',
        values: ['Fibra', 'Cable', 'DSL', 'Satelital', 'Móvil 4G', 'Móvil 5G', 'Otro'],
        transform: (value) => this.normalizeConnectionTypeField(value)
      },
      
      speed_download_mbps: {
        type: 'integer',
        min: 1,
        max: 10000,
        transform: (value) => this.normalizeSpeedField(value)
      },
      
      speed_upload_mbps: {
        type: 'integer',
        min: 1,
        max: 10000,
        transform: (value) => this.normalizeSpeedField(value)
      }
    };
  }

  /**
   * Normalizar un campo específico
   */
  async normalizeField(value, fieldType) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const rule = this.normalizationRules[fieldType];
    if (!rule) {
      return this.normalizeGenericField(value);
    }

    try {
      return rule.transform(value);
    } catch (error) {
      console.warn(`⚠️ Error normalizando campo ${fieldType}:`, error.message);
      return this.normalizeGenericField(value);
    }
  }

  /**
   * Normalización genérica para campos sin regla específica
   */
  normalizeGenericField(value) {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  }

  /**
   * Normalizar campos de string con opciones
   */
  normalizeStringField(value, options = {}) {
    if (!value) return null;
    
    let result = value.toString().trim();
    
    if (options.uppercase) {
      result = result.toUpperCase();
    } else if (options.lowercase) {
      result = result.toLowerCase();
    } else if (options.capitalize) {
      result = this.capitalizeWords(result);
    }
    
    return result;
  }

  /**
   * Capitalizar palabras
   */
  capitalizeWords(str) {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Normalizar campo de atención
   */
  normalizeAtencionField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    const mappings = {
      'inbound': 'INBOUND',
      'entrada': 'INBOUND',
      'entrante': 'INBOUND',
      'incoming': 'INBOUND',
      'outbound': 'OUTBOUND',
      'salida': 'OUTBOUND',
      'saliente': 'OUTBOUND',
      'outgoing': 'OUTBOUND',
      'mixto': 'MIXTO',
      'mixed': 'MIXTO',
      'hibrido': 'MIXTO',
      'chat': 'CHAT',
      'chat online': 'CHAT',
      'email': 'EMAIL',
      'correo': 'EMAIL',
      'mail': 'EMAIL',
      'soporte': 'SOPORTE',
      'support': 'SOPORTE',
      'tecnico': 'SOPORTE'
    };
    
    return mappings[valueStr] || 'MIXTO';
  }

  /**
   * Normalizar campo ID
   */
  normalizeIdField(value) {
    if (!value) return null;
    return value.toString().trim().replace(/[^\w\-]/g, '');
  }

  /**
   * Normalizar hostname
   */
  normalizeHostnameField(value) {
    if (!value) return null;
    return value.toString().trim().replace(/[^\w\-\.]/g, '').toUpperCase();
  }

  /**
   * Normalizar marca de CPU
   */
  normalizeCpuBrandField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    if (valueStr.includes('intel')) return 'Intel';
    if (valueStr.includes('amd')) return 'AMD';
    if (valueStr.includes('apple') || valueStr.includes('m1') || valueStr.includes('m2')) return 'Apple';
    
    return 'Otro';
  }

  /**
   * Normalizar velocidad de CPU
   */
  normalizeCpuSpeedField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    // Buscar patrón de velocidad: "2.5 GHz", "2500 MHz", etc.
    const ghzMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*ghz/);
    if (ghzMatch) {
      return parseFloat(ghzMatch[1]);
    }
    
    const mhzMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*mhz/);
    if (mhzMatch) {
      return parseFloat(mhzMatch[1]) / 1000;
    }
    
    // Si es solo un número, asumir que está en GHz
    const numero = parseFloat(valueStr);
    if (!isNaN(numero)) {
      // Si el número es muy grande, probablemente está en MHz
      return numero > 100 ? numero / 1000 : numero;
    }
    
    return null;
  }

  /**
   * Normalizar campo de RAM
   */
  normalizeRamField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    // Buscar patrón de RAM: "8 GB", "4096 MB", etc.
    const gbMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*gb/);
    if (gbMatch) {
      return Math.round(parseFloat(gbMatch[1]));
    }
    
    const mbMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*mb/);
    if (mbMatch) {
      return Math.round(parseFloat(mbMatch[1]) / 1024);
    }
    
    // Si es solo un número
    const numero = parseFloat(valueStr);
    if (!isNaN(numero)) {
      // Si el número es muy grande, probablemente está en MB
      return numero > 1000 ? Math.round(numero / 1024) : Math.round(numero);
    }
    
    return null;
  }

  /**
   * Normalizar tipo de RAM
   */
  normalizeRamTypeField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toUpperCase().trim();
    
    if (valueStr.includes('DDR5')) return 'DDR5';
    if (valueStr.includes('DDR4')) return 'DDR4';
    if (valueStr.includes('DDR3')) return 'DDR3';
    if (valueStr.includes('LPDDR5')) return 'LPDDR5';
    if (valueStr.includes('LPDDR4')) return 'LPDDR4';
    
    return 'Otro';
  }

  /**
   * Normalizar tipo de disco
   */
  normalizeDiskTypeField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    if (valueStr.includes('nvme') || valueStr.includes('pcie')) return 'NVME';
    if (valueStr.includes('ssd') || valueStr.includes('solid')) return 'SSD';
    if (valueStr.includes('hdd') || valueStr.includes('mechanical')) return 'HDD';
    if (valueStr.includes('hibrido') || valueStr.includes('hybrid')) return 'Híbrido';
    
    return 'Otro';
  }

  /**
   * Normalizar capacidad de disco
   */
  normalizeDiskCapacityField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    // Buscar patrón de capacidad: "500 GB", "1 TB", etc.
    const tbMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*tb/);
    if (tbMatch) {
      return Math.round(parseFloat(tbMatch[1]) * 1024);
    }
    
    const gbMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*gb/);
    if (gbMatch) {
      return Math.round(parseFloat(gbMatch[1]));
    }
    
    // Si es solo un número, asumir GB
    const numero = parseFloat(valueStr);
    if (!isNaN(numero)) {
      return Math.round(numero);
    }
    
    return null;
  }

  /**
   * Normalizar nombre de OS
   */
  normalizeOsNameField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    if (valueStr.includes('windows 11')) return 'Windows 11';
    if (valueStr.includes('windows 10')) return 'Windows 10';
    if (valueStr.includes('macos') || valueStr.includes('mac os')) return 'macOS';
    if (valueStr.includes('linux') || valueStr.includes('ubuntu') || valueStr.includes('fedora')) return 'Linux';
    if (valueStr.includes('chrome os') || valueStr.includes('chromeos')) return 'Chrome OS';
    
    return 'Otro';
  }

  /**
   * Normalizar arquitectura
   */
  normalizeArchitectureField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    if (valueStr.includes('x64') || valueStr.includes('amd64') || valueStr.includes('64')) return 'x64';
    if (valueStr.includes('x86') || valueStr.includes('32')) return 'x86';
    if (valueStr.includes('arm64') || valueStr.includes('aarch64')) return 'ARM64';
    if (valueStr.includes('arm')) return 'ARM';
    
    return 'Otro';
  }

  /**
   * Normalizar nombre de navegador
   */
  normalizeBrowserNameField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    if (valueStr.includes('chrome')) return 'Chrome';
    if (valueStr.includes('firefox')) return 'Firefox';
    if (valueStr.includes('edge')) return 'Edge';
    if (valueStr.includes('safari')) return 'Safari';
    if (valueStr.includes('opera')) return 'Opera';
    if (valueStr.includes('internet explorer') || valueStr.includes('ie')) return 'Internet Explorer';
    
    return 'Otro';
  }

  /**
   * Normalizar versión
   */
  normalizeVersionField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().trim();
    // Extraer solo números y puntos para versión
    const versionMatch = valueStr.match(/[\d\.]+/);
    return versionMatch ? versionMatch[0] : valueStr;
  }

  /**
   * Normalizar antivirus
   */
  normalizeAntivirusField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    const antivirusMap = {
      'windows defender': 'Windows Defender',
      'defender': 'Windows Defender',
      'kaspersky': 'Kaspersky',
      'norton': 'Norton',
      'mcafee': 'McAfee',
      'avg': 'AVG',
      'avast': 'Avast',
      'bitdefender': 'Bitdefender',
      'eset': 'ESET',
      'malwarebytes': 'Malwarebytes'
    };
    
    for (const [key, normalized] of Object.entries(antivirusMap)) {
      if (valueStr.includes(key)) {
        return normalized;
      }
    }
    
    return this.capitalizeWords(valueStr);
  }

  /**
   * Normalizar tipo de conexión
   */
  normalizeConnectionTypeField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    if (valueStr.includes('fibra') || valueStr.includes('fiber')) return 'Fibra';
    if (valueStr.includes('cable')) return 'Cable';
    if (valueStr.includes('dsl') || valueStr.includes('adsl')) return 'DSL';
    if (valueStr.includes('satelit')) return 'Satelital';
    if (valueStr.includes('5g')) return 'Móvil 5G';
    if (valueStr.includes('4g') || valueStr.includes('lte')) return 'Móvil 4G';
    
    return 'Otro';
  }

  /**
   * Normalizar velocidad de internet
   */
  normalizeSpeedField(value) {
    if (!value) return null;
    
    const valueStr = value.toString().toLowerCase().trim();
    
    // Buscar patrón de velocidad: "100 Mbps", "1 Gbps", etc.
    const gbpsMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*gbps/);
    if (gbpsMatch) {
      return Math.round(parseFloat(gbpsMatch[1]) * 1000);
    }
    
    const mbpsMatch = valueStr.match(/(\d+(?:\.\d+)?)\s*mbps/);
    if (mbpsMatch) {
      return Math.round(parseFloat(mbpsMatch[1]));
    }
    
    // Si es solo un número, asumir Mbps
    const numero = parseFloat(valueStr);
    if (!isNaN(numero)) {
      return Math.round(numero);
    }
    
    return null;
  }

  /**
   * Normalizar campo entero
   */
  normalizeIntegerField(value, options = {}) {
    if (!value) return null;
    
    const numero = parseInt(value);
    if (isNaN(numero)) return null;
    
    if (options.min && numero < options.min) return options.min;
    if (options.max && numero > options.max) return options.max;
    
    return numero;
  }

  /**
   * Normalizar campo booleano
   */
  normalizeBooleanField(value) {
    if (value === null || value === undefined) return null;
    
    if (typeof value === 'boolean') return value;
    
    const valueStr = value.toString().toLowerCase().trim();
    const trueValues = ['true', 'sí', 'si', 'yes', 'y', '1', 'activo', 'enabled'];
    const falseValues = ['false', 'no', 'n', '0', 'inactivo', 'disabled'];
    
    if (trueValues.includes(valueStr)) return true;
    if (falseValues.includes(valueStr)) return false;
    
    return null;
  }
}

module.exports = FieldNormalizer;
