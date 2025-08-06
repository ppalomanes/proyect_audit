// Integración del módulo de auditorías en el sistema principal
const Auditoria = require('./domains/auditorias/models/Auditoria.model');
const DocumentoAuditoria = require('./domains/auditorias/models/DocumentoAuditoria.model');
const ParqueInformatico = require('./domains/auditorias/models/ParqueInformatico.model');
const auditoriasRoutes = require('./domains/auditorias/auditorias.routes');

// server.js - Integración principal
app.use('/api/auditorias', auditoriasRoutes);

// Sincronización de modelos con base de datos
const syncModels = async () => {
  try {
    // Sincronizar modelos de auditorías
    await Auditoria.sync({ alter: true });
    await DocumentoAuditoria.sync({ alter: true });
    await ParqueInformatico.sync({ alter: true });
    
    console.log('✅ Modelos de auditorías sincronizados correctamente');
  } catch (error) {
    console.error('❌ Error sincronizando modelos de auditorías:', error);
  }
};

module.exports = { syncModels };