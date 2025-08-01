/**
 * Configuración de modelos ETL y sus relaciones
 * Portal de Auditorías Técnicas
 */

const defineParqueInformatico = require('./ParqueInformatico.model');
const defineETLJob = require('./ETLJob.model');
const defineETLError = require('./ETLError.model');
const defineValidationRule = require('./ValidationRule.model');

const configurarModelosETL = (sequelize) => {
  // Definir modelos
  const ParqueInformatico = defineParqueInformatico(sequelize);
  const ETLJob = defineETLJob(sequelize);
  const ETLError = defineETLError(sequelize);
  const ValidationRule = defineValidationRule(sequelize);

  // === RELACIONES ===

  // ETLJob -> ParqueInformatico (1:N)
  ETLJob.hasMany(ParqueInformatico, {
    foreignKey: 'job_id',
    as: 'parque_registros', // Cambiado de 'registros_procesados' para evitar conflicto
    onDelete: 'CASCADE'
  });

  ParqueInformatico.belongsTo(ETLJob, {
    foreignKey: 'job_id',
    as: 'job_etl',
    allowNull: true
  });

  // ETLJob -> ETLError (1:N)
  ETLJob.hasMany(ETLError, {
    foreignKey: 'job_id',
    as: 'errores',
    onDelete: 'CASCADE'
  });

  ETLError.belongsTo(ETLJob, {
    foreignKey: 'job_id',
    as: 'job'
  });

  // ParqueInformatico -> ETLError (1:N)
  ParqueInformatico.hasMany(ETLError, {
    foreignKey: 'parque_informatico_id',
    as: 'errores_registro',
    onDelete: 'CASCADE'
  });

  ETLError.belongsTo(ParqueInformatico, {
    foreignKey: 'parque_informatico_id',
    as: 'registro_parque',
    allowNull: true
  });

  // Relaciones con módulos externos (se configurarán en el index principal)
  // - Auditoria -> ETLJob (1:N)
  // - Auditoria -> ParqueInformatico (1:N)
  // - Usuario -> ETLJob (creado_por)
  // - Documento -> ETLJob (archivo_origen)

  return {
    ParqueInformatico,
    ETLJob,
    ETLError,
    ValidationRule
  };
};

module.exports = configurarModelosETL;