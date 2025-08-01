// Teardown global para tests
const { closeConnection } = require('../config/database');

module.exports = async () => {
  console.log('🧹 Limpiando entorno de testing...');
  
  try {
    // Cerrar conexiones de base de datos
    await closeConnection();
    console.log('✅ Conexiones de testing cerradas');
    
  } catch (error) {
    console.error('⚠️  Error en teardown:', error.message);
  }
};
