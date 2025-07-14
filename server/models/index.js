/**
 * Configuración de Modelos y Relaciones
 * Portal de Auditorías Técnicas
 */

const { initializeDatabase } = require('../config/database');

// Importar definiciones de modelos
const defineUsuario = require('../domains/auth/models/Usuario.model');
const defineProveedor = require('../domains/entities/proveedores/Proveedor.model');
const defineAuditoria = require('../domains/auditorias/models/Auditoria.model');
const defineDocumento = require('../domains/auditorias/models/Documento.model');
const defineParqueInformatico = require('../domains/etl/models/ParqueInformatico.model');

// Variables globales para modelos
let Usuario, Proveedor, Auditoria, Documento, ParqueInformatico;
let sequelize = null;
let modelsInitialized = false;

/**
 * Inicializar modelos con instancia de Sequelize
 */
const initializeModels = async () => {
  if (modelsInitialized) {
    return { Usuario, Proveedor, Auditoria, Documento, ParqueInformatico };
  }

  try {
    console.log('🔧 Inicializando modelos...');
    
    // Obtener instancia de Sequelize
    sequelize = await initializeDatabase();
    
    // Definir modelos
    Usuario = defineUsuario(sequelize);
    Proveedor = defineProveedor(sequelize);
    Auditoria = defineAuditoria(sequelize);
    Documento = defineDocumento(sequelize);
    ParqueInformatico = defineParqueInformatico(sequelize);
    
    // Configurar relaciones
    setupAssociations();
    
    modelsInitialized = true;
    console.log('✅ Modelos inicializados correctamente');
    
    return { Usuario, Proveedor, Auditoria, Documento, ParqueInformatico };
    
  } catch (error) {
    console.error('❌ Error inicializando modelos:', error.message);
    throw error;
  }
};

/**
 * Configurar relaciones entre modelos
 */
