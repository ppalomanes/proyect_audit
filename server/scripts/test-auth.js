/**
 * Script de Prueba - Sistema de Autenticación
 * Portal de Auditorías Técnicas
 * 
 * Uso: node test-auth.js
 * Prerequisito: Servidor corriendo en puerto 5000
 */

const baseUrl = 'http://localhost:5000';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

async function testAuthentication() {
  console.log('🚀 Portal de Auditorías Técnicas - Test de Autenticación\n');
  
  // 1. Health Check
  console.log('1. 🏥 Health Check...');
  const health = await makeRequest(`${baseUrl}/health`);
  
  if (!health.ok) {
    console.log('❌ Servidor no disponible. Inicia el servidor primero:');
    console.log('   cd server && node server.js');
    return;
  }
  
  console.log(`✅ Servidor: ${health.data.status}`);
  console.log(`   Base de datos: ${health.data.services?.database ? '✅' : '❌'}`);
  console.log(`   Redis: ${health.data.services?.redis ? '✅' : '⚠️'}`);
  console.log(`   Ollama: ${health.data.services?.ollama ? '✅' : '⚠️'}\n`);
  
  // 2. Info de API de Auth
  console.log('2. 📋 API de Autenticación...');
  const authInfo = await makeRequest(`${baseUrl}/api/auth`);
  
  if (authInfo.ok) {
    console.log(`✅ ${authInfo.data.message}`);
    console.log(`   Endpoints públicos: ${Object.keys(authInfo.data.endpoints.public).length}`);
    console.log(`   Endpoints protegidos: ${Object.keys(authInfo.data.endpoints.protected).length}`);
    console.log(`   Tipo de autenticación: ${authInfo.data.authentication.type}\n`);
  }
  
  // 3. Login con usuario admin
  console.log('3. 🔐 Login con usuario admin...');
  const login = await makeRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@portal-auditorias.com',
      password: 'admin123'
    })
  });
  
  if (login.ok && login.data.status === 'success') {
    const user = login.data.data.user;
    const token = login.data.data.tokens.access_token;
    
    console.log('✅ Login exitoso!');
    console.log(`   Usuario: ${user.email}`);
    console.log(`   Rol: ${user.rol}`);
    console.log(`   Nombre: ${user.nombres} ${user.apellidos}`);
    console.log(`   Estado: ${user.estado}`);
    console.log(`   Email verificado: ${user.email_verificado ? '✅' : '❌'}\n`);
    
    // 4. Test endpoints protegidos
    await testProtectedEndpoints(token);
    
    // 5. Test de otro usuario
    await testOtherUserLogin();
    
  } else {
    console.log('❌ Error en login admin:');
    console.log(`   Status: ${login.status}`);
    console.log(`   Mensaje: ${login.data.message}`);
    console.log('   Verifica que existan los usuarios de prueba\n');
  }
  
  // 6. Test de validaciones
  await testValidations();
  
  console.log('🎉 Tests de autenticación completados!\n');
}

async function testProtectedEndpoints(token) {
  const headers = { 'Authorization': `Bearer ${token}` };
  
  console.log('4. 🛡️ Endpoints protegidos...');
  
  // Profile
  const profile = await makeRequest(`${baseUrl}/api/auth/profile`, { headers });
  if (profile.ok) {
    console.log('✅ GET /profile - OK');
  } else {
    console.log('❌ GET /profile - Error:', profile.data.message);
  }
  
  // Permissions
  const permissions = await makeRequest(`${baseUrl}/api/auth/permissions`, { headers });
  if (permissions.ok) {
    const perms = permissions.data.data;
    console.log('✅ GET /permissions - OK');
    console.log(`   Rol: ${perms.user_role}`);
    console.log(`   Es admin: ${perms.has_admin_access}`);
    console.log(`   Permisos: ${perms.permissions.length > 5 ? perms.permissions.slice(0, 3).join(', ') + '...' : perms.permissions.join(', ')}`);
  } else {
    console.log('❌ GET /permissions - Error:', permissions.data.message);
  }
  
  // Sessions
  const sessions = await makeRequest(`${baseUrl}/api/auth/sessions`, { headers });
  if (sessions.ok) {
    console.log('✅ GET /sessions - OK');
  } else {
    console.log('❌ GET /sessions - Error:', sessions.data.message);
  }
  
  // Validate token
  const validate = await makeRequest(`${baseUrl}/api/auth/validate-token`, { headers });
  if (validate.ok) {
    console.log('✅ GET /validate-token - OK');
  } else {
    console.log('❌ GET /validate-token - Error:', validate.data.message);
  }
  
  console.log('');
}

async function testOtherUserLogin() {
  console.log('5. 👤 Login con usuario auditor...');
  
  const login = await makeRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'auditor@portal-auditorias.com',
      password: 'auditor123'
    })
  });
  
  if (login.ok && login.data.status === 'success') {
    const user = login.data.data.user;
    console.log('✅ Login auditor exitoso!');
    console.log(`   Usuario: ${user.email}`);
    console.log(`   Rol: ${user.rol}\n`);
  } else {
    console.log('❌ Error en login auditor:', login.data.message, '\n');
  }
}

async function testValidations() {
  console.log('6. ✅ Test de validaciones...');
  
  // Login con datos faltantes
  const badLogin1 = await makeRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com' }) // Sin password
  });
  
  if (badLogin1.status === 400) {
    console.log('✅ Validación email sin password - OK');
  } else {
    console.log('❌ Validación email sin password - Error');
  }
  
  // Login con credenciales incorrectas
  const badLogin2 = await makeRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@portal-auditorias.com',
      password: 'wrongpassword'
    })
  });
  
  if (badLogin2.status === 401) {
    console.log('✅ Credenciales incorrectas - OK');
  } else {
    console.log('❌ Credenciales incorrectas - Error');
  }
  
  // Acceso sin token
  const noToken = await makeRequest(`${baseUrl}/api/auth/profile`);
  
  if (noToken.status === 401) {
    console.log('✅ Acceso sin token - OK');
  } else {
    console.log('❌ Acceso sin token - Error');
  }
  
  // Token inválido
  const badToken = await makeRequest(`${baseUrl}/api/auth/profile`, {
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  
  if (badToken.status === 401) {
    console.log('✅ Token inválido - OK');
  } else {
    console.log('❌ Token inválido - Error');
  }
  
  console.log('');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  // Polyfill para fetch en Node.js si no está disponible
  if (typeof fetch === 'undefined') {
    console.log('⚠️ Este script requiere Node.js 18+ o instalar node-fetch');
    console.log('   npm install node-fetch');
    process.exit(1);
  }
  
  testAuthentication().catch(error => {
    console.error('💥 Error en tests:', error.message);
    process.exit(1);
  });
}

module.exports = { testAuthentication };
