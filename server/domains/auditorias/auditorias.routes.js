// auditorias.routes.js - Rutas para el workflow de auditorías
const router = require('express').Router();
const auditoriasController = require('./auditorias.controller');
const { authenticate } = require('../auth/middleware/authentication');
const { authorize } = require('../auth/middleware/authorization');
const multer = require('multer');
const path = require('path');

// Configuración de multer para carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const auditoriaId = req.params.id;
    const uploadPath = path.join(__dirname, '../../../uploads/auditorias', auditoriaId);
    // Crear directorio si no existe
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// ===== RUTAS PÚBLICAS (para usuarios autenticados) =====

// Listar auditorías (con filtros según rol)
router.get('/', auditoriasController.listar);

// Obtener detalle de auditoría
router.get('/:id', auditoriasController.obtenerPorId);

// Obtener progreso de auditoría
router.get('/:id/progreso', auditoriasController.obtenerProgreso);

// Listar documentos de una auditoría
router.get('/:id/documentos', auditoriasController.listarDocumentos);

// Estadísticas generales
router.get('/estadisticas/general', auditoriasController.obtenerEstadisticas);

// ===== RUTAS PARA PROVEEDORES =====

// Cargar documento (ETAPA 2)
router.post(
  '/:id/documentos',
  authorize(['PROVEEDOR', 'ADMIN']),
  upload.single('archivo'),
  auditoriasController.cargarDocumento
);

// Finalizar carga de documentos (ETAPA 2 → 3)
router.post(
  '/:id/finalizar-carga',
  authorize(['PROVEEDOR', 'ADMIN']),
  auditoriasController.finalizarCarga
);

// ===== RUTAS PARA AUDITORES =====

// Evaluar sección (ETAPA 4)
router.post(
  '/:id/evaluar-seccion',
  authorize(['AUDITOR', 'ADMIN']),
  auditoriasController.evaluarSeccion
);

// Programar visita presencial (ETAPA 5)
router.post(
  '/:id/programar-visita',
  authorize(['AUDITOR', 'ADMIN']),
  auditoriasController.programarVisita
);

// Completar visita (ETAPA 6)
router.post(
  '/:id/completar-visita',
  authorize(['AUDITOR', 'ADMIN']),
  upload.array('archivos', 10),
  auditoriasController.completarVisita
);

// Generar informe (ETAPA 7)
router.post(
  '/:id/generar-informe',
  authorize(['AUDITOR', 'ADMIN']),
  auditoriasController.generarInforme
);

// ===== RUTAS PARA ADMINISTRADORES =====

// Crear nueva auditoría (ETAPA 1)
router.post(
  '/',
  authorize(['ADMIN']),
  auditoriasController.crear
);

// Cerrar auditoría (ETAPA 8)
router.post(
  '/:id/cerrar',
  authorize(['ADMIN']),
  auditoriasController.cerrarAuditoria
);

// ===== RUTAS ESPECIALES =====

// Descargar documento
router.get(
  '/:id/documentos/:documentoId/descargar',
  async (req, res) => {
    try {
      const { documentoId } = req.params;
      const Documento = require('./models/Documento.model');
      
      const documento = await Documento.findByPk(documentoId);
      
      if (!documento) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }
      
      // Verificar permisos según rol
      // TODO: Implementar verificación de permisos
      
      res.download(documento.ruta_archivo, documento.nombre_archivo);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Reenviar notificación
router.post(
  '/:id/reenviar-notificacion',
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tipo } = req.body; // 'inicio', 'recordatorio', 'resultado'
      
      // TODO: Implementar reenvío de notificaciones
      
      res.json({
        success: true,
        message: 'Notificación reenviada'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Asignar auditor
router.post(
  '/:id/asignar-auditor',
  authorize(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { auditor_id } = req.body;
      
      const Auditoria = require('./models/Auditoria.model');
      const auditoria = await Auditoria.findByPk(id);
      
      if (!auditoria) {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }
      
      await auditoria.update({ auditor_asignado_id: auditor_id });
      
      res.json({
        success: true,
        message: 'Auditor asignado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Marcar excepción
router.post(
  '/:id/marcar-excepcion',
  authorize(['ADMIN', 'AUDITOR']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { justificacion } = req.body;
      
      const Auditoria = require('./models/Auditoria.model');
      const auditoria = await Auditoria.findByPk(id);
      
      if (!auditoria) {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }
      
      await auditoria.update({
        tiene_excepciones: true,
        justificacion_excepcion: justificacion
      });
      
      res.json({
        success: true,
        message: 'Excepción registrada'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
