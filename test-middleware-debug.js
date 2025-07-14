/**
 * Test de debug de middleware
 */

const axios = require('axios');

async function testMiddlewareDebug() {
  console.log('🔍 Probando debug de middleware...\n');

  const baseURL = 'http://localhost:5000/api';

  try {
    // 1. Probar ruta simple
    console.log('📡 1. Probando ruta simple...');
    const response1 = await axios.get(`${baseURL}/auditorias/test-simple`);
    console.log(`✅ Ruta simple: ${response1.status} - ${response1.data.message}`);

    // 2. Obtener token
    console.log('\n🔐 2. Obteniendo token...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@portal-auditorias.com',
      password: 'admin123'
    });
    const token = loginResponse.data.data.tokens.access_token;
    console.log('✅ Token obtenido');

    // 3. Probar middleware manual
    console.log('\n📡 3. Probando middleware manual...');
    try {
      const response2 = await axios.get(`${baseURL}/auditorias/test-middleware-manual`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ Middleware manual: ${response2.status} - ${response2.data.message}`);
    } catch (error) {
      console.log(`❌ Middleware manual: ${error.response?.status} - ${error.response?.data?.message}`);
    }

    // 4. Probar requireAuth importado
    console.log('\n📡 4. Probando requireAuth importado...');
    try {
      const response3 = await axios.get(`${baseURL}/auditorias/test-require-auth`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ requireAuth: ${response3.status} - ${response3.data.message}`);
    } catch (error) {
      console.log(`❌ requireAuth: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testMiddlewareDebug();
