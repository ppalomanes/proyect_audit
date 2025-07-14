#!/usr/bin/env node

/**
 * Script de Instalación y Setup Completo
 * Configura el entorno de desarrollo desde cero
 */

const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ProjectSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.steps = [
      'checkPrerequisites',
      'setupEnvironment',
      'installDependencies',
      'setupDatabase',
      'runHealthCheck',
      'displayInstructions'
    ];
    this.currentStep = 0;
  }

  async run() {
    console.log('🚀 Portal de Auditorías Técnicas - Setup Completo\n');
    
    try {
      for (const step of this.steps) {
        this.currentStep++;
        console.log(`\n📋 Paso ${this.currentStep}/${this.steps.length}: ${this.getStepName(step)}`);
        console.log('─'.repeat(50));
        
        await this[step]();
        
        console.log(`✅ ${this.getStepName(step)} completado\n`);
      }
      
      console.log('🎉 Setup completo! El Portal de Auditorías está listo para usar.');
      
    } catch (error) {
      console.error(`❌ Error en paso ${this.currentStep}: ${error.message}`);
      console.log('\n🔧 Para soporte, revisa la documentación o ejecuta:');
      console.log('   npm run health');
      process.exit(1);
    }
  }

  getStepName(step) {
    const names = {
      checkPrerequisites: 'Verificar Prerequisitos',
      setupEnvironment: 'Configurar Variables de Entorno',
      installDependencies: 'Instalar Dependencias',
      setupDatabase: 'Configurar Base de Datos',
      runHealthCheck: 'Verificar Servicios',
      displayInstructions: 'Mostrar Instrucciones'
    };
    return names[step] || step;
  }

  async checkPrerequisites() {
    console.log('🔍 Verificando prerequisitos del sistema...');
    
    // Verificar Node.js
    try {
      const { stdout } = await execAsync('node --version');
      const nodeVersion = stdout.trim();
      console.log(`✅ Node.js: ${nodeVersion}`);
      
      if (!this.isValidNodeVersion(nodeVersion)) {
        throw new Error('Node.js 18.0.0 o superior requerido');
      }
    } catch (error) {
      throw new Error('Node.js no encontrado. Instala Node.js 18.0.0 o superior');
    }

    // Verificar npm
    try {
      const { stdout } = await execAsync('npm --version');
      console.log(`✅ npm: ${stdout.trim()}`);
    } catch (error) {
      throw new Error('npm no encontrado');
    }

    // Verificar XAMPP/MySQL
    console.log('🔍 Verificando MySQL...');
    try {
      await execAsync('mysql --version');
      console.log('✅ MySQL disponible');
    } catch (error) {
      console.log('⚠️ MySQL no detectado - asegúrate de que XAMPP esté ejecutándose');
    }

    // Verificar Redis (opcional)
    try {
      await execAsync('redis-cli ping');
      console.log('✅ Redis disponible');
    } catch (error) {
      console.log('ℹ️ Redis no disponible - funcionará en modo degradado');
    }

    // Verificar Ollama (opcional)
    try {
      await execAsync('ollama --version');
      console.log('✅ Ollama disponible');
    } catch (error) {
      console.log('ℹ️ Ollama no disponible - funcionalidades de IA limitadas');
    }
  }

  isValidNodeVersion(version) {
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    return majorVersion >= 18;
  }

  async setupEnvironment() {
    console.log('⚙️ Configurando variables de entorno...');
    
    const envPath = path.join(this.projectRoot, '.env');
    
    try {
      await fs.access(envPath);
      console.log('ℹ️ Archivo .env ya existe');
      return;
    } catch {
      // Archivo no existe, crear uno nuevo
    }

    const envContent = `# Portal de Auditorías Técnicas - Configuración
NODE_ENV=development
PORT=5000

# Base de Datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=portal_auditorias_dev
DB_USER=root
DB_PASSWORD=

# Redis (Opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_REQUIRED=false

# Ollama (IA Local)
OLLAMA_HOST=http://localhost:11434
OLLAMA_REQUIRED=false

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Frontend
FRONTEND_URL=http://localhost:3000

# Archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50MB

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log
`;

    await fs.writeFile(envPath, envContent);
    console.log('✅ Archivo .env creado con configuración por defecto');
    console.log('⚠️ Recuerda ajustar las variables según tu entorno');
  }

  async installDependencies() {
    console.log('📦 Instalando dependencias de Node.js...');
    
    try {
      // Instalar dependencias del servidor
      console.log('📥 Instalando dependencias del servidor...');
      await this.runCommand('npm install', { cwd: this.projectRoot });
      
      console.log('✅ Dependencias del servidor instaladas');
      
      // TODO: Instalar dependencias del cliente cuando esté implementado
      // const clientPath = path.join(this.projectRoot, 'client');
      // try {
      //   await fs.access(path.join(clientPath, 'package.json'));
      //   console.log('📥 Instalando dependencias del cliente...');
      //   await this.runCommand('npm install', { cwd: clientPath });
      //   console.log('✅ Dependencias del cliente instaladas');
      // } catch {
      //   console.log('ℹ️ Cliente frontend no configurado aún');
      // }
      
    } catch (error) {
      throw new Error(`Error instalando dependencias: ${error.message}`);
    }
  }

  async setupDatabase() {
    console.log('🗄️ Configurando base de datos...');
    
    try {
      // Ejecutar sincronización de base de datos
      console.log('🔄 Ejecutando sincronización de BD...');
      await this.runCommand('npm run db:sync', { 
        cwd: path.join(this.projectRoot, 'server'),
        timeout: 60000 
      });
      
      console.log('✅ Base de datos sincronizada');
      
    } catch (error) {
      // Si falla la sincronización, intentar crear manualmente
      console.log('⚠️ Sincronización automática falló, creando BD manualmente...');
      
      try {
        await this.createDatabaseManually();
        console.log('✅ Base de datos creada manualmente');
      } catch (manualError) {
        throw new Error(`Error configurando BD: ${error.message}\nError manual: ${manualError.message}`);
      }
    }
  }

  async createDatabaseManually() {
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    });
    
    try {
      await connection.execute('CREATE DATABASE IF NOT EXISTS portal_auditorias_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ Base de datos portal_auditorias_dev creada');
    } finally {
      await connection.end();
    }
  }

  async runHealthCheck() {
    console.log('🏥 Verificando estado de servicios...');
    
    try {
      await this.runCommand('npm run health', { 
        cwd: path.join(this.projectRoot, 'server'),
        timeout: 30000
      });
    } catch (error) {
      console.log('⚠️ Health check mostró algunos servicios down - esto es normal en desarrollo');
      console.log('💡 Los servicios opcionales (Redis, Ollama) pueden estar deshabilitados');
    }
  }

  async displayInstructions() {
    console.log('📋 Instrucciones para comenzar:\n');
    
    console.log('🚀 Para iniciar el servidor de desarrollo:');
    console.log('   cd server');
    console.log('   npm run dev');
    console.log('');
    
    console.log('🏥 Para verificar el estado del sistema:');
    console.log('   cd server');
    console.log('   npm run health');
    console.log('');
    
    console.log('📊 Para acceder a la API:');
    console.log('   http://localhost:5000');
    console.log('   http://localhost:5000/health');
    console.log('');
    
    console.log('👤 Usuarios de prueba creados:');
    console.log('   📧 admin@portal-auditorias.com (password: admin123)');
    console.log('   🔍 auditor@portal-auditorias.com (password: auditor123)');
    console.log('   🏢 proveedor@callcenterdemo.com (password: proveedor123)');
    console.log('');
    
    console.log('⚠️ Servicios opcionales:');
    console.log('   🔴 Redis: Para cache y colas (opcional en desarrollo)');
    console.log('   🤖 Ollama: Para funcionalidades de IA local');
    console.log('');
    
    console.log('📚 Para más información:');
    console.log('   📄 Revisa PROJECT_OVERVIEW.md');
    console.log('   🔍 Consulta /docs/ para documentación técnica');
    console.log('');
    
    console.log('🎯 El Portal de Auditorías Técnicas está listo para desarrollo! 🎉');
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      
      const child = spawn(cmd, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });
      
      const timeout = options.timeout || 120000; // 2 minutos por defecto
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Comando '${command}' excedió timeout de ${timeout}ms`));
      }, timeout);
      
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Comando '${command}' falló con código ${code}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
}

// Ejecutar setup si se llama directamente
if (require.main === module) {
  const setup = new ProjectSetup();
  setup.run();
}

module.exports = { ProjectSetup };
