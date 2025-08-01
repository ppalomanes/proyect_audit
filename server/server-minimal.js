// server-minimal.js
// SERVIDOR MÍNIMO FUNCIONAL PARA DIAGNÓSTICO

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 Iniciando servidor mínimo...');

// Middlewares básicos
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Rutas básicas
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0-minimal',
    services: {
      server: 'running'
    }
  });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ status: 'Auth module placeholder', timestamp: new Date().toISOString() });
});

app.get('/api/auditorias', (req, res) => {
  res.json({ 
    message: 'Auditorias module placeholder', 
    auditorias: [],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/etl/status', (req, res) => {
  res.json({ status: 'ETL module placeholder', timestamp: new Date().toISOString() });
});

app.get('/api/chat/health', (req, res) => {
  res.json({ status: 'Chat module placeholder', timestamp: new Date().toISOString() });
});

app.get('/api/bitacora', (req, res) => {
  res.json({
    message: 'Sistema de bitácora placeholder',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Catch-all
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log('================================================================================');
  console.log('🎯 SERVIDOR MÍNIMO INICIADO EXITOSAMENTE');
  console.log('================================================================================');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
  console.log(`📅 Iniciado: ${new Date().toISOString()}`);
  console.log('================================================================================');
});

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

module.exports = app;