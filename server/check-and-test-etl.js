// Check Server and Run ETL Tests
const axios = require('axios');
const { spawn } = require('child_process');

const SERVER_URL = 'http://localhost:5000';
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

async function checkServerHealth(retries = 0) {
  try {
    console.log('🔍 Verificando estado del servidor...');
    const response = await axios.get(`${SERVER_URL}/health`);
    console.log('✅ Servidor respondiendo correctamente');
    console.log('📊 Estado de servicios:', response.data.services);
    return true;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`⏳ Servidor no responde, reintentando en ${RETRY_DELAY/1000}s... (intento ${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return checkServerHealth(retries + 1);
    }
    console.log('❌ El servidor no está respondiendo en puerto 5000');
    return false;
  }
}

async function runTests() {
  // Verificar si el servidor está activo
  const serverIsUp = await checkServerHealth();
  
  if (!serverIsUp) {
    console.log('\n⚠️  El servidor no está activo. Intentando iniciarlo...\n');
    
    // Intentar iniciar el servidor
    console.log('🚀 Iniciando servidor ETL integrado...');
    const serverProcess = spawn('npm', ['run', 'etl:integrated'], {
      cwd: 'C:\\xampp\\htdocs\\portal-auditorias\\server',
      shell: true,
      detached: false
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`SERVER: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`SERVER ERROR: ${data}`);
    });

    // Esperar a que el servidor inicie
    console.log('\n⏳ Esperando a que el servidor inicie completamente...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar nuevamente
    const serverStarted = await checkServerHealth();
    if (!serverStarted) {
      console.log('❌ No se pudo iniciar el servidor. Por favor, inícielo manualmente.');
      console.log('   Ejecute: cd server && npm run etl:integrated');
      process.exit(1);
    }
  }

  console.log('\n🧪 Ejecutando pruebas de endpoints ETL...\n');
  
  // Ejecutar el script de pruebas
  const testProcess = spawn('node', ['test-etl-endpoints.js'], {
    cwd: __dirname,
    shell: true
  });

  testProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  testProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Pruebas completadas exitosamente');
    } else {
      console.log('\n❌ Las pruebas finalizaron con errores');
    }
    process.exit(code);
  });
}

// Ejecutar
console.log('🎯 Portal de Auditorías - Verificador y Tester ETL\n');
runTests().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
