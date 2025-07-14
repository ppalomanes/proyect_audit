#!/usr/bin/env node

/**
 * Test para verificar que el fix del middleware requireAuth funciona correctamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_CREDENTIALS = {
  email: 'admin@portal-auditorias.com',
  password: 'admin123'
};

async function testMiddlewareFix() {
  console.log('🧪 Iniciando test del fix de middleware requireAuth...\n');
  
  try {
    // 1. Login para obtener token
    console.log('1️⃣ Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login falló: ${loginResponse.status}`);
    }
    
    const token = loginResponse.data.data.tokens.access_token;
    console.log('✅ Token obtenido exitosamente');
    
    // 2. Test endpoint auth (que sabemos que funcionaba)
    console.log('\n2️⃣ Testing endpoint /api/auth/profile (referencia)...');
    const authResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (authResponse.status === 200) {
      console.log('✅ Endpoint auth/profile funciona correctamente');
    } else {
      console.log('❌ Endpoint auth/profile falló:', authResponse.status);
    }
    
    // 3. Test endpoint auditorías (que estaba fallando)
    console.log('\n3️⃣ Testing endpoint /api/auditorias/test-require-auth (el que fallaba)...');
    
    try {
      const auditoriasResponse = await axios.get(`${BASE_URL}/api/auditorias/test-require-auth`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (auditoriasResponse.status === 200) {
        console.log('✅ ¡FIX EXITOSO! Endpoint auditorías funciona correctamente');
        console.log('📋 Respuesta:', auditoriasResponse.data);
      } else {
        console.log('❌ Endpoint auditorías aún falla:', auditoriasResponse.status);
      }
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Endpoint auditorías falla con:', error.response.status, error.response.data);
      } else {
        console.log('❌ Error de red:', error.message);
      }
    }
    
    // 4. Test adicional: verificar que otros endpoints de auditorías funcionan
    console.log('\n4️⃣ Testing otros endpoints de auditorías...');
    
    const testEndpoints = [
      '/api/auditorias',
      '/api/auditorias/mis-auditorias'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`✅ ${endpoint}: ${response.status} - OK`);
      } catch (error) {
        const status = error.response ? error.response.status : 'ERROR';
        console.log(`❌ ${endpoint}: ${status} - FAIL`);
      }
    }
    
    console.log('\n🎉 Test completado!');
    
  } catch (error) {
    console.error('💥 Error durante el test:', error.message);
    if (error.response) {
      console.error('📋 Detalles del error:', error.response.data);
    }
  }
}

// Ejecutar test si es llamado directamente
if (require.main === module) {
  testMiddlewareFix().catch(console.error);
}

module.exports = testMiddlewareFix;
