#!/usr/bin/env node

/**
 * Script de Diagnóstico y Startup - Chat Real
 * Portal de Auditorías Técnicas
 * 
 * Este script diagnostica y corrige problemas comunes del Chat Real
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ChatRealDiagnostics {
  constructor() {
    // Detectar directorio correcto basándose en la estructura del proyecto
    const currentDir = process.cwd();
    
    // Si estamos en /server, ir un nivel arriba
    if (currentDir.endsWith('server')) {
      this.projectRoot = path.dirname(currentDir);
      this.serverPath = currentDir;
    } else {
      // Si estamos en la raíz del proyecto
      this.projectRoot = currentDir;
      this.serverPath = path.join(currentDir, 'server');
    }
    
    this.issues = [];
    this.fixes = [];
    
    console.log(`📍 Directorio del proyecto: ${this.projectRoot}`);
    console.log(`📍 Directorio del servidor: ${this.serverPath}`);
  }

  async diagnose() {
    console.log('🔍 ===== DIAGNÓSTICO CHAT REAL =====');
    console.log('🎯 Portal de Auditorías Técnicas\n');

    await this.checkEnvironment();
    await this.checkDependencies();
    await this.checkDatabase();
    await this.checkServerFiles();
    await this.checkPorts();

    this.showResults();
    
    if (this.issues.length === 0) {
      console.log('\n🚀 ¡Todo correcto! Iniciando servidor...\n');
      await this.startServer();
    } else {
      console.log('\n🛠️ Aplicando correcciones...\n');
      await this.applyFixes();
    }
  }

  async checkEnvironment() {
    console.log('📋 Verificando archivo .env...');
    
    const envPath = path.join(this.projectRoot, '.env');
    
    if (!fs.existsSync(envPath)) {
      this.issues.push('❌ Archivo .env no encontrado');
      this.fixes.push(() => this.createEnvFile());
    } else {
      console.log('✅ Archivo .env existe');
      
      // Verificar variables críticas
      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredVars = ['PORT', 'JWT_SECRET', 'DB_NAME'];
      
      for (const varName of requiredVars) {
        if (!envContent.includes(varName)) {
          this.issues.push(`❌ Variable ${varName} faltante en .env`);
        }
      }
    }
  }

  async checkDependencies() {
    console.log('📦 Verificando dependencias de Node.js...');
    
    const packageJsonPath = path.join(this.serverPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.issues.push('❌ package.json no encontrado en /server');
      this.fixes.push(() => this.initializeNodeProject());
      return;
    }

    // Verificar si node_modules existe
    const nodeModulesPath = path.join(this.serverPath, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      this.issues.push('❌ Dependencias no instaladas');
      this.fixes.push(() => this.installDependencies());
    } else {
      console.log('✅ Dependencias instaladas');
    }
  }

  async checkDatabase() {
    console.log('🗄️ Verificando conexión a MySQL...');
    
    try {
      // Intentar conectar a MySQL usando configuración por defecto
      const mysql = require('mysql2/promise');
      
      const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'portal_auditorias'
      });
      
      await connection.execute('SELECT 1');
      await connection.end();
      
      console.log('✅ Conexión a MySQL exitosa');
      
    } catch (error) {
      this.issues.push(`❌ Error de conexión MySQL: ${error.message}`);
      this.fixes.push(() => this.showDatabaseInstructions());
    }
  }

  async checkServerFiles() {
    console.log('📁 Verificando archivos del servidor...');
    
    const criticalFiles = [
      'server-chat-real.js',
      'domains/chat/chat-real.service.js',
      'domains/chat/chat-real.controller.js',
      'domains/chat/chat-real.routes.js',
      'domains/chat/websockets/chat-real-handler.js'
    ];
    
    for (const file of criticalFiles) {
      const filePath = path.join(this.serverPath, file);
      
      if (!fs.existsSync(filePath)) {
        this.issues.push(`❌ Archivo crítico faltante: ${file}`);
      } else {
        console.log(`✅ ${file} existe`);
      }
    }
  }

  async checkPorts() {
    console.log('🔌 Verificando puertos...');
    
    try {
      // Verificar si el puerto 5000 está disponible
      const netstat = await execAsync('netstat -an | findstr :5000');
      
      if (netstat.stdout.includes('LISTENING')) {
        console.log('⚠️ Puerto 5000 ya está en uso');
        this.fixes.push(() => this.showPortInstructions());
      } else {
        console.log('✅ Puerto 5000 disponible');
      }
      
    } catch (error) {
      // Si no hay salida, el puerto está libre
      console.log('✅ Puerto 5000 disponible');
    }
  }

  showResults() {
    console.log('\n📊 ===== RESULTADOS DEL DIAGNÓSTICO =====');
    
    if (this.issues.length === 0) {
      console.log('🎉 ¡Perfecto! No se encontraron problemas.');
      console.log('✅ Chat Real listo para ejecutarse');
    } else {
      console.log(`⚠️ Se encontraron ${this.issues.length} problema(s):`);
      this.issues.forEach(issue => console.log(`   ${issue}`));
      console.log('\n🔧 Se aplicarán correcciones automáticamente...');
    }
  }

  async applyFixes() {
    console.log('🔧 Aplicando correcciones automáticas...\n');
    
    for (let i = 0; i < this.fixes.length; i++) {
      console.log(`🛠️ Aplicando corrección ${i + 1}/${this.fixes.length}...`);
      await this.fixes[i]();
    }
    
    console.log('\n✅ Correcciones aplicadas. Reiniciando diagnóstico...\n');
    
    // Reiniciar diagnóstico para verificar correcciones
    this.issues = [];
    this.fixes = [];
    
    await this.checkEnvironment();
    await this.checkDependencies();
    
    if (this.issues.length === 0) {
      console.log('\n🚀 ¡Problemas corregidos! Iniciando servidor...\n');
      await this.startServer();
    } else {
      console.log('\n⚠️ Algunos problemas requieren intervención manual.');
      this.showManualInstructions();
    }
  }

  async createEnvFile() {
    console.log('📝 Creando archivo .env...');
    
    const envContent = `# Configuración del Portal de Auditorías Técnicas
# Chat Real con persistencia MySQL

# === SERVIDOR ===
PORT=5000
NODE_ENV=development

# === BASE DE DATOS MYSQL ===
DB_HOST=localhost
DB_PORT=3306
DB_NAME=portal_auditorias
DB_USERNAME=root
DB_PASSWORD=

# === AUTENTICACIÓN JWT ===
JWT_SECRET=portal_auditorias_super_secret_key_2025
JWT_EXPIRES_IN=24h

# === WEBSOCKET CORS ===
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# === CONFIGURACIÓN CHAT ===
CHAT_MAX_MESSAGE_LENGTH=2000
CHAT_MAX_FILE_SIZE=10485760
CHAT_MAX_FILES_PER_MESSAGE=5
CHAT_PAGINATION_LIMIT=50
`;
    
    fs.writeFileSync(path.join(this.projectRoot, '.env'), envContent);
    console.log('✅ Archivo .env creado');
  }

  async initializeNodeProject() {
    console.log('📦 Inicializando proyecto Node.js...');
    
    const packageJson = {
      name: "portal-auditorias-server",
      version: "1.0.0",
      description: "Backend del Portal de Auditorías Técnicas con Chat Real",
      main: "server-chat-real.js",
      scripts: {
        start: "node server-chat-real.js",
        dev: "nodemon server-chat-real.js",
        chat: "node server-chat-real.js",
        diagnose: "node ../scripts/diagnose-chat.js"
      },
      dependencies: {
        "express": "^4.18.2",
        "socket.io": "^4.7.4",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "jsonwebtoken": "^9.0.2",
        "mysql2": "^3.6.5",
        "sequelize": "^6.35.2",
        "multer": "^1.4.5-lts.1",
        "express-validator": "^7.0.1",
        "bcryptjs": "^2.4.3"
      },
      devDependencies: {
        "nodemon": "^3.0.2"
      }
    };
    
    const packageJsonPath = path.join(this.serverPath, 'package.json');
    fs.writeFileSync(
      packageJsonPath, 
      JSON.stringify(packageJson, null, 2)
    );
    
    console.log('✅ package.json creado');
  }

  async installDependencies() {
    console.log('⬇️ Instalando dependencias...');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: this.serverPath,
        stdio: 'inherit',
        shell: true
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Dependencias instaladas correctamente');
          resolve();
        } else {
          reject(new Error(`npm install falló con código ${code}`));
        }
      });
    });
  }

  showDatabaseInstructions() {
    console.log('\n🗄️ ===== INSTRUCCIONES MYSQL =====');
    console.log('Para que el Chat Real funcione, necesitas:');
    console.log('1. ✅ XAMPP con MySQL ejecutándose');
    console.log('2. ✅ Base de datos "portal_auditorias" creada');
    console.log('3. ✅ Tablas del chat creadas con las migraciones');
    console.log('\n📋 Comandos a ejecutar:');
    console.log('   cd C:\\xampp\\htdocs\\portal-auditorias\\database');
    console.log('   mysql -u root -p < 20250123_create_chat_real_tables.sql');
    console.log('\n🔗 O usar phpMyAdmin: http://localhost/phpmyadmin');
  }

  showPortInstructions() {
    console.log('\n🔌 ===== PUERTO 5000 OCUPADO =====');
    console.log('El puerto 5000 está siendo usado por otro proceso.');
    console.log('\n📋 Opciones:');
    console.log('1. Cerrar el proceso que usa el puerto 5000');
    console.log('2. Cambiar el puerto en .env (PORT=5001)');
    console.log('3. Usar: netstat -ano | findstr :5000');
    console.log('   Luego: taskkill /PID [número] /F');
  }

  showManualInstructions() {
    console.log('\n📋 ===== INSTRUCCIONES MANUALES =====');
    console.log('Por favor completa estas acciones:');
    console.log('1. ✅ Asegúrate de que XAMPP esté ejecutándose');
    console.log('2. ✅ Crea la base de datos "portal_auditorias"');
    console.log('3. ✅ Ejecuta las migraciones del chat');
    console.log('4. ✅ Instala dependencias: npm install');
    console.log('\n🚀 Luego ejecuta: npm run chat');
  }

  async startServer() {
    console.log('🚀 ===== INICIANDO SERVIDOR CHAT REAL =====');
    console.log('📡 Puerto: 5000');
    console.log('🔌 WebSocket: /chat');
    console.log('🗄️ Base de datos: MySQL');
    console.log('🔐 Autenticación: JWT');
    console.log('===============================================\n');
    
    // Cambiar al directorio del servidor
    process.chdir(this.serverPath);
    
    // Ejecutar servidor
    const server = spawn('node', ['server-chat-real.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    server.on('close', (code) => {
      console.log(`\n🔄 Servidor cerrado con código: ${code}`);
    });
    
    server.on('error', (error) => {
      console.error(`❌ Error ejecutando servidor: ${error.message}`);
    });
    
    // Manejo graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🔄 Cerrando servidor...');
      server.kill('SIGINT');
      process.exit(0);
    });
  }
}

// Ejecutar diagnóstico si se llama directamente
if (require.main === module) {
  const diagnostics = new ChatRealDiagnostics();
  diagnostics.diagnose().catch(error => {
    console.error('💥 Error fatal en diagnóstico:', error);
    process.exit(1);
  });
}

module.exports = ChatRealDiagnostics;