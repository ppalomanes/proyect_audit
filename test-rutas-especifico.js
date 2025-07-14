/**
 * Test específico para rutas de auditorías
 * Portal de Auditorías Técnicas
 */

const axios = require('axios');

async function testRutasAuditorias() {
  console.log('🔍 Probando específicamente las rutas de auditorías...\n');

  const baseURL = 'http://localhost:5000/api';

  try {
    // 1. Obtener token
    console.log('🔐 Obteniendo token...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@portal-auditorias.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.tokens.access_token;
    console.log('✅ Token obtenido correctamente');

    // 2. Verificar que el endpoint de auth funciona
    console.log('\n✅ Verificando endpoint de auth que SÍ funciona...');
    const profileResponse = await axios.get(`${baseURL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`✅ /api/auth/profile: ${profileResponse.status} - ${profileResponse.data.status}`);

    // 3. Probar cada endpoint de auditorías individualmente
    console.log('\n🧪 Probando endpoints de auditorías individualmente...');
    
    const endpoints = [
      'GET /api/auditorias',
      'GET /api/auditorias/estadisticas',
      'GET /api/auditorias/mis-auditorias'
    ];

    for (const endpoint of endpoints) {
      const [method, url] = endpoint.split(' ');
      console.log(`\n📡 Probando: ${endpoint}`);
      
      try {
        const response = await axios({
          method: method.toLowerCase(),
          url: `http://localhost:5000${url}`,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ ${endpoint}: ${response.status} - ${response.data.status}`);
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.message}`);
        
        // Si es 404, el endpoint no existe
        if (error.response?.status === 404) {
          console.log('   🔴 Endpoint no encontrado - problema de configuración de rutas');
        }
        // Si es 401, problema de autenticación
        else if (error.response?.status === 401) {
          console.log('   🔴 Problema de autenticación - middleware no aplicado');
        }
        // Si es 500, error interno
        else if (error.response?.status >= 500) {
          console.log('   🔴 Error interno del servidor');
          if (error.response?.data?.data?.error) {
            console.log(`   📋 Error: ${error.response.data.data.error}`);
          }
        }
      }
    }

    // 4. Verificar si las rutas están registradas
    console.log('\n🔍 Verificando registro de rutas...');
    try {
      const response = await axios.get('http://localhost:5000/api/auditorias/endpoint-inexistente');
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.message?.includes('auditorías')) {
        console.log('✅ Las rutas de auditorías están registradas (recibió 404 específico del módulo)');
      } else if (error.response?.status === 404 && !error.response?.data?.message?.includes('auditorías')) {
        console.log('❌ Las rutas de auditorías NO están registradas (404 genérico)');
      } else {
        console.log(`🤔 Respuesta inesperada: ${error.response?.status}`);
      }
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testRutasAuditorias();
