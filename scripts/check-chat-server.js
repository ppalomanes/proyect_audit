// /scripts/check-chat-server.js
// Script para verificar el estado del servidor de chat
// Uso: node scripts/check-chat-server.js

const http = require('http');
const { exec } = require('child_process');

console.log('🔍 Verificando estado del servidor de chat...\n');

// Función para verificar si un puerto está en uso
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: 'running',
            port: port,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: 'error',
            port: port,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 'offline',
        port: port,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'timeout',
        port: port,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

// Verificar proceso Node.js ejecutándose
function checkNodeProcesses() {
  return new Promise((resolve) => {
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout, stderr) => {
      if (error) {
        exec('ps aux | grep node', (linuxError, linuxStdout, linuxStderr) => {
          if (linuxError) {
            resolve({ error: 'No se pudo verificar procesos Node.js' });
          } else {
            const processes = linuxStdout.split('\n')
              .filter(line => line.includes('node') && !line.includes('grep'))
              .length;
            resolve({ count: processes, platform: 'linux' });
          }
        });
      } else {
        const lines = stdout.split('\n').filter(line => line.includes('node.exe'));
        resolve({ count: lines.length - 1, platform: 'windows' }); // -1 para header
      }
    });
  });
}

// Verificar XAMPP
function checkXAMPP() {
  return new Promise((resolve) => {
    exec('tasklist /FI "IMAGENAME eq mysqld.exe" /FO CSV', (error, stdout, stderr) => {
      if (error) {
        exec('ps aux | grep mysql', (linuxError, linuxStdout, linuxStderr) => {
          if (linuxError) {
            resolve({ mysql: false, platform: 'unknown' });
          } else {
            const mysqlRunning = linuxStdout.includes('mysqld');
            resolve({ mysql: mysqlRunning, platform: 'linux' });
          }
        });
      } else {
        const mysqlRunning = stdout.includes('mysqld.exe');
        resolve({ mysql: mysqlRunning, platform: 'windows' });
      }
    });
  });
}

async function runDiagnostics() {
  const results = {
    timestamp: new Date().toISOString(),
    ports: {},
    processes: {},
    xampp: {},
    recommendations: []
  };

  // 1. Verificar puertos comunes
  console.log('📡 Verificando puertos...');
  for (const port of [3000, 3001, 5000]) {
    process.stdout.write(`   Puerto ${port}: `);
    const result = await checkPort(port);
    results.ports[port] = result;
    
    switch (result.status) {
      case 'running':
        console.log(`✅ ACTIVO (${result.data?.services ? 'Chat Server' : 'Otro servicio'})`);
        break;
      case 'timeout':
        console.log('⏱️ TIMEOUT');
        break;
      case 'error':
        console.log(`❌ ERROR (${result.error})`);
        break;
      default:
        console.log('⭕ OFFLINE');
    }
  }

  // 2. Verificar procesos Node.js
  console.log('\n🔍 Verificando procesos Node.js...');
  const nodeProcesses = await checkNodeProcesses();
  results.processes = nodeProcesses;
  
  if (nodeProcesses.error) {
    console.log(`   ❌ ${nodeProcesses.error}`);
  } else {
    console.log(`   📊 Procesos Node.js ejecutándose: ${nodeProcesses.count}`);
    if (nodeProcesses.count === 0) {
      results.recommendations.push('Ejecutar el servidor: npm run chat');
    }
  }

  // 3. Verificar XAMPP/MySQL
  console.log('\n🗄️ Verificando MySQL...');
  const xampp = await checkXAMPP();
  results.xampp = xampp;
  
  if (xampp.mysql) {
    console.log('   ✅ MySQL ejecutándose');
  } else {
    console.log('   ❌ MySQL no detectado');
    results.recommendations.push('Iniciar XAMPP y verificar que MySQL esté ejecutándose');
  }

  // 4. Análisis y recomendaciones
  console.log('\n📋 RESUMEN:');
  console.log('=' .repeat(50));

  const chatServerRunning = results.ports[5000]?.status === 'running';
  const frontendRunning = results.ports[3000]?.status === 'running';

  console.log(`🔧 Servidor Chat (puerto 5000): ${chatServerRunning ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  console.log(`🌐 Frontend (puerto 3000): ${frontendRunning ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  console.log(`🗄️ MySQL: ${xampp.mysql ? '✅ ACTIVO' : '❌ INACTIVO'}`);

  // Generar recomendaciones específicas
  if (!chatServerRunning) {
    results.recommendations.push('Ejecutar servidor de chat: cd server && npm run chat');
  }
  
  if (!frontendRunning) {
    results.recommendations.push('Ejecutar frontend: cd client && npm run dev');
  }

  if (!xampp.mysql) {
    results.recommendations.push('Iniciar XAMPP Control Panel y arrancar MySQL');
  }

  // Verificar configuración de puertos
  if (results.ports[3001]?.status === 'running' && !chatServerRunning) {
    results.recommendations.push('Hay un servicio en puerto 3001 pero el chat debe ejecutarse en puerto 5000');
  }

  console.log('\n💡 RECOMENDACIONES:');
  if (results.recommendations.length === 0) {
    console.log('   ✅ Todo parece estar configurado correctamente');
    console.log('   🔍 Si persisten los problemas, usar el Diagnóstico del frontend');
  } else {
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log('\n🚀 COMANDOS RÁPIDOS:');
  console.log('   Servidor: cd C:\\xampp\\htdocs\\portal-auditorias\\server && npm run chat');
  console.log('   Frontend: cd C:\\xampp\\htdocs\\portal-auditorias\\client && npm run dev');
  console.log('   XAMPP: Abrir XAMPP Control Panel → Start MySQL');

  console.log('\n📊 ESTADO DETALLADO:');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Ejecutar diagnóstico
runDiagnostics()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando diagnóstico:', error);
    process.exit(1);
  });