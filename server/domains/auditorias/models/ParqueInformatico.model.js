  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'parque_informatico',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['auditoria_id']
    },
    {
      fields: ['atencion', 'cumple_general']
    },
    {
      fields: ['sitio', 'proveedor']
    },
    {
      fields: ['cumple_general', 'score_cumplimiento']
    }
  ]
});

// Métodos de instancia
ParqueInformatico.prototype.validarRequisitos = function(umbrales = null) {
  const config = umbrales || ParqueInformatico.getUmbralesDefault();
  
  // Validar CPU
  this.cumple_cpu = this.validarCPU(config);
  
  // Validar RAM
  this.cumple_ram = this.ram_gb >= config.ram_minima_gb;
  
  // Validar Disco
  this.cumple_disco = this.disco_capacidad_gb >= config.disco_minimo_gb && 
                      this.disco_tipo === config.disco_tipo_requerido;
  
  // Validar Sistema Operativo
  this.cumple_so = this.sistema_operativo.includes(config.os_requerido);
  
  // Validar Conectividad (solo para HO)
  if (this.atencion === 'HO') {
    this.cumple_conectividad = this.velocidad_down_mbps >= config.velocidad_down_ho_mbps &&
                               this.velocidad_up_mbps >= config.velocidad_up_ho_mbps;
  } else {
    this.cumple_conectividad = true; // No aplica para OS
  }
  
  // Cumplimiento general
  this.cumple_general = this.cumple_cpu && this.cumple_ram && this.cumple_disco && 
                        this.cumple_so && this.cumple_conectividad;
  
  // Calcular score
  this.calcularScore();
  
  // Generar incumplimientos
  this.generarIncumplimientos(config);
  
  return this.cumple_general;
};

ParqueInformatico.prototype.validarCPU = function(config) {
  if (this.procesador_marca === 'Intel') {
    // Intel Core i5 o superior
    if (this.procesador_modelo.toLowerCase().includes('core i3')) return false;
    if (this.procesador_modelo.toLowerCase().includes('core i5') || 
        this.procesador_modelo.toLowerCase().includes('core i7') ||
        this.procesador_modelo.toLowerCase().includes('core i9')) {
      return this.procesador_velocidad_ghz >= config.cpu_velocidad_minima;
    }
    return false;
  } else if (this.procesador_marca === 'AMD') {
    // AMD Ryzen 5 o superior
    if (this.procesador_modelo.toLowerCase().includes('ryzen 3')) return false;
    if (this.procesador_modelo.toLowerCase().includes('ryzen 5') || 
        this.procesador_modelo.toLowerCase().includes('ryzen 7') ||
        this.procesador_modelo.toLowerCase().includes('ryzen 9')) {
      return this.procesador_velocidad_ghz >= config.cpu_velocidad_minima;
    }
    return false;
  }
  return false;
};

ParqueInformatico.prototype.calcularScore = function() {
  let score = 0;
  const criterios = ['cumple_cpu', 'cumple_ram', 'cumple_disco', 'cumple_so'];
  
  if (this.atencion === 'HO') {
    criterios.push('cumple_conectividad');
  }
  
  const cumplidos = criterios.filter(criterio => this[criterio]).length;
  score = (cumplidos / criterios.length) * 100;
  
  this.score_cumplimiento = Math.round(score * 100) / 100;
  return this.score_cumplimiento;
};

ParqueInformatico.prototype.generarIncumplimientos = function(config) {
  const incumplimientos = [];
  
  if (!this.cumple_cpu) {
    incumplimientos.push({
      campo: 'procesador',
      valor_actual: `${this.procesador_marca} ${this.procesador_modelo} ${this.procesador_velocidad_ghz}GHz`,
      requisito: `${this.procesador_marca === 'Intel' ? 'Intel Core i5' : 'AMD Ryzen 5'} ${config.cpu_velocidad_minima}GHz o superior`,
      criticidad: 'ALTA'
    });
  }
  
  if (!this.cumple_ram) {
    incumplimientos.push({
      campo: 'ram',
      valor_actual: `${this.ram_gb}GB`,
      requisito: `${config.ram_minima_gb}GB o superior`,
      criticidad: 'ALTA'
    });
  }
  
  if (!this.cumple_disco) {
    incumplimientos.push({
      campo: 'disco',
      valor_actual: `${this.disco_capacidad_gb}GB ${this.disco_tipo}`,
      requisito: `${config.disco_minimo_gb}GB ${config.disco_tipo_requerido} o superior`,
      criticidad: 'MEDIA'
    });
  }
  
  if (!this.cumple_so) {
    incumplimientos.push({
      campo: 'sistema_operativo',
      valor_actual: this.sistema_operativo,
      requisito: config.os_requerido,
      criticidad: 'ALTA'
    });
  }
  
  if (this.atencion === 'HO' && !this.cumple_conectividad) {
    incumplimientos.push({
      campo: 'conectividad',
      valor_actual: `${this.velocidad_down_mbps}/${this.velocidad_up_mbps} Mbps`,
      requisito: `${config.velocidad_down_ho_mbps}/${config.velocidad_up_ho_mbps} Mbps mínimo para HO`,
      criticidad: 'ALTA'
    });
  }
  
  this.incumplimientos_detectados = incumplimientos;
  
  // Generar observaciones automáticas
  if (incumplimientos.length > 0) {
    this.observaciones_automaticas = incumplimientos.map(inc => 
      `${inc.campo.toUpperCase()}: ${inc.valor_actual} no cumple requisito ${inc.requisito}`
    ).join('; ');
  } else {
    this.observaciones_automaticas = 'Equipo cumple todos los requisitos técnicos';
  }
};

// Métodos estáticos
ParqueInformatico.getUmbralesDefault = function() {
  return {
    cpu_intel_minimo: 'Core i5',
    cpu_amd_minimo: 'Ryzen 5',
    cpu_velocidad_minima: 3.0,
    ram_minima_gb: 16,
    disco_minimo_gb: 500,
    disco_tipo_requerido: 'SSD',
    os_requerido: 'Windows 11',
    velocidad_down_ho_mbps: 15,
    velocidad_up_ho_mbps: 6
  };
};

ParqueInformatico.generarResumenValidacion = async function(auditoriaId) {
  const equipos = await ParqueInformatico.findAll({
    where: { auditoria_id: auditoriaId }
  });
  
  const resumen = {
    total_equipos: equipos.length,
    equipos_os: equipos.filter(e => e.atencion === 'OS').length,
    equipos_ho: equipos.filter(e => e.atencion === 'HO').length,
    equipos_cumplen: equipos.filter(e => e.cumple_general).length,
    equipos_no_cumplen: equipos.filter(e => !e.cumple_general).length,
    score_promedio: equipos.length > 0 ? 
      Math.round(equipos.reduce((sum, e) => sum + (e.score_cumplimiento || 0), 0) / equipos.length * 100) / 100 : 0,
    incumplimientos_por_categoria: {}
  };
  
  // Análisis de incumplimientos por categoría
  const categorias = ['cpu', 'ram', 'disco', 'so', 'conectividad'];
  categorias.forEach(cat => {
    resumen.incumplimientos_por_categoria[cat] = equipos.filter(e => !e[`cumple_${cat}`]).length;
  });
  
  return resumen;
};

module.exports = ParqueInformatico;