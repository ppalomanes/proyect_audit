/**
 * Script de Inicio del Portal de Auditorías Técnicas
 * Incluye verificaciones pre-inicio y manejo de errores
 */

const path = require('path');
const fs = require('fs');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('\n🔍 Verificando prerequisitos...', colors.cyan);
  
  const checks = [];
  
  // 1. Verificar archivo .env
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    checks.push({ name: 'Archivo .env', status: '✅' });
  } else {
    checks.push({ name: 'Archivo .env', status: '❌', note: 'Copia .env.example a .env' });
  }
  
  // 2. Verificar node_modules
  const nodeModulesPath = path.join(__dirname, '../node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    checks.push({ name: 'Dependencies', status: '✅' });
  } else {
    checks.push({ name: 'Dependencies', status: '❌', note: 'Ejecuta npm install' });
  }
  
  // 3. Verificar versión de Node.js
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 16) {
    checks.push({ name: `Node.js ${nodeVersion}`, status: '✅' });
  } else {
    checks.push({ name: `Node.js ${nodeVersion}`, status: '⚠️', note: 'Recomendado: Node.js 16+' });
  }
  
  // 4. Verificar estructura de directorios
  const requiredDirs = [
    './domains/auth',
    './domains/auditorias', 
    './domains/etl',
    './domains/ia',
    './models',
    './config'
  ];
  
  let directoriesOk = true;
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      directoriesOk = false;
      break;
    }
  }
  
  checks.push({ 
    name: 'Estructura de directorios', 
    status: directoriesOk ? '✅' : '❌',
    note: directoriesOk ? '' : 'Estructura de proyecto incompleta'
  });
  
  // Mostrar resultados
  checks.forEach(check => {
    const note = check.note ? ` (${check.note})` : '';
    console.log(`  ${check.status} ${check.name}${note}`);
  });
  
  // Verificar si hay errores críticos
  const hasErrors = checks.some(check => check.status === '❌');
  if (hasErrors) {
    log('\n❌ Hay errores críticos. Resuelve los problemas antes de continuar.', colors.red);
    return false;
  }
  
  const hasWarnings = checks.some(check => check.status === '⚠️');
  if (hasWarnings) {
    log('\n⚠️ Hay advertencias. El servidor puede funcionar, pero revisa las recomendaciones.', colors.yellow);
  }
  
  return true;
}

function showWelcomeMessage() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('🏢  PORTAL DE AUDITORÍAS TÉCNICAS', colors.bright + colors.cyan);
  log('📊  Sistema de Autenticación JWT Implementado', colors.green);
  log('='.repeat(60), colors.cyan);
  
  log('\n📋 Funcionalidades implementadas:', colors.bright);
  log('  ✅ Sistema completo de autenticación JWT');
  log('  ✅ Roles: ADMIN, AUDITOR, SUPERVISOR, PROVEEDOR');
  log('  ✅ Middleware de autenticación y autorización');
  log('  ✅ Rate limiting y seguridad avanzada');
  log('  ✅ Validaciones y sanitización de datos');
  log('  ✅ Gestión de sesiones y permisos');
  log('  ✅ Recuperación de contraseñas');
  log('  ✅ Verificación de email');
  
  log('\n🔗 Endpoints principales:', colors.bright);
  log('  🔓 POST /api/auth/login           - Iniciar sesión');
  log('  📝 POST /api/auth/register        - Registrar usuario');
  log('  🔄 POST /api/auth/refresh         - Renovar token');
  log('  👤 GET  /api/auth/profile         - Obtener perfil');
  log('  🔑 GET  /api/auth/permissions     - Obtener permisos');
  log('  🚪 POST /api/auth/logout          - Cerrar sesión');
  
  log('\n👥 Usuarios de prueba:', colors.bright);
  log('  🔴 admin@portal-auditorias.com    (password: admin123)');
  log('  🔵 auditor@portal-auditorias.com  (password: auditor123)');
  log('  🟢 proveedor@callcenterdemo.com   (password: proveedor123)');
  
  log('\n🔧 Para probar el sistema:', colors.bright);
  log('  📊 Health check:    http://localhost:5000/health');
  log('  📋 API info:        http://localhost:5000/api/auth');
  log('  🧪 Test script:     node scripts/test-auth.js');
  
  log('\n' + '='.repeat(60), colors.cyan);
}

function showStartupInstructions() {
  log('\n📋 Instrucciones de inicio:', colors.bright);
  log('1. Asegúrate de que XAMPP esté corriendo (MySQL)');
  log('2. Verifica que la base de datos portal_auditorias_dev exista');
  log('3. El servidor se iniciará en puerto 5000');
  log('4. Los datos de prueba se crearán automáticamente\n');
}

async function startServer() {
  try {
    showWelcomeMessage();
    
    // Verificar prerequisitos
    if (!checkPrerequisites()) {
      process.exit(1);
    }
    
    showStartupInstructions();
    
    log('🚀 Iniciando servidor...', colors.green);
    
    // Importar y iniciar el servidor principal
    const { startServer } = require('./server');
    await startServer();
    
  } catch (error) {
    log('\n💥 Error fatal iniciando servidor:', colors.red);
    log(error.message, colors.red);
    
    if (error.message.includes('ECONNREFUSED')) {
      log('\n🔧 Posibles soluciones:', colors.yellow);
      log('  • Inicia XAMPP y asegúrate de que MySQL esté corriendo');
      log('  • Verifica la configuración de base de datos en .env');
      log('  • Comprueba que el puerto 3306 esté disponible');
    } else if (error.message.includes('EADDRINUSE')) {
      log('\n🔧 Posible solución:', colors.yellow);
      log('  • El puerto 5000 ya está en uso');
      log('  • Cambia el puerto en .env (PORT=5001) o detén el proceso que lo usa');
    } else if (error.message.includes('Cannot find module')) {
      log('\n🔧 Posible solución:', colors.yellow);
      log('  • Ejecuta: npm install');
      log('  • Verifica que todas las dependencias estén instaladas');
    }
    
    log('\n📊 Para más ayuda, revisa:', colors.cyan);
    log('  • TROUBLESHOOTING.md');
    log('  • Health check: http://localhost:5000/health');
    log('  • Logs del servidor en /logs/');
    
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGINT', () => {
  log('\n👋 Cerrando servidor...', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Cerrando servidor...', colors.yellow);
  process.exit(0);
});

// Iniciar si es llamado directamente
if (require.main === module) {
  startServer();
}

module.exports = { startServer, checkPrerequisites };
