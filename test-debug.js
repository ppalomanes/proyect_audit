/**
 * Test de endpoints de debug
 */

const axios = require('axios');

async function testDebugEndpoints() {
  console.log('🔍 Probando endpoints de debug...\n');

  const baseURL = 'http://localhost:5000/api';

  try {
    // 1. Probar endpoint sin autenticación
    console.log('📡 1. Probando endpoint SIN autenticación...');
    try {
      const response1 = await axios.get(`${baseURL}/auditorias/test-sin-auth`);
      console.log(`✅ /test-sin-auth: ${response1.status} - ${response1.data.message}`);
    } catch (error) {
      console.log(`❌ /test-sin-auth: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // 2. Obtener token
    console.log('\n🔐 2. Obteniendo token...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@portal-auditorias.com',
      password: 'admin123'
    });
    const token = loginResponse.data.data.tokens.access_token;
    console.log('✅ Token obtenido');

    // 3. Probar endpoint CON autenticación
    console.log('\n📡 3. Probando endpoint CON autenticación...');
    try {
      const response2 = await axios.get(`${baseURL}/auditorias/test-con-auth`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ /test-con-auth: ${response2.status} - ${response2.data.message}`);
      console.log(`👤 Usuario en req: ${response2.data.data.user ? 'SÍ detectado' : 'NO detectado'}`);
      if (response2.data.data.user) {
        console.log(`   ID: ${response2.data.data.user.id}`);
        console.log(`   Email: ${response2.data.data.user.email}`);
        console.log(`   Rol: ${response2.data.data.user.rol}`);
      }
    } catch (error) {
      console.log(`❌ /test-con-auth: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // 4. Probar endpoints principales simplificados
    console.log('\n📡 4. Probando endpoints principales simplificados...');
    
    const endpoints = [
      '/auditorias/estadisticas',
      '/auditorias',
      '/auditorias/mis-auditorias'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${baseURL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`✅ ${endpoint}: ${response.status} - ${response.data.message}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

testDebugEndpoints();
