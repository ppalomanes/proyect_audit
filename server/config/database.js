/**
 * Configuración de Base de Datos MySQL para Portal de Auditorías Técnicas
 * Implementa conexión robusta con Sequelize, pool de conexiones optimizado
 * y configuración específica para entorno de desarrollo y producción
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Variables de entorno con valores por defecto para desarrollo
const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_NAME = 'portal_auditorias',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_DIALECT = 'mysql',
  NODE_ENV = 'development'
} = process.env;

// Configuración base de la conexión
const config = {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: NODE_ENV === 'development' ? console.log : false,
  
  // Pool de conexiones optimizado para call center (alta concurrencia)
  pool: {
    max: NODE_ENV === 'production' ? 20 : 10, // Máximo de conexiones simultáneas
    min: 2,                                    // Mínimo de conexiones mantenidas
    acquire: 30000,                           // Tiempo máximo para obtener conexión
    idle: 10000,                              // Tiempo antes de liberar conexión inactiva
    evict: 15000                              // Tiempo para validar conexiones idle
  },
  
  // Configuración de timezone y charset para datos internacionales
  timezone: '-05:00', // Timezone Colombia (call centers)
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    useUTC: false,
    dateStrings: true,
    typeCast: true
  },
  
  // Configuración de performance y retry
  retry: {
    max: 3,
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /TIMEOUT/,
      /DatabaseError/
    ]
  },
  
  // Configuraciones específicas por entorno
  benchmark: NODE_ENV === 'development',
  define: {
    timestamps: true,           // Agregar createdAt y updatedAt automáticamente
    underscored: true,         // Usar snake_case para nombres de columnas
    freezeTableName: true,     // Evitar pluralización automática de tablas
    paranoid: true,            // Soft delete con deletedAt
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
};

// Instancia de Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, config);

/**
 * Función para probar la conexión a la base de datos
 * Incluye validación de esquema y configuración inicial
 */
const testConnection = async () => {
  try {
    console.log('🔗 Intentando conectar a MySQL...');
    
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida exitosamente');
    
    // Verificar configuraciones de charset
    const [results] = await sequelize.query('SELECT @@character_set_database, @@collation_database');
    console.log('📊 Configuración BD:', results[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    
    // Sugerencias de troubleshooting
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Sugerencia: Verificar que MySQL esté ejecutándose en XAMPP');
    }
    if (error.message.includes('Access denied')) {
      console.log('💡 Sugerencia: Verificar credenciales de BD en variables de entorno');
    }
    if (error.message.includes('Unknown database')) {
      console.log('💡 Sugerencia: Crear la base de datos "portal_auditorias" en phpMyAdmin');
    }
    
    throw error;
  }
};

/**
 * Función para sincronizar modelos con base de datos
 * Ejecuta migraciones necesarias según el entorno
 */
const syncDatabase = async (options = {}) => {
  try {
    const {
      force = false,           // Recrear tablas (usar solo en desarrollo)
      alter = false,           // Modificar tablas existentes
      logging = true
    } = options;
    
    console.log('🔄 Sincronizando modelos con base de datos...');
    
    await sequelize.sync({ 
      force, 
      alter, 
      logging: logging ? console.log : false 
    });
    
    console.log('✅ Sincronización de modelos completada');
    
    // Log de tablas creadas/modificadas
    if (logging) {
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log('📋 Tablas en BD:', tables.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error sincronizando base de datos:', error.message);
    throw error;
  }
};

/**
 * Función para cerrar conexión a la base de datos
 * Útil para tests y shutdown graceful
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('🔒 Conexión a MySQL cerrada correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexión MySQL:', error.message);
  }
};

/**
 * Configuración específica para testing
 * Base de datos en memoria para tests unitarios
 */
const testConfig = {
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  sync: { force: true }
};

// Instancia de Sequelize para testing
const testSequelize = NODE_ENV === 'test' 
  ? new Sequelize(testConfig)
  : null;

module.exports = {
  sequelize,
  testSequelize,
  testConnection,
  syncDatabase,
  closeConnection,
  
  // Configuraciones exportadas para uso en otros módulos
  config: {
    database: DB_NAME,
    username: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    ...config
  }
};
