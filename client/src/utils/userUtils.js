/**
 * Utilidades para el manejo de usuarios
 * Portal de Auditorías Técnicas
 */

/**
 * Genera las iniciales de un usuario basado en nombres y apellidos
 * @param {Object} user - Objeto usuario del authStore
 * @returns {string} - Iniciales (ej: "JD" para Juan Doe)
 */
export const getUserInitials = (user) => {
  if (!user) return 'U';
  
  const nombres = user.nombres || '';
  const apellidos = user.apellidos || '';
  
  // Obtener primera letra de nombres y apellidos
  const primeraLetraNombre = nombres.charAt(0).toUpperCase();
  const primeraLetraApellido = apellidos.charAt(0).toUpperCase();
  
  // Si tenemos ambos, usarlos
  if (primeraLetraNombre && primeraLetraApellido) {
    return `${primeraLetraNombre}${primeraLetraApellido}`;
  }
  
  // Si solo tenemos nombre, usar las dos primeras letras
  if (primeraLetraNombre) {
    const segundaLetra = nombres.charAt(1).toUpperCase() || '';
    return `${primeraLetraNombre}${segundaLetra}`;
  }
  
  // Fallback
  return 'U';
};

/**
 * Obtiene el nombre completo del usuario
 * @param {Object} user - Objeto usuario del authStore
 * @returns {string} - Nombre completo
 */
export const getUserFullName = (user) => {
  if (!user) return 'Usuario';
  
  const nombres = user.nombres || '';
  const apellidos = user.apellidos || '';
  
  if (nombres && apellidos) {
    return `${nombres} ${apellidos}`;
  }
  
  return nombres || apellidos || user.email || 'Usuario';
};

/**
 * Traduce el rol del usuario a un texto más amigable
 * @param {string} rol - Rol del usuario (ADMIN, AUDITOR, etc.)
 * @returns {string} - Texto del rol traducido
 */
export const translateUserRole = (rol) => {
  const roleTranslations = {
    'ADMIN': 'Administrador',
    'AUDITOR': 'Auditor',
    'SUPERVISOR': 'Supervisor',
    'PROVEEDOR': 'Proveedor'
  };
  
  return roleTranslations[rol] || rol;
};
