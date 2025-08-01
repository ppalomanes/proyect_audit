/**
 * Configuración Simplificada para Testing
 * Portal de Auditorías Técnicas
 */

// Mock functions para evitar errores de conexión durante testing

const testConnection = async () => {
  console.log('✅ Database connection (mocked)');
  return true;
};

const syncDatabase = async (options = {}) => {
  console.log('✅ Database sync (mocked)');
  return true;
};

const closeConnection = async () => {
  console.log('✅ Database closed (mocked)');
  return true;
};

const initializeDatabase = async () => {
  console.log('✅ Database initialized (mocked)');
  return {
    query: () => Promise.resolve([]),
    close: () => Promise.resolve()
  };
};

module.exports = {
  testConnection,
  syncDatabase,
  closeConnection,
  initializeDatabase
};
