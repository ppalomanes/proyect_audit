// Script para verificar y generar token JWT de prueba
// Ejecutar en la consola del navegador

console.log('🔍 Verificando token JWT...');

// 1. Verificar si existe token
const token = localStorage.getItem('auth_token');
console.log('Token actual:', token ? 'Existe' : 'No existe');

if (token) {
  try {
    // Verificar si el token es válido
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    const now = Date.now();
    
    console.log('Token expira:', new Date(expiry));
    console.log('Token válido:', now < expiry ? 'SÍ' : 'NO - EXPIRADO');
    
    if (now > expiry) {
      console.log('❌ Token expirado, eliminando...');
      localStorage.removeItem('auth_token');
    }
  } catch (e) {
    console.log('❌ Token malformado:', e.message);
    localStorage.removeItem('auth_token');
  }
} else {
  console.log('❌ No hay token, generando uno temporal...');
  
  // Generar token temporal válido para pruebas
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
  const payload = btoa(JSON.stringify({
    userId: 1,
    email: 'admin@portal-auditorias.com',
    nombre: 'Administrador',
    rol: 'Admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  }));
  
  // Nota: Esta es una simulación para pruebas, en producción el servidor genera el token
  const fakeSignature = btoa('fake-signature-for-testing');
  const testToken = `${header}.${payload}.${fakeSignature}`;
  
  localStorage.setItem('auth_token', testToken);
  console.log('✅ Token temporal generado');
}

// 2. Verificar datos de usuario en authStore
const userDataString = localStorage.getItem('auth-storage');
console.log('Datos authStore:', userDataString ? 'Existen' : 'No existen');

if (userDataString) {
  try {
    const userData = JSON.parse(userDataString);
    console.log('Usuario actual:', userData.state?.user);
  } catch (e) {
    console.log('❌ Datos de usuario corruptos');
    localStorage.removeItem('auth-storage');
  }
}

console.log('🔄 Recarga la página para aplicar cambios');
