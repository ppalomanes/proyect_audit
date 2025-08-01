// Setup global para tests con XAMPP MySQL
const { testConnection, syncDatabase } = require('../config/database');

module.exports = async () => {
  console.log('🧪 Configurando entorno de testing...');
  
  try {
    // Configurar variable de entorno para testing
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'portal_auditorias_test';
    
    // Verificar conexión a base de datos de testing
    await testConnection();
    console.log('✅ Conexión a BD de testing establecida');
    
    // Sincronizar modelos (crear tablas)
    await syncDatabase({ force: true, logging: false });
    console.log('✅ Tablas de testing sincronizadas');
    
  } catch (error) {
    console.error('❌ Error configurando testing:', error.message);
    console.error('Asegúrate de que MySQL XAMPP esté ejecutándose');
    process.exit(1);
  }
};