const setupAssociations = () => {
  console.log('🔗 Configurando relaciones entre modelos...');

  // === RELACIONES USUARIO ===
  
  // Usuario puede crear otros usuarios
  Usuario.belongsTo(Usuario, {
    foreignKey: 'creado_por',
    as: 'CreadorUsuario',
    allowNull: true
  });
  
  Usuario.belongsTo(Usuario, {
    foreignKey: 'actualizado_por',
    as: 'ActualizadorUsuario',
    allowNull: true
  });

  // === RELACIONES PROVEEDOR ===
  
  // Proveedor es creado/actualizado por Usuario
  Proveedor.belongsTo(Usuario, {
    foreignKey: 'creado_por',
    as: 'CreadorProveedor',
    allowNull: true
  });
  
  Proveedor.belongsTo(Usuario, {
    foreignKey: 'actualizado_por',
    as: 'ActualizadorProveedor',
    allowNull: true
  });
  
  // Proveedor tiene muchas auditorías
  Proveedor.hasMany(Auditoria, {
    foreignKey: 'proveedor_id',
    as: 'Auditorias'
  });

  // === RELACIONES AUDITORIA ===
  
  // Auditoría pertenece a un Proveedor
  Auditoria.belongsTo(Proveedor, {
    foreignKey: 'proveedor_id',
    as: 'Proveedor'
  });
  
  // Auditoría tiene auditores (principal y secundario)
  Auditoria.belongsTo(Usuario, {
    foreignKey: 'auditor_principal_id',
    as: 'AuditorPrincipal'
  });
  
  Auditoria.belongsTo(Usuario, {
    foreignKey: 'auditor_secundario_id',
    as: 'AuditorSecundario'
  });
  
  // Auditoría es creada/actualizada por Usuario
  Auditoria.belongsTo(Usuario, {
    foreignKey: 'creado_por',
    as: 'CreadorAuditoria'
  });
  
  Auditoria.belongsTo(Usuario, {
    foreignKey: 'actualizado_por',
    as: 'ActualizadorAuditoria'
  });
  
  // Auditoría tiene muchos documentos
  Auditoria.hasMany(Documento, {
    foreignKey: 'auditoria_id',
    as: 'Documentos'
  });
  
  // Auditoría tiene registros de parque informático
  Auditoria.hasMany(ParqueInformatico, {
    foreignKey: 'auditoria_id',
    as: 'ParqueInformatico'
  });

  // === RELACIONES DOCUMENTO ===
  
  // Documento pertenece a una Auditoría
  Documento.belongsTo(Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'Auditoria'
  });
  
  // Documento es subido por Usuario
  Documento.belongsTo(Usuario, {
    foreignKey: 'subido_por',
    as: 'SubidoPor'
  });
  
  // Documento es validado por Usuario
  Documento.belongsTo(Usuario, {
    foreignKey: 'validado_por',
    as: 'ValidadoPor'
  });
  
  // Documento es actualizado por Usuario
  Documento.belongsTo(Usuario, {
    foreignKey: 'actualizado_por',
    as: 'ActualizadoPor'
  });
  
  // Documento puede tener versiones (padre-hijo)
  Documento.belongsTo(Documento, {
    foreignKey: 'documento_padre_id',
    as: 'DocumentoPadre'
  });
  
  Documento.hasMany(Documento, {
    foreignKey: 'documento_padre_id',
    as: 'Versiones'
  });
  
  // Documento puede generar registros de parque informático
  Documento.hasMany(ParqueInformatico, {
    foreignKey: 'documento_origen_id',
    as: 'RegistrosParque'
  });

  // === RELACIONES PARQUE INFORMÁTICO ===
  
  // ParqueInformatico pertenece a una Auditoría
  ParqueInformatico.belongsTo(Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'Auditoria'
  });
  
  // ParqueInformatico proviene de un Documento
  ParqueInformatico.belongsTo(Documento, {
    foreignKey: 'documento_origen_id',
    as: 'DocumentoOrigen'
  });
  
  // ParqueInformatico es procesado por Usuario
  ParqueInformatico.belongsTo(Usuario, {
    foreignKey: 'procesado_por',
    as: 'ProcesadoPor'
  });

  // === RELACIONES INVERSAS PARA USUARIO ===
  
  // Usuario puede ser auditor principal en muchas auditorías
  Usuario.hasMany(Auditoria, {
    foreignKey: 'auditor_principal_id',
    as: 'AuditoriasPrincipales'
  });
  
  // Usuario puede ser auditor secundario en muchas auditorías
  Usuario.hasMany(Auditoria, {
    foreignKey: 'auditor_secundario_id',
    as: 'AuditoriasSecundarias'
  });
  
  // Usuario puede subir muchos documentos
  Usuario.hasMany(Documento, {
    foreignKey: 'subido_por',
    as: 'DocumentosSubidos'
  });
  
  // Usuario puede validar muchos documentos
  Usuario.hasMany(Documento, {
    foreignKey: 'validado_por',
    as: 'DocumentosValidados'
  });
  
  // Usuario puede procesar muchos registros de parque informático
  Usuario.hasMany(ParqueInformatico, {
    foreignKey: 'procesado_por',
    as: 'RegistrosProcesados'
  });

  console.log('✅ Relaciones entre modelos configuradas correctamente');
};

/**
 * Función para obtener todos los modelos configurados
 */
const getModels = async () => {
  if (!modelsInitialized) {
    await initializeModels();
  }
  
  return {
    Usuario,
    Proveedor,
    Auditoria,
    Documento,
    ParqueInformatico,
    sequelize
  };
};

/**
 * Función para sincronizar todos los modelos
 */
const syncAllModels = async (options = {}) => {
  try {
    if (!modelsInitialized) {
      await initializeModels();
    }
    
    const { force = false, alter = false } = options;
    
    console.log('🔄 Sincronizando modelos con base de datos...');
    
    // Orden específico para evitar problemas de claves foráneas
    const modelsInOrder = [
      { model: Usuario, name: 'Usuario' },
      { model: Proveedor, name: 'Proveedor' }, 
      { model: Auditoria, name: 'Auditoria' },
      { model: Documento, name: 'Documento' },
      { model: ParqueInformatico, name: 'ParqueInformatico' }
    ];
    
    for (const { model, name } of modelsInOrder) {
      await model.sync({ force, alter });
      console.log(`✅ Modelo ${name} sincronizado`);
    }
    
    console.log('✅ Todos los modelos sincronizados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error sincronizando modelos:', error.message);
    throw error;
  }
};

/**
 * Función para crear datos de prueba (solo desarrollo)
 */
