/**
 * Servidor de Testing Simplificado
 * Para diagnosticar problemas de configuración
 */

const express = require('express');
const cors = require('cors');

// Variables de entorno
const { PORT = 3001 } = process.env;

// Crear aplicación Express
const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Health check básico
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Test de carga de rutas IA
app.get('/api/test-ia-routes', (req, res) => {
  try {
    const iaRoutes = require('./domains/ia/ia.routes');
    res.json({
      status: 'success',
      message: 'Rutas IA cargadas correctamente',
      router_type: typeof iaRoutes
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error cargando rutas IA',
      error: error.message
    });
  }
});

// Cargar rutas IA si es posible
try {
  const iaRoutes = require('./domains/ia/ia.routes');
  app.use('/api/ia', iaRoutes);
  console.log('✅ Rutas IA cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas IA:', error.message);
}

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de testing ejecutándose en puerto ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test IA routes: http://localhost:${PORT}/api/test-ia-routes`);
});
