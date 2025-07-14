/**
 * Script de Debug - Módulo Auditorías
 * Portal de Auditorías Técnicas - Debugging del problema de autenticación
 */

const axios = require('axios');

async function debugAuth() {
  console.log('🔍 Debugging del problema de autenticación...\n');

  const baseURL = 'http://localhost:5000/api';

  try {
    // 1. Login y obtener token
    console.log('🔐 1. Obteniendo token...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@portal-auditorias.com',
      password: 'admin123'
    });

    console.log('✅ Login exitoso');
    console.log('📋 Estructura de respuesta de login:');
    console.log(JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.data.tokens.access_token;
    console.log(`\n🔑 Token obtenido: ${token.substring(0, 50)}...`);

    // 2. Probar endpoint protegido con headers diferentes
    console.log('\n🧪 2. Probando diferentes formatos de Authorization header...');

    // Formato 1: Bearer token
    console.log('\n📡 Probando formato: Bearer token');
    try {
      const response1 = await axios.get(`${baseURL}/auditorias/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Formato Bearer funcionó!');
      console.log(`📊 Respuesta: ${JSON.stringify(response1.data.status)}`);
    } catch (error) {
      console.log(`❌ Formato Bearer falló: ${error.response?.status} - ${error.response?.data?.message}`);
      console.log('📋 Headers enviados:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });
    }

    // Formato 2: Solo token
    console.log('\n📡 Probando formato: Solo token');
    try {
      const response2 = await axios.get(`${baseURL}/auditorias/estadisticas`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Formato solo token funcionó!');
    } catch (error) {
      console.log(`❌ Formato solo token falló: ${error.response?.status} - ${error.response?.data?.message}`);
    }

    // 3. Probar el endpoint de perfil que sabemos que funciona
    console.log('\n🧪 3. Probando endpoint de perfil (que debe funcionar)...');
    try {
      const profileResponse = await axios.get(`${baseURL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Endpoint de perfil funcionó!');
      console.log(`👤 Usuario: ${profileResponse.data.data.user.nombres} ${profileResponse.data.data.user.apellidos}`);
      console.log(`🔖 Rol: ${profileResponse.data.data.user.rol}`);
    } catch (error) {
      console.log(`❌ Endpoint de perfil falló: ${error.response?.status} - ${error.response?.data?.message}`);
    }

    // 4. Verificar si las rutas de auditorías están bien configuradas
    console.log('\n🧪 4. Verificando configuración de rutas...');
    try {
      const response = await axios.get(`${baseURL}/auditorias`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Ruta /api/auditorias está configurada correctamente!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Problema de autenticación en rutas de auditorías');
        console.log('📋 Posibles causas:');
        console.log('   - Middleware de auth no aplicado correctamente');
        console.log('   - Problema en el orden de middleware');
        console.log('   - Headers no enviados correctamente');
      } else if (error.response?.status === 404) {
        console.log('❌ Ruta /api/auditorias no encontrada - problema de configuración');
      } else {
        console.log(`❌ Error inesperado: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    // 5. Verificar estructura del token
    console.log('\n🔍 5. Analizando estructura del token...');
    try {
      const tokenParts = token.split('.');
      console.log(`🔧 Partes del JWT: ${tokenParts.length} (debe ser 3)`);
      
      if (tokenParts.length === 3) {
        // Decodificar header del JWT
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        console.log('📋 Header JWT:', header);
        
        // Decodificar payload del JWT
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('📋 Payload JWT:', {
          userId: payload.userId,
          rol: payload.rol,
          exp: new Date(payload.exp * 1000).toISOString(),
          iat: new Date(payload.iat * 1000).toISOString()
        });
        
        // Verificar si el token está expirado
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          console.log('❌ Token está EXPIRADO!');
        } else {
          console.log(`✅ Token válido por ${Math.floor((payload.exp - now) / 60)} minutos más`);
        }
      }
    } catch (e) {
      console.log('❌ Error decodificando token:', e.message);
    }

  } catch (error) {
    console.error('\n💥 Error fatal en debug:', error.message);
    if (error.response) {
      console.error('📋 Detalles del error:', error.response.data);
    }
  }
}

// Ejecutar debug
debugAuth();
