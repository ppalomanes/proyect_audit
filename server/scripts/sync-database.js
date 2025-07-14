#!/usr/bin/env node

/**
 * Script de Sincronización de Base de Datos - Corregido
 * Crea la BD, tablas y datos iniciales necesarios
 */

// Cargar variables de entorno
require('dotenv').config();

const { initializeDatabase } = require('../config/database');
const { initializeRedis } = require('../config/redis');
const { initializeBullMQ } = require('../config/bullmq');
const { initializeOllama } = require('../config/ollama');

// Importar modelos corregidos
const {
  initializeModels,
  syncAllModels,
  createSeedData
} = require('../models');

class DatabaseSync {
  constructor() {
    this.sequelize = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔄 Iniciando sincronización de base de datos...');
      
      // 1. Inicializar conexiones (en orden)
      await this.initializeConnections();
      
      // 2. Inicializar y sincronizar modelos
      await this.syncModels();
      
      // 3. Crear datos iniciales
      await this.seedDatabase();
      
      console.log('✅ Sincronización de base de datos completada exitosamente');
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Error sincronizando base de datos:', error.message);
      throw error;
    }
  }

  async initializeConnections() {
    const connections = {
      database: false,
      redis: false,
      ollama: false,
      bullmq: false
    };

    try {
      // Base de datos (REQUERIDA)
      console.log('🚀 Inicializando conexiones del servidor...');
      console.log('📊 Conectando a MySQL...');
      
      this.sequelize = await initializeDatabase();
      connections.database = true;
      
    } catch (error) {
      console.error('❌ Error conectando a MySQL:', error.message);
      throw new Error('❌ No se pudo conectar a la base de datos');
    }

    try {
      // Redis (OPCIONAL)
      await initializeRedis();
      connections.redis = true;
    } catch (error) {
      console.log('⚠️ Redis no disponible - continuando sin cache');
    }

    try {
      // Ollama (OPCIONAL en sync)
      await initializeOllama();
      connections.ollama = true;
    } catch (error) {
      console.log('⚠️ Ollama no disponible - funcionalidades de IA limitadas');
    }

    try {
      // BullMQ (DEPENDE DE REDIS)
      await initializeBullMQ();
      connections.bullmq = true;
    } catch (error) {
      console.log('⚠️ BullMQ no disponible - procesamiento asíncrono deshabilitado');
    }

    // Resumen de conexiones
    const connectedServices = Object.entries(connections)
      .filter(([_, connected]) => connected).length;
    
    console.log(`\n✅ Conexiones inicializadas: ${connectedServices}/4`);
    console.log('📋 Estado de conexiones:');
    console.log(`  ${connections.database ? '✅' : '❌'} database: ${connections.database ? 'Conectado' : 'Desconectado'}`);
    console.log(`  ${connections.redis ? '✅' : '❌'} redis: ${connections.redis ? 'Conectado' : 'Desconectado'}`);
    console.log(`  ${connections.ollama ? '✅' : '❌'} ollama: ${connections.ollama ? 'Conectado' : 'Desconectado'}`);
    console.log(`  ${connections.bullmq ? '✅' : '❌'} bullmq: ${connections.bullmq ? 'Conectado' : 'Desconectado'}`);

    return connections;
  }

  async syncModels() {
    try {
      console.log('\n🔧 Inicializando y sincronizando modelos...');
      
      // Inicializar modelos con la nueva estructura
      await initializeModels();
      
      // Sincronizar con la base de datos
      await syncAllModels();
      
      console.log('✅ Modelos sincronizados correctamente');
      
    } catch (error) {
      console.error('❌ Error sincronizando modelos:', error.message);
      throw error;
    }
  }

  async seedDatabase() {
    try {
      console.log('\n🌱 Creando datos iniciales...');
      
      // Usar la función de seed data del index de modelos
      const created = await createSeedData();
      
      if (created) {
        console.log('✅ Datos iniciales creados exitosamente');
      } else {
        console.log('ℹ️ Datos iniciales ya existían');
      }
      
    } catch (error) {
      console.error('❌ Error creando datos iniciales:', error.message);
      // No lanzar error aquí para que la sincronización continue
      console.log('⚠️ Continuando sin datos de prueba...');
    }
  }

  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('🔐 Conexión a base de datos cerrada');
    }
  }
}

// Ejecutar si se llama directamente
async function main() {
  const dbSync = new DatabaseSync();
  
  try {
    await dbSync.initialize();
    console.log('\n🎉 Sincronización completada exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Error en sincronización:', error.message);
    process.exit(1);
    
  } finally {
    await dbSync.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseSync };
