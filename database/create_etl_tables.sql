-- Script de creación de tablas ETL
-- Portal de Auditorías Técnicas
-- Ejecutar en la base de datos: portal_auditorias

USE portal_auditorias;

-- 1. Tabla: validation_rules
CREATE TABLE IF NOT EXISTS `validation_rules` (
  `id` CHAR(36) BINARY NOT NULL DEFAULT (UUID()),
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` TEXT,
  `codigo_regla` VARCHAR(50) NOT NULL,
  `campo_objetivo` VARCHAR(100) NOT NULL,
  `tipo_validacion` ENUM('FORMATO', 'RANGO', 'LISTA', 'REGEX', 'LOGICA', 'DEPENDENCIA') NOT NULL,
  `operador` VARCHAR(20),
  `valor_esperado` TEXT,
  `valor_minimo` DECIMAL(10,2),
  `valor_maximo` DECIMAL(10,2),
  `severidad` ENUM('ERROR', 'ADVERTENCIA', 'INFORMACION') NOT NULL DEFAULT 'ADVERTENCIA',
  `bloquea_procesamiento` BOOLEAN DEFAULT FALSE,
  `mensaje_error` TEXT,
  `mensaje_sugerencia` TEXT,
  `activa` BOOLEAN DEFAULT TRUE,
  `aplicar_en` ENUM('TODOS', 'SITIO', 'PROVEEDOR', 'CUSTOM') DEFAULT 'TODOS',
  `proveedores_especificos` JSON,
  `sitios_especificos` JSON,
  `campos_dependientes` JSON,
  `condiciones_aplicacion` JSON,
  `auto_correccion` BOOLEAN DEFAULT FALSE,
  `logica_correccion` JSON,
  `categoria` VARCHAR(50),
  `version` VARCHAR(20) DEFAULT '1.0',
  `creado_por` CHAR(36) BINARY,
  `modificado_por` CHAR(36) BINARY,
  `veces_aplicada` INT DEFAULT 0,
  `veces_fallida` INT DEFAULT 0,
  `ultima_aplicacion` DATETIME,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `eliminado_en` DATETIME,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_codigo_regla` (`codigo_regla`),
  INDEX `idx_campo_objetivo` (`campo_objetivo`),
  INDEX `idx_categoria` (`categoria`),
  INDEX `idx_activa` (`activa`),
  INDEX `idx_severidad` (`severidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla: etl_jobs
CREATE TABLE IF NOT EXISTS `etl_jobs` (
  `id` CHAR(36) BINARY NOT NULL DEFAULT (UUID()),
  `auditoria_id` CHAR(36) BINARY NOT NULL,
  `documento_id` CHAR(36) BINARY,
  `usuario_id` CHAR(36) BINARY NOT NULL,
  `tipo_archivo` ENUM('EXCEL', 'CSV', 'MANUAL') NOT NULL,
  `nombre_archivo` VARCHAR(255),
  `tamaño_archivo_bytes` BIGINT,
  `estado` ENUM('INICIADO', 'PARSEANDO', 'NORMALIZANDO', 'VALIDANDO', 'SCORING', 'COMPLETADO', 'ERROR', 'CANCELADO') NOT NULL DEFAULT 'INICIADO',
  `total_registros` INT DEFAULT 0,
  `registros_procesados` INT DEFAULT 0,
  `registros_validos` INT DEFAULT 0,
  `registros_con_errores` INT DEFAULT 0,
  `registros_con_advertencias` INT DEFAULT 0,
  `progreso_porcentaje` DECIMAL(5,2) DEFAULT 0.00,
  `fecha_inicio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` DATETIME,
  `tiempo_procesamiento_ms` BIGINT,
  `tiempo_estimado_restante_ms` BIGINT,
  `configuracion` JSON,
  `resultados` JSON,
  `error_detalle` JSON,
  `logs_procesamiento` JSON,
  `score_calidad_promedio` DECIMAL(5,2),
  `version_etl` VARCHAR(20) DEFAULT '1.0',
  `ip_origen` VARCHAR(45),
  `user_agent` TEXT,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `eliminado_en` DATETIME,
  PRIMARY KEY (`id`),
  INDEX `idx_auditoria_id` (`auditoria_id`),
  INDEX `idx_usuario_id` (`usuario_id`),
  INDEX `idx_estado` (`estado`),
  INDEX `idx_fecha_inicio` (`fecha_inicio`),
  INDEX `idx_tipo_archivo` (`tipo_archivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla: parque_informatico
CREATE TABLE IF NOT EXISTS `parque_informatico` (
  `id` CHAR(36) BINARY NOT NULL DEFAULT (UUID()),
  `auditoria_id` CHAR(36) BINARY NOT NULL,
  `job_id` CHAR(36) BINARY,
  `documento_origen_id` CHAR(36) BINARY,
  `procesado_por` CHAR(36) BINARY,
  `procesado_en` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `version_etl` VARCHAR(20) DEFAULT '1.0',
  
  -- Metadatos de auditoría
  `audit_id` VARCHAR(50),
  `audit_date` DATE,
  `audit_cycle` VARCHAR(20),
  `audit_version` VARCHAR(20),
  
  -- Identificación
  `proveedor` VARCHAR(255) NOT NULL,
  `sitio` VARCHAR(100) NOT NULL,
  `atencion` VARCHAR(50),
  `usuario_id` VARCHAR(100) NOT NULL,
  `hostname` VARCHAR(100),
  
  -- Hardware - CPU
  `cpu_brand` VARCHAR(50),
  `cpu_model` VARCHAR(100),
  `cpu_speed_ghz` DECIMAL(3,2),
  `cpu_cores` INT,
  
  -- Hardware - Memoria
  `ram_gb` INT,
  `ram_type` VARCHAR(50),
  
  -- Hardware - Almacenamiento
  `disk_type` VARCHAR(50),
  `disk_capacity_gb` INT,
  
  -- Software - OS
  `os_name` VARCHAR(100),
  `os_version` VARCHAR(100),
  `os_architecture` VARCHAR(20),
  
  -- Software - Navegador
  `browser_name` VARCHAR(50),
  `browser_version` VARCHAR(50),
  
  -- Software - Antivirus
  `antivirus_brand` VARCHAR(100),
  `antivirus_version` VARCHAR(50),
  `antivirus_updated` BOOLEAN,
  
  -- Periféricos
  `headset_brand` VARCHAR(100),
  `headset_model` VARCHAR(100),
  
  -- Conectividad
  `isp_name` VARCHAR(100),
  `connection_type` VARCHAR(50),
  `speed_download_mbps` INT,
  `speed_upload_mbps` INT,
  
  -- Validación y scoring
  `estado_etl` ENUM('PENDIENTE', 'VALIDADO', 'ERROR', 'ADVERTENCIA') DEFAULT 'PENDIENTE',
  `nivel_cumplimiento` ENUM('CUMPLE', 'CUMPLE_PARCIAL', 'NO_CUMPLE') DEFAULT 'CUMPLE_PARCIAL',
  `score_hardware` DECIMAL(5,2) DEFAULT 0.00,
  `score_software` DECIMAL(5,2) DEFAULT 0.00,
  `score_conectividad` DECIMAL(5,2) DEFAULT 0.00,
  `score_total` DECIMAL(5,2) DEFAULT 0.00,
  `observaciones` TEXT,
  `recomendaciones` JSON,
  `metadatos_procesamiento` JSON,
  
  -- Auditoría
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `eliminado_en` DATETIME,
  
  PRIMARY KEY (`id`),
  INDEX `idx_auditoria_pi` (`auditoria_id`),
  INDEX `idx_job_pi` (`job_id`),
  INDEX `idx_proveedor_sitio` (`proveedor`, `sitio`),
  INDEX `idx_usuario` (`usuario_id`),
  INDEX `idx_estado_etl` (`estado_etl`),
  INDEX `idx_nivel_cumplimiento` (`nivel_cumplimiento`),
  INDEX `idx_score_total` (`score_total`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla: etl_errors
CREATE TABLE IF NOT EXISTS `etl_errors` (
  `id` CHAR(36) BINARY NOT NULL DEFAULT (UUID()),
  `job_id` CHAR(36) BINARY NOT NULL,
  `parque_informatico_id` CHAR(36) BINARY,
  `tipo_error` ENUM('PARSEO', 'VALIDACION', 'NORMALIZACION', 'SCORING', 'SISTEMA') NOT NULL,
  `severidad` ENUM('ERROR', 'ADVERTENCIA', 'INFORMACION') NOT NULL DEFAULT 'ERROR',
  `codigo_error` VARCHAR(50),
  `campo_afectado` VARCHAR(100),
  `valor_original` TEXT,
  `valor_esperado` TEXT,
  `mensaje` TEXT NOT NULL,
  `descripcion_detallada` TEXT,
  `linea_archivo` INT,
  `columna_archivo` VARCHAR(10),
  `regla_validacion_id` CHAR(36) BINARY,
  `puede_ignorarse` BOOLEAN DEFAULT FALSE,
  `fue_corregido` BOOLEAN DEFAULT FALSE,
  `correccion_aplicada` TEXT,
  `contexto_adicional` JSON,
  `stack_trace` TEXT,
  `fecha_ocurrencia` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `eliminado_en` DATETIME,
  PRIMARY KEY (`id`),
  INDEX `idx_job_id` (`job_id`),
  INDEX `idx_parque_informatico_id` (`parque_informatico_id`),
  INDEX `idx_tipo_error` (`tipo_error`),
  INDEX `idx_severidad` (`severidad`),
  INDEX `idx_campo_afectado` (`campo_afectado`),
  INDEX `idx_fecha_ocurrencia` (`fecha_ocurrencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunas reglas de validación por defecto
INSERT INTO `validation_rules` (`nombre`, `descripcion`, `codigo_regla`, `campo_objetivo`, `tipo_validacion`, `operador`, `valor_minimo`, `severidad`, `mensaje_error`, `categoria`) VALUES
('RAM Mínima', 'Verificar que la RAM sea al menos 4GB', 'RAM_MIN_4GB', 'ram_gb', 'RANGO', 'gte', 4, 'ERROR', 'La memoria RAM debe ser de al menos 4GB', 'hardware'),
('CPU Velocidad Mínima', 'Verificar velocidad mínima del procesador', 'CPU_MIN_SPEED', 'cpu_speed_ghz', 'RANGO', 'gte', 2.0, 'ADVERTENCIA', 'Se recomienda un procesador de al menos 2.0 GHz', 'hardware'),
('OS Soportado', 'Verificar sistema operativo soportado', 'OS_SUPPORTED', 'os_name', 'LISTA', 'in', NULL, 'ERROR', 'Sistema operativo no soportado', 'software');

-- Mensaje de confirmación
SELECT 'Tablas ETL creadas exitosamente' AS mensaje;
