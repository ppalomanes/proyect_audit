/**
 * Rutas de Autenticación - Proxy a Dominio Auth
 * Portal de Auditorías Técnicas
 */

// Re-exportar las rutas desde el dominio auth
module.exports = require('../domains/auth/auth.routes');
