#!/usr/bin/env node

/**
 * Debug detallado del problema de tokens JWT
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000';
const TEST_CREDENTIALS = {
  email: 'admin@portal-auditorias.com',
  password: 'admin123'
};

async function debugTokenIssue() {
  console.log('🔍 Debug detallado del problema de tokens JWT...\n');
  
  try {
    // 1. Login para obtener token
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    
    console.log('📋 Respuesta login status:', loginResponse.status);
    console.log('📋 Respuesta login data keys:', Object.keys(loginResponse.data));
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login falló: ${loginResponse.status}`);
    }
    
    const responseData = loginResponse.data;
    console.log('📋 Response data:', JSON.stringify(responseData, null, 2));
    
    // Extraer el token
    let token;
    if (responseData.data && responseData.data.tokens && responseData.data.tokens.access_token) {
      token = responseData.data.tokens.access_token;
    } else if (responseData.data && responseData.data.access_token) {
      token = responseData.data.access_token;
    } else {
      console.log('❌ No se pudo encontrar el token en la respuesta');
      console.log('📋 Estructura completa:', JSON.stringify(responseData, null, 2));
      return;
    }
    
    console.log('✅ Token extraído:', token.substring(0, 50) + '...');
    
    // 2. Decodificar token sin verificar
    console.log('\n2️⃣ Decodificando token (sin verificar)...');
    try {
      const decoded = jwt.decode(token, { complete: true });
      console.log('📋 Token header:', JSON.stringify(decoded.header, null, 2));
      console.log('📋 Token payload:', JSON.stringify(decoded.payload, null, 2));
    } catch (error) {
      console.log('❌ Error decodificando token:', error.message);
    }
    
    // 3. Intentar verificar token manualmente
    console.log('\n3️⃣ Verificando token manualmente...');
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-please';
    console.log('📋 JWT Secret usado:', jwtSecret.substring(0, 20) + '...');
    
    try {
      const verified = jwt.verify(token, jwtSecret);
      console.log('✅ Token verificado exitosamente:', JSON.stringify(verified, null, 2));
    } catch (error) {
      console.log('❌ Error verificando token:', error.message);
      console.log('📋 Tipo de error:', error.name);
    }
    
    // 4. Test con endpoint
    console.log('\n4️⃣ Testing endpoint con token...');
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Endpoint funcionó:', response.status);
    } catch (error) {
      console.log('❌ Endpoint falló:', error.response?.status, error.response?.data);
      
      // Agregar headers de debug
      console.log('📋 Headers enviados:', {
        'Authorization': `Bearer ${token.substring(0, 50)}...`
      });
    }
    
    // 5. Verificar variables de entorno
    console.log('\n5️⃣ Verificando variables de entorno...');
    console.log('📋 JWT_SECRET existe:', !!process.env.JWT_SECRET);
    console.log('📋 JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'no definido');
    
  } catch (error) {
    console.error('💥 Error en debug:', error.message);
    if (error.response) {
      console.error('📋 Response data:', error.response.data);
    }
  }
}

// Ejecutar debug
if (require.main === module) {
  debugTokenIssue().catch(console.error);
}

module.exports = debugTokenIssue;