const createSeedData = async () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env !== 'development') {
    console.log('⚠️ Seed data solo disponible en desarrollo');
    return false;
  }
  
  try {
    if (!modelsInitialized) {
      await initializeModels();
    }
    
    console.log('🌱 Creando datos de prueba...');
    
    // Crear usuario administrador
    const adminExists = await Usuario.findOne({ where: { email: 'admin@portal-auditorias.com' } });
    
    if (!adminExists) {
      const admin = await Usuario.create({
        email: 'admin@portal-auditorias.com',
        password_hash: 'admin123', // Se encriptará automáticamente
        nombres: 'Administrador',
        apellidos: 'Sistema',
        documento: '12345678',
        rol: 'ADMIN',
        estado: 'ACTIVO',
        email_verificado: true,
        email_verificado_en: new Date()
      });
      
      console.log('👤 Usuario administrador creado');
      
      // Crear usuario auditor
      const auditor = await Usuario.create({
        email: 'auditor@portal-auditorias.com',
        password_hash: 'auditor123',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez Auditor',
        documento: '87654321',
        rol: 'AUDITOR',
        estado: 'ACTIVO',
        email_verificado: true,
        email_verificado_en: new Date(),
        creado_por: admin.id
      });
      
      console.log('👤 Usuario auditor creado');
      
      // Crear proveedor de prueba
      const proveedor = await Proveedor.create({
        razon_social: 'CallCenter Tecnológico S.A.S.',
        nombre_comercial: 'TechCall',
        nit: '900123456-7',
        email_principal: 'contacto@techcall.com',
        telefono_principal: '+57 1 234-5678',
        direccion: 'Calle 100 #50-20 Piso 15',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        pais: 'Colombia',
        servicios_ofrecidos: ['inbound', 'outbound', 'chat', 'email'],
        capacidad_agentes: 500,
        certificaciones: ['ISO 9001', 'ISO 27001'],
        estado: 'ACTIVO',
        representante_legal: {
          nombres: 'María Elena',
          apellidos: 'Rodríguez',
          documento: '52123456',
          telefono: '+57 300 123-4567',
          email: 'maria.rodriguez@techcall.com'
        },
        contacto_tecnico: {
          nombres: 'Carlos Andrés',
          apellidos: 'Gómez',
          documento: '80987654',
          telefono: '+57 310 987-6543',
          email: 'carlos.gomez@techcall.com'
        },
        creado_por: admin.id
      });
      
      console.log('🏢 Proveedor de prueba creado');
      
      // Crear usuario proveedor
      const proveedorUser = await Usuario.create({
        email: 'proveedor@callcenterdemo.com',
        password_hash: 'proveedor123',
        nombres: 'María Fernanda',
        apellidos: 'González',
        documento: '98765432',
        rol: 'PROVEEDOR',
        estado: 'ACTIVO',
        email_verificado: true,
        email_verificado_en: new Date(),
        creado_por: admin.id
      });
      
      console.log('👤 Usuario proveedor creado');
      
      // Crear auditoría de prueba
      const auditoria = await Auditoria.create({
        titulo: 'Auditoría Técnica 2025-S1 - TechCall',
        descripcion: 'Auditoría semestral de infraestructura tecnológica',
        codigo_auditoria: 'AUD-202501-DEMO1',
        tipo_auditoria: 'INICIAL',
        proveedor_id: proveedor.id,
        auditor_principal_id: auditor.id,
        fecha_programada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 7 días
        fecha_fin_programada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // En 30 días
        version_pliego: '2025-v1',
        modalidad: 'HIBRIDA',
        creado_por: admin.id
      });
      
      console.log('📋 Auditoría de prueba creada');
      
      console.log('\n✅ Datos de prueba creados correctamente');
      console.log('📋 Credenciales de acceso:');
      console.log('   👤 admin@portal-auditorias.com (password: admin123)');
      console.log('   🔍 auditor@portal-auditorias.com (password: auditor123)');
      console.log('   🏢 proveedor@callcenterdemo.com (password: proveedor123)');
      
      return true;
    } else {
      console.log('ℹ️ Datos de prueba ya existen');
      return false;
    }
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error.message);
    throw error;
  }
};

// Exportar funciones principales
module.exports = {
  initializeModels,
  setupAssociations,
  getModels,
  syncAllModels,
  createSeedData,
  
  // Exportar modelos directamente para compatibilidad (solo después de inicializar)
  get Usuario() { return Usuario; },
  get Proveedor() { return Proveedor; },
  get Auditoria() { return Auditoria; },
  get Documento() { return Documento; },
  get ParqueInformatico() { return ParqueInformatico; }
};
