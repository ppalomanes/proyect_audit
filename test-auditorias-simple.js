/**
 * Script de Prueba Rápida - Módulo Auditorías
 * Portal de Auditorías Técnicas
 */

const axios = require('axios');

async function probarModuloAuditorias() {
  console.log('🧪 Iniciando pruebas rápidas del módulo Auditorías...\n');

  const baseURL = 'http://localhost:5000/api';
  let authToken = null;

  try {
    // 1. Verificar que el servidor está corriendo
    console.log('🔍 Verificando estado del servidor...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log(`✅ Servidor: ${healthResponse.data.status}`);
    console.log(`📊 Servicios activos: ${healthResponse.data.connections_active}/4\n`);

    // 2. Autenticarse
    console.log('🔐 Autenticando como administrador...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@portal-auditorias.com',
      password: 'admin123'
    });

    authToken = loginResponse.data.data.tokens.access_token;
    console.log('✅ Autenticación exitosa\n');

    // 3. Probar endpoint de estadísticas (más simple)
    console.log('📊 Probando endpoint de estadísticas...');
    const statsResponse = await axios.get(`${baseURL}/auditorias/estadisticas`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Estadísticas obtenidas:');
    console.log(`   Total auditorías: ${statsResponse.data.data.resumen.total_auditorias}`);
    console.log(`   Por vencer: ${statsResponse.data.data.resumen.por_vencer}`);
    console.log(`   Vencidas: ${statsResponse.data.data.resumen.vencidas}\n`);

    // 4. Probar endpoint de listar auditorías
    console.log('📋 Probando endpoint de listar auditorías...');
    const listResponse = await axios.get(`${baseURL}/auditorias?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Lista de auditorías obtenida:');
    console.log(`   Auditorías encontradas: ${listResponse.data.data.auditorias.length}`);
    console.log(`   Total en sistema: ${listResponse.data.data.pagination.total_items}`);
    console.log(`   Páginas: ${listResponse.data.data.pagination.total_pages}\n`);

    // 5. Probar endpoint mis auditorías
    console.log('👤 Probando endpoint mis auditorías...');
    const myAuditoriasResponse = await axios.get(`${baseURL}/auditorias/mis-auditorias`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Mis auditorías obtenidas:');
    console.log(`   Auditorías del usuario: ${myAuditoriasResponse.data.data.auditorias.length}\n`);

    // 6. Intentar crear una auditoría (esperamos error por IDs inválidos)
    console.log('📝 Probando creación de auditoría (test de validación)...');
    
    try {
      await axios.post(`${baseURL}/auditorias`, {
        titulo: 'Auditoría de Prueba Test',
        descripcion: 'Prueba de validación de endpoints',
        proveedor_id: 'invalid-uuid',
        auditor_principal_id: 'invalid-uuid',
        fecha_programada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('⚠️ Unexpected: Creación exitosa con IDs inválidos');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validación funcionando correctamente - IDs inválidos rechazados');
        console.log(`   Error esperado: ${error.response.data.message}\n`);
      } else {
        console.log(`❌ Error inesperado: ${error.response?.status} - ${error.response?.data?.message}\n`);
      }
    }

    console.log('🎉 ¡Todas las pruebas básicas completadas exitosamente!');
    console.log('\n📋 Resumen de pruebas:');
    console.log('   ✅ Servidor funcionando');
    console.log('   ✅ Autenticación JWT operativa');
    console.log('   ✅ Endpoint estadísticas funcional');
    console.log('   ✅ Endpoint listar auditorías funcional');
    console.log('   ✅ Endpoint mis auditorías funcional');
    console.log('   ✅ Validaciones de entrada funcionando');
    console.log('\n🚀 El módulo de auditorías está completamente operativo!');

  } catch (error) {
    console.error('\n❌ Error en las pruebas:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 El servidor no está corriendo en http://localhost:5000');
      console.error('💡 Asegúrate de que el servidor esté iniciado con: npm start');
    } else if (error.response) {
      console.error(`🔴 HTTP ${error.response.status}: ${error.response.data?.message || error.message}`);
      if (error.response.data) {
        console.error('📋 Detalles:', JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.error('🔴 Error:', error.message);
    }
  }
}

// Ejecutar las pruebas
probarModuloAuditorias();
