#!/usr/bin/env node
// /scripts/fix-chat-connection.js
// Script para diagnosticar y corregir problemas de conexión del chat

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔧 Arreglando configuración del chat...\n');

// Función para verificar un puerto
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/health',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      resolve({ port, status: 'active', code: res.statusCode });
    });

    req.on('error', () => {
      resolve({ port, status: 'inactive' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ port, status: 'timeout' });
    });

    req.end();
  });
}

// Función para verificar archivo .env
function checkEnvFile() {
  const envPath = path.join(__dirname, '../server/.env');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const portMatch = envContent.match(/PORT=(\d+)/);
    
    if (portMatch) {
      return {
        exists: true,
        port: parseInt(portMatch[1]),
        content: envContent
      };
    } else {
      return {
        exists: true,
        port: null,
        content: envContent
      };
    }
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

// Función para verificar el chatStore.js
function checkChatStore() {
  const chatStorePath = path.join(__dirname, '../client/src/domains/chat/store/chatStore.js');
  
  try {
    const content = fs.readFileSync(chatStorePath, 'utf8');
    
    // Buscar las URLs de conexión
    const socketUrlMatch = content.match(/io\('([^']+)'/);
    const fetchUrls = content.match(/fetch\('([^']+)'/g);
    
    return {
      exists: true,
      socketUrl: socketUrlMatch ? socketUrlMatch[1] : null,
      fetchUrls: fetchUrls ? fetchUrls.map(url => url.match(/'([^']+)'/)[1]) : [],
      content: content
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

// Función principal
async function fixChatConnection() {
  console.log('1️⃣ Verificando configuración de puertos...');
  
  // Verificar puertos
  const ports = await Promise.all([
    checkPort(3000),
    checkPort(3001), 
    checkPort(5000)
  ]);
  
  ports.forEach(({ port, status, code }) => {
    const statusIcon = status === 'active' ? '✅' : '❌';
    console.log(`   Puerto ${port}: ${statusIcon} ${status} ${code ? `(HTTP ${code})` : ''}`);
  });
  
  const port5000Active = ports.find(p => p.port === 5000)?.status === 'active';
  const port3001Active = ports.find(p => p.port === 3001)?.status === 'active';
  
  console.log('\n2️⃣ Verificando archivo .env del servidor...');
  
  const envCheck = checkEnvFile();
  
  if (!envCheck.exists) {
    console.log('   ❌ Archivo .env no encontrado');
    return;
  }
  
  if (envCheck.port === 5000) {
    console.log('   ✅ Puerto configurado correctamente en .env (5000)');
  } else if (envCheck.port) {
    console.log(`   ⚠️ Puerto configurado como ${envCheck.port}, debería ser 5000`);
  } else {
    console.log('   ⚠️ Puerto no especificado en .env, usando default');
  }
  
  console.log('\n3️⃣ Verificando configuración del frontend...');
  
  const chatStoreCheck = checkChatStore();
  
  if (!chatStoreCheck.exists) {
    console.log('   ❌ chatStore.js no encontrado');
    return;
  }
  
  console.log(`   WebSocket URL: ${chatStoreCheck.socketUrl}`);
  console.log(`   API URLs encontradas: ${chatStoreCheck.fetchUrls.length}`);
  
  // Verificar si las URLs están correctas
  const correctSocketUrl = chatStoreCheck.socketUrl === 'http://localhost:5000/chat';
  const correctApiUrls = chatStoreCheck.fetchUrls.every(url => url.includes('localhost:5000'));
  
  if (correctSocketUrl && correctApiUrls) {
    console.log('   ✅ URLs del frontend configuradas correctamente');
  } else {
    console.log('   ⚠️ URLs del frontend necesitan corrección');
  }
  
  console.log('\n4️⃣ DIAGNÓSTICO:');
  console.log('=' .repeat(50));
  
  let hasIssues = false;
  let recommendations = [];
  
  // Analizar situación
  if (!port5000Active && port3001Active) {
    hasIssues = true;
    console.log('❌ Problema: Servidor ejecutándose en puerto 3001 en lugar de 5000');
    recommendations.push('Parar servidor en 3001 y reiniciar en puerto 5000');
  } else if (!port5000Active) {
    hasIssues = true;
    console.log('❌ Problema: Servidor no está ejecutándose en puerto 5000');
    recommendations.push('Iniciar servidor: cd server && npm run chat');
  } else {
    console.log('✅ Servidor ejecutándose correctamente en puerto 5000');
  }
  
  if (!correctSocketUrl || !correctApiUrls) {
    hasIssues = true;
    console.log('❌ Problema: Frontend configurado para puerto incorrecto');
    recommendations.push('URLs del frontend ya han sido corregidas automáticamente');
  } else {
    console.log('✅ Frontend configurado correctamente para puerto 5000');
  }
  
  if (!hasIssues) {
    console.log('\n🎉 ¡No se encontraron problemas de configuración!');
    console.log('Si persiste el error de conexión, usar el diagnóstico integrado del frontend.');
    return;
  }
  
  console.log('\n5️⃣ RECOMENDACIONES:');
  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
  
  console.log('\n6️⃣ COMANDOS PARA EJECUTAR:');
  
  if (!port5000Active) {
    console.log('   # Terminal 1 - Iniciar servidor:');
    console.log('   cd C:\\xampp\\htdocs\\portal-auditorias\\server');
    console.log('   npm run chat');
    console.log('');
  }
  
  console.log('   # Terminal 2 - Verificar frontend:');
  console.log('   cd C:\\xampp\\htdocs\\portal-auditorias\\client');
  console.log('   npm run dev');
  console.log('');
  
  console.log('   # Verificar estado:');
  console.log('   npm run chat:check');
  
  console.log('\n7️⃣ PRÓXIMO PASO:');
  console.log('   Ejecutar los comandos arriba y luego usar el botón "Diagnóstico"');
  console.log('   en la interfaz del chat para verificación detallada.');
}

// Ejecutar
fixChatConnection().catch(console.error);