-- =====================================================
-- PORTAL DE AUDITORÍAS TÉCNICAS
-- Script de Inicialización de Base de Datos MySQL
-- =====================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS portal_auditorias 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE portal_auditorias;

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'AUDITOR', 'PROVEEDOR', 'CONSULTOR') NOT NULL DEFAULT 'PROVEEDOR',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_login DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: auditorias
-- =====================================================
CREATE TABLE IF NOT EXISTS auditorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    proveedor_id INT NOT NULL,
    auditor_id INT NOT NULL,
    estado ENUM('PLANIFICACION', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA') NOT NULL DEFAULT 'PLANIFICACION',
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    configuracion JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    FOREIGN KEY (proveedor_id) REFERENCES usuarios(id),
    FOREIGN KEY (auditor_id) REFERENCES usuarios(id),
    INDEX idx_proveedor (proveedor_id),
    INDEX idx_auditor (auditor_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: documentos
-- =====================================================
CREATE TABLE IF NOT EXISTS documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auditoria_id INT NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(100) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamano_bytes INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    hash_archivo VARCHAR(64) NULL,
    subido_por INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    FOREIGN KEY (auditoria_id) REFERENCES auditorias(id),
    FOREIGN KEY (subido_por) REFERENCES usuarios(id),
    INDEX idx_auditoria (auditoria_id),
    INDEX idx_tipo (tipo_documento),
    INDEX idx_subido_por (subido_por)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: analisis_ia
-- =====================================================
CREATE TABLE IF NOT EXISTS analisis_ia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auditoria_id INT NOT NULL,
    documento_id INT NULL,
    usuario_id INT NOT NULL,
    tipo_analisis ENUM('document_compliance', 'security_analysis', 'infrastructure_review', 'image_analysis', 'batch_analysis') NOT NULL,
    modelo_ia VARCHAR(100) NOT NULL DEFAULT 'llama3.2:1b',
    criterios_aplicados JSON NULL,
    contenido_original LONGTEXT NULL,
    prompt_utilizado TEXT NULL,
    respuesta_ia LONGTEXT NOT NULL,
    resultado_estructurado JSON NULL,
    score_cumplimiento DECIMAL(5,2) NULL,
    score_seguridad DECIMAL(5,2) NULL,
    score_calidad DECIMAL(5,2) NULL,
    score_completitud DECIMAL(5,2) NULL,
    score_total DECIMAL(5,2) NOT NULL,
    estado ENUM('INICIADO', 'PROCESANDO', 'COMPLETADO', 'ERROR', 'CANCELADO') NOT NULL DEFAULT 'INICIADO',
    confianza_resultado DECIMAL(5,2) NULL,
    tiempo_procesamiento_ms INT NULL,
    tokens_procesados INT NULL,
    tokens_por_segundo DECIMAL(10,2) NULL,
    error_detalle JSON NULL,
    fallback_usado BOOLEAN NOT NULL DEFAULT FALSE,
    revisado_por INT NULL,
    comentarios_revision TEXT NULL,
    estado_revision ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REQUIERE_AJUSTES') NOT NULL DEFAULT 'PENDIENTE',
    fecha_revision DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    FOREIGN KEY (auditoria_id) REFERENCES auditorias(id),
    FOREIGN KEY (documento_id) REFERENCES documentos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (revisado_por) REFERENCES usuarios(id),
    INDEX idx_auditoria_tipo (auditoria_id, tipo_analisis),
    INDEX idx_estado (estado),
    INDEX idx_score_total (score_total),
    INDEX idx_modelo_fecha (modelo_ia, created_at),
    INDEX idx_usuario_revision (usuario_id, estado_revision)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: criterios_scoring
-- =====================================================
CREATE TABLE IF NOT EXISTS criterios_scoring (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    categoria ENUM('CUMPLIMIENTO', 'SEGURIDAD', 'CALIDAD', 'COMPLETITUD', 'PERFORMANCE', 'INFRAESTRUCTURA') NOT NULL,
    tipo_analisis ENUM('document_compliance', 'security_analysis', 'infrastructure_review', 'image_analysis', 'batch_analysis') NOT NULL,
    dominio_tecnico ENUM('HARDWARE', 'SOFTWARE', 'REDES', 'SEGURIDAD', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    peso DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    valor_minimo DECIMAL(5,2) NOT NULL DEFAULT 0,
    valor_objetivo DECIMAL(5,2) NOT NULL DEFAULT 80,
    es_critico BOOLEAN NOT NULL DEFAULT FALSE,
    es_obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
    patron_deteccion TEXT NULL,
    prompt_evaluacion TEXT NULL,
    metrica_evaluacion JSON NULL,
    reglas_validacion JSON NULL,
    condiciones_aplicacion JSON NULL,
    valores_referencia JSON NULL,
    mensajes_feedback JSON NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    version VARCHAR(10) NOT NULL DEFAULT '1.0',
    fecha_vigencia_desde DATE NULL,
    fecha_vigencia_hasta DATE NULL,
    creado_por INT NOT NULL,
    modificado_por INT NULL,
    tags VARCHAR(500) NULL,
    observaciones TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (modificado_por) REFERENCES usuarios(id),
    INDEX idx_categoria_tipo (categoria, tipo_analisis),
    INDEX idx_activo_obligatorio (activo, es_obligatorio),
    INDEX idx_unique_codigo (codigo),
    INDEX idx_dominio_peso (dominio_tecnico, peso),
    INDEX idx_vigencia (fecha_vigencia_desde, fecha_vigencia_hasta)
) ENGINE=InnoDB;

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES 
('Admin Sistema', 'admin@portal-auditorias.com', '$2b$10$example.hash.change.in.production', 'ADMIN'),
('Auditor Principal', 'auditor@portal-auditorias.com', '$2b$10$example.hash.change.in.production', 'AUDITOR'),
('Proveedor Demo', 'proveedor@empresa.com', '$2b$10$example.hash.change.in.production', 'PROVEEDOR')
ON DUPLICATE KEY UPDATE id=id;

-- Criterios de scoring básicos
INSERT INTO criterios_scoring 
(nombre, codigo, descripcion, categoria, tipo_analisis, dominio_tecnico, peso, valor_minimo, valor_objetivo, es_obligatorio, creado_por) 
VALUES 
('Completitud de Hardware', 'COMP_HW_001', 'Evalúa completitud de especificaciones de hardware', 'COMPLETITUD', 'document_compliance', 'HARDWARE', 2.0, 70, 90, TRUE, 1),
('Configuración de Seguridad', 'SEG_SIS_001', 'Verifica configuraciones básicas de seguridad', 'SEGURIDAD', 'security_analysis', 'SEGURIDAD', 3.0, 80, 95, TRUE, 1),
('Calidad de Conectividad', 'CAL_RED_001', 'Evalúa calidad y estabilidad de conexión de red', 'CALIDAD', 'infrastructure_review', 'REDES', 2.5, 75, 90, TRUE, 1),
('Compatibilidad de Software', 'COMP_SW_001', 'Verifica compatibilidad del software', 'CUMPLIMIENTO', 'document_compliance', 'SOFTWARE', 2.0, 85, 95, TRUE, 1)
ON DUPLICATE KEY UPDATE id=id;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de tablas creadas
SELECT 
    TABLE_NAME as 'Tabla',
    TABLE_ROWS as 'Registros',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Tamaño (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'portal_auditorias'
ORDER BY TABLE_NAME;

-- Mostrar usuarios creados
SELECT id, nombre, email, rol, activo, created_at 
FROM usuarios 
WHERE deleted_at IS NULL;

-- Mostrar criterios de scoring
SELECT id, codigo, nombre, categoria, tipo_analisis, activo 
FROM criterios_scoring 
WHERE deleted_at IS NULL;

COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Cambiar password_hash por hashes reales usando bcrypt
-- 2. Configurar usuarios específicos para tu entorno
-- 3. Ajustar criterios de scoring según requerimientos
-- 4. Considerar índices adicionales según patrones de uso
-- =====================================================
