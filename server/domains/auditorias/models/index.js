/**
 * Índice de Modelos del Dominio Auditorías
 * Exporta todos los modelos del flujo de 8 etapas
 */

// Importar modelos principales
const Auditoria = require('./Auditoria.model');
const SeccionEvaluacion = require('./SeccionEvaluacion.model');
const VisitaPresencial = require('./VisitaPresencial.model');
const HallazgoVisita = require('./HallazgoVisita.model');
const InformeAuditoria = require('./InformeAuditoria.model');

// Importar modelos relacionados (si existen)
// const Documento = require('./Documento.model');
// const Sitio = require('./Sitio.model');
// const Proveedor = require('./Proveedor.model');

/**
 * Configurar asociaciones entre modelos
 * Siguiendo el flujo de 8 etapas documentado
 */
const configurarAsociaciones = () => {
  // === ASOCIACIONES PRINCIPALES ===
  
  // Una Auditoría tiene muchas Secciones de Evaluación
  Auditoria.hasMany(SeccionEvaluacion, {
    foreignKey: 'auditoria_id',
    as: 'secciones'
  });
  
  SeccionEvaluacion.belongsTo(Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });
  
  // Una Auditoría puede tener muchas Visitas Presenciales
  Auditoria.hasMany(VisitaPresencial, {
    foreignKey: 'auditoria_id',
    as: 'visitas'
  });
  
  VisitaPresencial.belongsTo(Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });
  
  // Una Visita Presencial tiene muchos Hallazgos
  VisitaPresencial.hasMany(HallazgoVisita, {
    foreignKey: 'visita_id',
    as: 'hallazgos'
  });
  
  HallazgoVisita.belongsTo(VisitaPresencial, {
    foreignKey: 'visita_id',
    as: 'visita'
  });
  
  // Una Auditoría tiene muchos Hallazgos (a través de las visitas)
  Auditoria.hasMany(HallazgoVisita, {
    foreignKey: 'auditoria_id',
    as: 'hallazgos'
  });
  
  HallazgoVisita.belongsTo(Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });
  
  // Una Auditoría tiene un Informe (relación 1:1)
  Auditoria.hasOne(InformeAuditoria, {
    foreignKey: 'auditoria_id',
    as: 'informe'
  });
  
  InformeAuditoria.belongsTo(Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });
  
  console.log('✅ Asociaciones de modelos de Auditorías configuradas');
};

/**
 * Sincronizar modelos con la base de datos
 */
const sincronizarModelos = async (options = {}) => {
  try {
    const modelos = [
      SeccionEvaluacion,
      VisitaPresencial, 
      HallazgoVisita,
      InformeAuditoria
    ];
    
    for (const modelo of modelos) {
      await modelo.sync(options);
      console.log(`✅ Modelo ${modelo.name} sincronizado`);
    }
    
    console.log('✅ Todos los modelos de Auditorías sincronizados');
  } catch (error) {
    console.error('❌ Error sincronizando modelos de Auditorías:', error);
    throw error;
  }
};

/**
 * Validar integridad de modelos
 */
const validarModelos = () => {
  const errores = [];
  
  try {
    // Verificar que todos los modelos estén definidos
    if (!SeccionEvaluacion) errores.push('SeccionEvaluacion no definido');
    if (!VisitaPresencial) errores.push('VisitaPresencial no definido');
    if (!HallazgoVisita) errores.push('HallazgoVisita no definido');
    if (!InformeAuditoria) errores.push('InformeAuditoria no definido');
    
    // Verificar asociaciones
    if (!SeccionEvaluacion.associations.auditoria) {
      errores.push('Asociación SeccionEvaluacion -> Auditoria faltante');
    }
    
    if (!VisitaPresencial.associations.hallazgos) {
      errores.push('Asociación VisitaPresencial -> HallazgoVisita faltante');
    }
    
    if (errores.length > 0) {
      console.error('❌ Errores de validación de modelos:', errores);
      return false;
    }
    
    console.log('✅ Validación de modelos de Auditorías exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error validando modelos:', error);
    return false;
  }
};

// Exportar modelos y funciones
module.exports = {
  // Modelos principales
  Auditoria,
  SeccionEvaluacion,
  VisitaPresencial,
  HallazgoVisita,
  InformeAuditoria,
  
  // Funciones de configuración
  configurarAsociaciones,
  sincronizarModelos,
  validarModelos,
  
  // Objetos agrupados para fácil acceso
  modelos: {
    Auditoria,
    SeccionEvaluacion,
    VisitaPresencial,
    HallazgoVisita,
    InformeAuditoria
  }
};
