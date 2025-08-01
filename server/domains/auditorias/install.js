#!/usr/bin/env node

/**
 * Script de instalación del Módulo de Auditorías
 * Portal de Auditorías Técnicas
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🚀 INSTALACIÓN DEL MÓDULO DE AUDITORÍAS');
console.log('=====================================\n');

const instalarModulo = async () => {
  try {
    console.log('📋 Verificando estructura del proyecto...');
    await verificarEstructura();
    
    console.log('📦 Creando directorios necesarios...');
    await crearDirectorios();
    
    console.log('🔧 Configurando base de datos...');
    await configurarBaseDatos();
    
    console.log('🌐 Configurando rutas...');
    await configurarRutas();
    
    console.log('📱 Configurando frontend...');
    await configurarFrontend();
    
    console.log('✅ MÓDULO DE AUDITORÍAS INSTALADO CORRECTAMENTE!\n');
    mostrarInstrucciones();
    
  } catch (error) {
    console.error('❌ Error durante la instalación:', error.message);
    process.exit(1);
  }
};

const verificarEstructura = async () => {
  const directoriosRequeridos = [
    'server/domains',
    'client/src/domains',
    'uploads'
  ];
  
  for (const dir of directoriosRequeridos) {
    try {
      await fs.access(dir);
      console.log(`   ✅ ${dir} existe`);
    } catch (error) {
      console.log(`   📁 Creando ${dir}...`);
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

const crearDirectorios = async () => {
  const directorios = [
    'uploads/auditorias',
    'uploads/auditorias/temp',
    'server/domains/auditorias/workflow',
    'server/domains/auditorias/validators',
    'client/src/domains/auditorias/components',
    'client/src/domains/auditorias/services',
    'client/src/domains/auditorias/hooks'
  ];
  
  for (const dir of directorios) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`   📁 ${dir} creado`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
};

const configurarBaseDatos = async () => {
  const sqlScript = `
-- Módulo de Auditorías - Creación de tablas
-- Portal de Auditorías Técnicas

-- Tabla principal de auditorías
CREATE TABLE IF NOT EXISTS auditorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  proveedor_id INT NOT NULL,
  auditor_principal_id INT NOT NULL,
  periodo VARCHAR(10) NOT NULL,
  fecha_programada DATE NOT NULL,
  fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_limite DATE,
  fecha_finalizacion DATETIME NULL,
  estado ENUM(
    'CONFIGURACION',
    'NOTIFICACION',
    'CARGA_PRESENCIAL', 
    'CARGA_PARQUE',
    'VALIDACION_AUTOMATICA',
    'REVISION_AUDITOR',
    'NOTIFICACION_RESULTADOS',
    'COMPLETADA',
    'SUSPENDIDA',
    'CANCELADA'
  ) DEFAULT 'CONFIGURACION',
  etapa_actual INT DEFAULT 1 CHECK (etapa_actual >= 1 AND etapa_actual <= 8),
  alcance TEXT NOT NULL,
  observaciones TEXT,
  umbrales_tecnicos JSON,
  total_puestos_os INT DEFAULT 0,
  total_puestos_ho INT DEFAULT 0,
  sin_home_office BOOLEAN DEFAULT FALSE,
  score_general DECIMAL(5,2),
  cumplimiento_critico BOOLEAN,
  creado_por INT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  version VARCHAR(10) DEFAULT '1.0',
  activa BOOLEAN DEFAULT TRUE,
  archivada BOOLEAN DEFAULT FALSE,
  
  INDEX idx_codigo (codigo),
  INDEX idx_proveedor_periodo (proveedor_id, periodo),
  INDEX idx_estado_etapa (estado, etapa_actual),
  INDEX idx_fecha_programada (fecha_programada),
  INDEX idx_activa_archivada (activa, archivada)
);

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auditoria_id INT NOT NULL,
  seccion ENUM(
    'topologia',
    'cuarto_tecnologia',
    'conectividad', 
    'energia',
    'temperatura_ct',
    'servidores',
    'internet',
    'seguridad_informatica',
    'personal_capacitado',
    'escalamiento',
    'informacion_entorno',
    'parque_hardware',
    'conteo_puestos'
  ) NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tamaño_bytes BIGINT NOT NULL,
  tipo_mime VARCHAR(100) NOT NULL,
  extension VARCHAR(10) NOT NULL,
  version VARCHAR(10) NOT NULL DEFAULT '1.0',
  version_mayor INT NOT NULL DEFAULT 1,
  version_menor INT NOT NULL DEFAULT 0,
  fecha_revision DATE,
  observaciones TEXT,
  estado ENUM('ACTIVO', 'HISTORICO', 'ELIMINADO') DEFAULT 'ACTIVO',
  es_obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
  validado BOOLEAN,
  errores_validacion JSON,
  score_calidad DECIMAL(5,2),
  cargado_por INT NOT NULL,
  fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_carga VARCHAR(45),
  user_agent TEXT,
  hash_archivo VARCHAR(64),
  
  FOREIGN KEY (auditoria_id) REFERENCES auditorias(id) ON DELETE CASCADE,
  INDEX idx_auditoria_seccion_estado (auditoria_id, seccion, estado),
  INDEX idx_seccion_obligatorio (seccion, es_obligatorio),
  INDEX idx_estado_validado (estado, validado),
  INDEX idx_cargado_por (cargado_por),
  INDEX idx_fecha_carga (fecha_carga),
  UNIQUE KEY unique_auditoria_seccion_version (auditoria_id, seccion, version)
);

-- Tabla de bitácora
CREATE TABLE IF NOT EXISTS bitacora (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auditoria_id INT,
  usuario_id INT,
  tipo_accion ENUM(
    'LOGIN', 'LOGOUT', 'AUDITORIA_CREADA', 'AUDITORIA_ACTUALIZADA',
    'DOCUMENTO_CARGADO', 'DOCUMENTO_ACTUALIZADO', 'DOCUMENTO_ELIMINADO',
    'ETAPA_AVANZADA', 'EVALUACION_REALIZADA', 'EVALUACION_ACTUALIZADA',
    'COMENTARIO_AGREGADO', 'CONFIGURACION_ACTUALIZADA',
    'VALIDACION_AUTOMATICA', 'NOTIFICACION_ENVIADA', 'ETL_PROCESADO',
    'IA_SCORING', 'INFORME_GENERADO', 'WORKFLOW_AUTOMATICO',
    'SISTEMA_BACKUP', 'LIMPIEZA_AUTOMATICA', 'USUARIO_CREADO',
    'USUARIO_MODIFICADO', 'PERMISOS_MODIFICADOS', 'PERIODO_CONFIGURADO',
    'SISTEMA_MANTENIMIENTO'
  ) NOT NULL,
  descripcion TEXT NOT NULL,
  seccion_afectada VARCHAR(50),
  modulo_origen VARCHAR(50),
  datos_antes JSON,
  datos_despues JSON,
  ip_origen VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  categoria ENUM('SEGURIDAD', 'OPERACIONAL', 'ADMINISTRATIVO', 'SISTEMA') DEFAULT 'OPERACIONAL',
  severidad ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA') DEFAULT 'BAJA',
  metadatos JSON,
  fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  procesado BOOLEAN DEFAULT FALSE,
  alerta_generada BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (auditoria_id) REFERENCES auditorias(id) ON DELETE CASCADE,
  INDEX idx_auditoria_fecha (auditoria_id, fecha_hora),
  INDEX idx_usuario_tipo (usuario_id, tipo_accion),
  INDEX idx_tipo_fecha (tipo_accion, fecha_hora),
  INDEX idx_categoria_severidad (categoria, severidad),
  INDEX idx_fecha_hora_desc (fecha_hora DESC),
  INDEX idx_ip_origen (ip_origen),
  INDEX idx_procesado_alerta (procesado, alerta_generada)
);

-- Tabla de validaciones
CREATE TABLE IF NOT EXISTS validaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auditoria_id INT NOT NULL,
  documento_id INT,
  tipo_validacion ENUM(
    'FORMATO_ARCHIVO',
    'CONTENIDO_DOCUMENTO',
    'PARQUE_INFORMATICO',
    'COMPLETITUD_SECCION',
    'REGLAS_NEGOCIO', 
    'CONSISTENCIA_DATOS',
    'SCORING_IA',
    'VALIDACION_MANUAL'
  ) NOT NULL,
  seccion VARCHAR(50),
  resultado ENUM('EXITOSO', 'CON_ADVERTENCIAS', 'FALLIDO', 'PENDIENTE') NOT NULL,
  score DECIMAL(5,2),
  errores_criticos JSON,
  advertencias JSON,
  sugerencias JSON,
  total_elementos INT,
  elementos_validos INT,
  elementos_con_errores INT,
  equipos_validados INT,
  equipos_cumplen INT,
  equipos_no_cumplen INT,
  total_os INT,
  total_ho INT,
  ejecutado_por ENUM('SISTEMA', 'USUARIO', 'ETL', 'IA') DEFAULT 'SISTEMA',
  usuario_id INT,
  fecha_ejecucion DATETIME DEFAULT CURRENT_TIMESTAMP,
  tiempo_ejecucion_ms INT,
  reglas_aplicadas JSON,
  umbrales_utilizados JSON,
  detalle_validacion JSON,
  procesado BOOLEAN DEFAULT FALSE,
  notificado BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (auditoria_id) REFERENCES auditorias(id) ON DELETE CASCADE,
  FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
  INDEX idx_auditoria_tipo (auditoria_id, tipo_validacion),
  INDEX idx_documento (documento_id),
  INDEX idx_resultado_score (resultado, score),
  INDEX idx_fecha_ejecucion (fecha_ejecucion),
  INDEX idx_ejecutado_usuario (ejecutado_por, usuario_id),
  INDEX idx_procesado_notificado (procesado, notificado)
);

-- Tabla de evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auditoria_id INT NOT NULL,
  auditor_id INT NOT NULL,
  seccion ENUM(
    'topologia',
    'cuarto_tecnologia',
    'conectividad',
    'energia', 
    'temperatura_ct',
    'servidores',
    'internet',
    'seguridad_informatica',
    'personal_capacitado',
    'escalamiento',
    'informacion_entorno',
    'parque_hardware',
    'evaluacion_general'
  ) NOT NULL,
  calificacion ENUM(
    'CUMPLE',
    'NO_CUMPLE',
    'CUMPLE_CON_OBSERVACIONES',
    'NO_APLICA',
    'PENDIENTE_ACLARACION'
  ) NOT NULL,
  score_numerico DECIMAL(5,2),
  comentarios TEXT,
  observaciones TEXT,
  hallazgos JSON,
  documentos_revisados JSON,
  evidencias_adicionales TEXT,
  nivel_riesgo ENUM('BAJO', 'MEDIO', 'ALTO', 'CRITICO'),
  impacto_negocio ENUM('BAJO', 'MEDIO', 'ALTO'),
  requiere_accion_inmediata BOOLEAN DEFAULT FALSE,
  acciones_recomendadas JSON,
  fecha_limite_accion DATE,
  estado ENUM('BORRADOR', 'COMPLETADA', 'REVISADA', 'APROBADA') DEFAULT 'BORRADOR',
  version VARCHAR(10) DEFAULT '1.0',
  fecha_evaluacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_completado DATETIME,
  tiempo_evaluacion_minutos INT,
  metadatos_tecnicos JSON,
  
  FOREIGN KEY (auditoria_id) REFERENCES auditorias(id) ON DELETE CASCADE,
  INDEX idx_auditoria_seccion (auditoria_id, seccion),
  INDEX idx_auditor_fecha (auditor_id, fecha_evaluacion),
  INDEX idx_calificacion_riesgo (calificacion, nivel_riesgo),
  INDEX idx_estado (estado),
  INDEX idx_accion_inmediata (requiere_accion_inmediata),
  UNIQUE KEY unique_auditoria_seccion_auditor_version (auditoria_id, seccion, auditor_id, version)
);

-- Comentarios de tablas
ALTER TABLE auditorias COMMENT = 'Tabla principal de auditorías técnicas con workflow de 8 etapas';
ALTER TABLE documentos COMMENT = 'Gestión de documentos con control de versiones integrado';
ALTER TABLE bitacora COMMENT = 'Registro detallado de todas las acciones del sistema';
ALTER TABLE validaciones COMMENT = 'Resultados de validaciones automáticas y manuales';
ALTER TABLE evaluaciones COMMENT = 'Evaluaciones realizadas por auditores';

SELECT 'Tablas del módulo de auditorías creadas correctamente' as mensaje;
`;

  try {
    await fs.writeFile('database/auditorias-schema.sql', sqlScript);
    console.log('   📄 Script SQL generado: database/auditorias-schema.sql');
    console.log('   ⚠️  Ejecute manualmente el script SQL en su base de datos MySQL');
  } catch (error) {
    console.log('   ❌ Error generando script SQL:', error.message);
  }
};

const configurarRutas = async () => {
  const routesConfig = `
// Configuración de rutas del módulo de auditorías
// Agregar al archivo principal de rutas del servidor

const auditoriasRoutes = require('./domains/auditorias/routes/auditorias.routes');

// En el archivo server.js, agregar:
app.use('/api/auditorias', auditoriasRoutes);
`;

  try {
    await fs.writeFile('server/INTEGRATION_ROUTES.txt', routesConfig);
    console.log('   📄 Configuración de rutas generada: server/INTEGRATION_ROUTES.txt');
  } catch (error) {
    console.log('   ❌ Error generando configuración de rutas:', error.message);
  }
};

const configurarFrontend = async () => {
  const routerConfig = `
// Configuración de rutas React
// Agregar al archivo de rutas del cliente

import AuditoriasPage from './domains/auditorias/AuditoriasPage';
import AuditoriaDetallePage from './domains/auditorias/AuditoriaDetallePage';

// En el componente Router, agregar:
{
  path: '/auditorias',
  element: <AuditoriasPage />
},
{
  path: '/auditorias/:id',
  element: <AuditoriaDetallePage />
}
`;

  try {
    await fs.writeFile('client/src/INTEGRATION_ROUTES.txt', routerConfig);
    console.log('   📄 Configuración React generada: client/src/INTEGRATION_ROUTES.txt');
  } catch (error) {
    console.log('   ❌ Error generando configuración React:', error.message);
  }
};

const mostrarInstrucciones = () => {
  console.log('📋 PASOS SIGUIENTES:\n');
  console.log('1. 🗄️  EJECUTAR SQL:');
  console.log('   - Abrir database/auditorias-schema.sql');
  console.log('   - Ejecutar en su base de datos MySQL\n');
  
  console.log('2. 🌐 CONFIGURAR RUTAS BACKEND:');
  console.log('   - Revisar server/INTEGRATION_ROUTES.txt');
  console.log('   - Agregar rutas a su archivo server.js principal\n');
  
  console.log('3. 📱 CONFIGURAR RUTAS FRONTEND:');
  console.log('   - Revisar client/src/INTEGRATION_ROUTES.txt');
  console.log('   - Agregar rutas a su Router de React\n');
  
  console.log('4. 🚀 INICIAR SERVIDORES:');
  console.log('   - Backend: cd server && npm run chat:simple');
  console.log('   - Frontend: cd client && npm run dev\n');
  
  console.log('5. 🧪 PROBAR FUNCIONALIDAD:');
  console.log('   - Navegar a http://localhost:3000/auditorias');
  console.log('   - Crear una nueva auditoría');
  console.log('   - Verificar el workflow de 8 etapas\n');
  
  console.log('✅ El módulo de auditorías está listo para usar!');
  console.log('📚 Consultar Claude.md para documentación detallada.');
};

// Ejecutar instalación
instalarModulo().catch(console.error);