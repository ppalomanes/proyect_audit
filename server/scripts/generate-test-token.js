// /server/scripts/generate-test-token.js
// Script para generar token JWT válido para testing

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'portal-auditorias-super-secret-key-change-in-production';

console.log('🔐 Generando token JWT de prueba...');

// Datos del usuario administrador
const userData = {
  userId: 1,
  email: 'admin@portal-auditorias.com',
  nombre: 'Administrador',
  rol: 'Admin'
};

try {
  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });
  
  console.log('✅ Token generado exitosamente');
  console.log('📋 Token JWT:');
  console.log('=' .repeat(60));
  console.log(token);
  console.log('=' .repeat(60));
  console.log('');
  console.log('🔧 Para usar este token:');
  console.log('1. Abrir consola del navegador en localhost:3000');
  console.log('2. Ejecutar:');
  console.log(`   localStorage.setItem('auth_token', '${token}');`);
  console.log('3. Recargar la página');
  console.log('');
  
  // Decodificar para mostrar info
  const decoded = jwt.decode(token);
  console.log('⏰ Token válido hasta:', new Date(decoded.exp * 1000).toLocaleString());
  console.log('👤 Usuario:', decoded.nombre, '(' + decoded.email + ')');
  
} catch (error) {
  console.error('❌ Error generando token:', error.message);
}
