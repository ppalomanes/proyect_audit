/**
 * Utilidad para limpiar storage corrupto
 * Portal de Auditorías Técnicas
 */

// Función para limpiar storage corrupto automáticamente
export const cleanCorruptedStorage = () => {
  console.log('🧹 Iniciando limpieza de storage corrupto...');
  
  let corruptedItems = 0;
  
  // Limpiar localStorage - SOLO valores específicamente corruptos
  ['token', 'refresh_token', 'user', 'auth-storage'].forEach(key => {
    const value = localStorage.getItem(key);
    // 🛡️ Solo considerar corrupto si es string "undefined" o cadena vacía
    if (value === 'undefined' || value === '') {
      console.log(`❌ Removiendo localStorage.${key}: ${value}`);
      localStorage.removeItem(key);
      corruptedItems++;
    }
  });
  
  // Limpiar sessionStorage - SOLO valores específicamente corruptos
  ['token', 'refresh_token', 'user'].forEach(key => {
    const value = sessionStorage.getItem(key);
    // 🛡️ Solo considerar corrupto si es string "undefined" o cadena vacía
    if (value === 'undefined' || value === '') {
      console.log(`❌ Removiendo sessionStorage.${key}: ${value}`);
      sessionStorage.removeItem(key);
      corruptedItems++;
    }
  });
  
  // Verificar JSON válido en localStorage existente
  ['user', 'auth-storage'].forEach(key => {
    const value = localStorage.getItem(key);
    if (value && value !== 'undefined' && value !== 'null') {
      try {
        JSON.parse(value);
        console.log(`✅ ${key}: JSON válido`);
      } catch (error) {
        console.log(`❌ JSON corrupto en ${key}, removiendo...`);
        localStorage.removeItem(key);
        corruptedItems++;
      }
    }
  });
  
  if (corruptedItems > 0) {
    console.log(`🧹 ${corruptedItems} elementos corruptos limpiados`);
    return true; // Indica que se limpiaron datos
  } else {
    console.log('✅ Storage limpio, no se requiere acción');
    return false;
  }
};

// Función para ejecutar limpieza en desarrollo (MEJORADA - Anti-loop)
export const devCleanStorage = () => {
  if (import.meta.env.DEV) {
    // 🛡️ Verificar si ya se ejecutó la limpieza en esta sesión
    const cleanupFlag = sessionStorage.getItem('dev_cleanup_executed');
    if (cleanupFlag === 'true') {
      console.log('ℹ️ Limpieza ya ejecutada en esta sesión, saltando...');
      return;
    }
    
    console.log('🔧 Modo desarrollo: Ejecutando limpieza automática...');
    const wasCleaned = cleanCorruptedStorage();
    
    // Marcar que ya se ejecutó la limpieza
    sessionStorage.setItem('dev_cleanup_executed', 'true');
    
    if (wasCleaned) {
      console.log('🔄 Datos limpiados, recargando página...');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      console.log('✅ No se requiere limpieza, continuando...');
    }
  }
};

// Función para diagnosticar storage
export const diagnoseStorage = () => {
  console.log('🔍 DIAGNÓSTICO DE STORAGE');
  console.log('========================');
  
  console.log('\n📁 localStorage:');
  ['token', 'refresh_token', 'user', 'auth-storage'].forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, {
      exists: !!value,
      type: typeof value,
      value: value?.substring(0, 50) + (value?.length > 50 ? '...' : ''),
      isValid: value && value !== 'undefined' && value !== 'null'
    });
  });
  
  console.log('\n📂 sessionStorage:');
  ['token', 'refresh_token', 'user'].forEach(key => {
    const value = sessionStorage.getItem(key);
    console.log(`  ${key}:`, {
      exists: !!value,
      type: typeof value,
      value: value?.substring(0, 50) + (value?.length > 50 ? '...' : ''),
      isValid: value && value !== 'undefined' && value !== 'null'
    });
  });
  
  console.log('\n🧪 Validación JSON:');
  ['user', 'auth-storage'].forEach(key => {
    const value = localStorage.getItem(key);
    if (value && value !== 'undefined') {
      try {
        const parsed = JSON.parse(value);
        console.log(`  ✅ ${key}: JSON válido`, typeof parsed);
      } catch (error) {
        console.log(`  ❌ ${key}: JSON inválido -`, error.message);
      }
    }
  });
};

// Script para ejecutar en DevTools Console
export const generateCleanupScript = () => {
  return `
// === SCRIPT DE LIMPIEZA AUTOMÁTICA STORAGE ===
console.log('🧹 Limpiando storage corrupto...');

// Limpiar localStorage
['token', 'refresh_token', 'user', 'auth-storage'].forEach(key => {
  const value = localStorage.getItem(key);
  if (value === 'undefined' || value === null || value === '') {
    console.log(\`❌ Removiendo \${key}: \${value}\`);
    localStorage.removeItem(key);
  } else {
    console.log(\`✅ \${key}: OK\`);
  }
});

// Limpiar sessionStorage  
['token', 'refresh_token', 'user'].forEach(key => {
  const value = sessionStorage.getItem(key);
  if (value === 'undefined' || value === null || value === '') {
    console.log(\`❌ Removiendo \${key}: \${value}\`);
    sessionStorage.removeItem(key);
  } else {
    console.log(\`✅ \${key}: OK\`);
  }
});

// Verificar JSON válido
['user', 'auth-storage'].forEach(key => {
  const value = localStorage.getItem(key);
  if (value && value !== 'undefined') {
    try {
      JSON.parse(value);
      console.log(\`✅ \${key}: JSON válido\`);
    } catch (error) {
      console.log(\`❌ JSON corrupto en \${key}, removiendo...\`);
      localStorage.removeItem(key);
    }
  }
});

console.log('✅ Storage limpiado. Recargando página...');
setTimeout(() => location.reload(), 1000);
// === FIN SCRIPT ===
  `.trim();
};

// Función para uso inmediato en console (MEJORADA)
if (typeof window !== 'undefined') {
  window.cleanStorage = cleanCorruptedStorage;
  window.diagnoseStorage = diagnoseStorage;
  window.devCleanStorage = devCleanStorage;
  
  // Agregar utilidad para debug de AuthStore
  window.debugAuth = () => {
    if (typeof useAuthStore !== 'undefined') {
      const state = useAuthStore.getState();
      console.log('🔍 AuthStore Debug:', {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        user: state.user,
        hasToken: !!state.token,
        error: state.error,
        loading: state.loading
      });
      return state;
    } else {
      console.log('AuthStore no disponible');
    }
  };
  
  console.log('✅ Storage utilities loaded:', {
    cleanStorage: 'Limpiar storage corrupto',
    diagnoseStorage: 'Diagnosticar storage actual', 
    devCleanStorage: 'Limpieza modo desarrollo',
    debugAuth: 'Debug estado AuthStore'
  });
}

// Exportar para uso en componentes
export default {
  cleanCorruptedStorage,
  devCleanStorage, 
  diagnoseStorage,
  generateCleanupScript
};
