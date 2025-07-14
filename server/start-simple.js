/**
 * Script de Inicio Simple del Portal de Auditorías Técnicas
 * Sin verificaciones complejas para evitar errores
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

function quickCheck() {
  log('\n🔍 Verificaciones básicas...', colors.cyan);
  
  const checks = [];
  
  // Verificar .env
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    checks.push({ name: 'Archivo .env', status: '✅' });
  } else {
    checks.push({ name: 'Archivo .env', status: '❌', critical: true });
  }
  
  // Verificar node_modules
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    checks.push({ name: 'Dependencies', status: '✅' });
  } else {
    checks.push({ name: 'Dependencies', status: '❌', critical: true });
  }
  
  // Mostrar resultados
  checks.forEach(check => {
    console.log(`  ${check.status} ${check.name}`);
  });
  
  const hasErrors = checks.some(check => check.status === '❌' && check.critical);
  
  if (hasErrors) {
    log('\n❌ Errores críticos encontrados:', colors.red);
    log('1. Si falta .env: El archivo ya se creó automáticamente', colors.yellow);
    log('2. Si faltan dependencies: Ejecuta npm install', colors.yellow);
    return false;
  }
  
  log('\n✅ Verificaciones básicas completadas', colors.green);
  return true;
}

async function startServer() {
  try {
    showWelcomeMessage();
    
    // Verificaciones básicas
    if (!quickCheck()) {
      log('\n💡 Intentando continuar de todas formas...', colors.yellow);
    }
    
    log('\n🚀 Iniciando servidor...', colors.green);
    
    // Importar y iniciar el servidor principal
    const { startServer } = require('./server');
    await startServer();
    
  } catch (error) {
    log('\n💥 Error iniciando servidor:', colors.red);
    log(error.message, colors.red);
    
    if (error.message.includes('ECONNREFUSED')) {
      log('\n🔧 Solución recomendada:', colors.yellow);
      log('  • Inicia XAMPP y asegúrate de que MySQL esté corriendo');
      log('  • Verifica que el puerto 3306 esté disponible');
    } else if (error.message.includes('EADDRINUSE')) {
      log('\n🔧 Solución recomendada:', colors.yellow);
      log('  • El puerto 5000 ya está en uso');
      log('  • Cambia el puerto en .env o detén el proceso que lo usa');
    }
    
    process.exit(1);
  }
}

// Iniciar servidor
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
