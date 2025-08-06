// versiones.routes.js - Rutas para control de versiones
const express = require('express');
const router = express.Router();

// Datos de prueba para versiones
const versionesPrueba = [];

// GET /api/versiones/documentos - Obtener versiones de documentos
router.get('/documentos', (req, res) => {
  try {
    const { documento_id } = req.query;
    
    let versiones = [...versionesPrueba];
    
    if (documento_id) {
      versiones = versiones.filter(v => v.documento_id === parseInt(documento_id));
    }
    
    res.json({
      success: true,
      versiones: versiones,
      total: versiones.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo versiones',
      error: error.message
    });
  }
});

// POST /api/versiones/documentos - Crear nueva versión
router.post('/documentos', (req, res) => {
  try {
    const nuevaVersion = {
      id: versionesPrueba.length + 1,
      fecha_creacion: new Date().toISOString(),
      ...req.body
    };
    
    versionesPrueba.unshift(nuevaVersion);
    
    res.status(201).json({
      success: true,
      version: nuevaVersion,
      message: 'Versión creada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando versión',
      error: error.message
    });
  }
});

module.exports = router;