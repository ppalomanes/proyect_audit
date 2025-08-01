-- Migración para Chat Real con Persistencia MySQL
-- Portal de Auditorías Técnicas
-- Fecha: 2025-01-23

-- ===================================
-- TABLA: chat_workspaces
-- ===================================
CREATE TABLE `chat_workspaces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` enum('AUDITORIA','PROYECTO','EQUIPO','GENERAL') NOT NULL DEFAULT 'GENERAL',
  `icono` varchar(10) NOT NULL DEFAULT '💬',
  `color` varchar(7) NOT NULL DEFAULT '#7C3AED',
  `auditoria_id` int(11) DEFAULT NULL,
  `creado_por` int(11) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `configuracion` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_id` (`auditoria_id`),
  KEY `idx_creado_por` (`creado_por`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: chat_canales
-- ===================================
CREATE TABLE `chat_canales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `nombre_display` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` enum('GENERAL','DOCUMENTOS','SEGUIMIENTO','PRIVADO','ANUNCIOS') NOT NULL DEFAULT 'GENERAL',
  `icono` varchar(10) NOT NULL DEFAULT '💬',
  `privado` tinyint(1) NOT NULL DEFAULT 0,
  `solo_lectura` tinyint(1) NOT NULL DEFAULT 0,
  `archivado` tinyint(1) NOT NULL DEFAULT 0,
  `creado_por` int(11) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  `configuracion` json DEFAULT NULL,
  `estadisticas` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_workspace_canal` (`workspace_id`,`nombre`),
  KEY `idx_creado_por` (`creado_por`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_privado` (`privado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: chat_mensajes
-- ===================================
CREATE TABLE `chat_mensajes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `canal_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `parent_mensaje_id` int(11) DEFAULT NULL,
  `tipo` enum('TEXTO','ARCHIVO','IMAGEN','SISTEMA','ANUNCIO','THREAD') NOT NULL DEFAULT 'TEXTO',
  `contenido` text DEFAULT NULL,
  `contenido_html` text DEFAULT NULL,
  `archivos` json DEFAULT NULL,
  `metadatos` json DEFAULT NULL,
  `editado` tinyint(1) NOT NULL DEFAULT 0,
  `editado_at` timestamp NULL DEFAULT NULL,
  `eliminado` tinyint(1) NOT NULL DEFAULT 0,
  `eliminado_at` timestamp NULL DEFAULT NULL,
  `fijado` tinyint(1) NOT NULL DEFAULT 0,
  `thread_replies_count` int(11) NOT NULL DEFAULT 0,
  `reacciones` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_canal_id` (`canal_id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_parent_mensaje` (`parent_mensaje_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_eliminado` (`eliminado`),
  KEY `idx_fijado` (`fijado`),
  FULLTEXT KEY `ft_contenido` (`contenido`,`contenido_html`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: chat_participantes_workspace
-- ===================================
CREATE TABLE `chat_participantes_workspace` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `rol` enum('ADMIN','MODERADOR','MIEMBRO','SOLO_LECTURA') NOT NULL DEFAULT 'MIEMBRO',
  `agregado_por` int(11) NOT NULL,
  `ultimo_acceso_at` timestamp NULL DEFAULT NULL,
  `notificaciones_habilitadas` tinyint(1) NOT NULL DEFAULT 1,
  `configuracion_personal` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_workspace_usuario` (`workspace_id`,`usuario_id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_rol` (`rol`),
  KEY `idx_ultimo_acceso` (`ultimo_acceso_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: chat_lecturas_mensaje
-- ===================================
CREATE TABLE `chat_lecturas_mensaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mensaje_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `leido_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_mensaje_usuario` (`mensaje_id`,`usuario_id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_leido_at` (`leido_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: chat_archivos_mensaje
-- ===================================
CREATE TABLE `chat_archivos_mensaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mensaje_id` int(11) NOT NULL,
  `nombre_original` varchar(255) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_archivo` varchar(500) NOT NULL,
  `tipo_mime` varchar(100) NOT NULL,
  `tamaño_bytes` bigint(20) NOT NULL,
  `es_imagen` tinyint(1) NOT NULL DEFAULT 0,
  `thumbnail_path` varchar(500) DEFAULT NULL,
  `descargado_count` int(11) NOT NULL DEFAULT 0,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mensaje_id` (`mensaje_id`),
  KEY `idx_tipo_mime` (`tipo_mime`),
  KEY `idx_es_imagen` (`es_imagen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- DATOS INICIALES PARA DEMO
-- ===================================

-- Workspace de demostración
INSERT INTO `chat_workspaces` (
  `nombre`, 
  `descripcion`, 
  `tipo`, 
  `icono`, 
  `color`, 
  `auditoria_id`, 
  `creado_por`, 
  `configuracion`
) VALUES (
  'Auditoría TechCorp Demo',
  'Workspace de demostración para auditoría técnica',
  'AUDITORIA',
  '📋',
  '#7C3AED',
  NULL,
  1,
  JSON_OBJECT(
    'notificaciones_habilitadas', true,
    'archivos_permitidos', true,
    'max_participantes', 50
  )
);

-- Canales por defecto
INSERT INTO `chat_canales` (
  `workspace_id`,
  `nombre`,
  `nombre_display`,
  `descripcion`,
  `tipo`,
  `icono`,
  `creado_por`,
  `orden`,
  `configuracion`
) VALUES 
(1, 'general', 'General', 'Canal principal para comunicación general', 'GENERAL', '💬', 1, 1,
 JSON_OBJECT(
   'pestanas_habilitadas', JSON_ARRAY('chat', 'lista', 'documentos', 'actividad'),
   'notificaciones_default', true,
   'threads_habilitados', true,
   'reacciones_habilitadas', true
 )),
(1, 'documentos', 'Documentos', 'Compartir y revisar documentos de auditoría', 'DOCUMENTOS', '📄', 1, 2,
 JSON_OBJECT(
   'pestanas_habilitadas', JSON_ARRAY('chat', 'lista', 'tablero', 'documentos'),
   'notificaciones_default', true,
   'threads_habilitados', true,
   'reacciones_habilitadas', true
 )),
(1, 'seguimiento', 'Seguimiento', 'Seguimiento de tareas y progreso', 'SEGUIMIENTO', '📊', 1, 3,
 JSON_OBJECT(
   'pestanas_habilitadas', JSON_ARRAY('chat', 'lista', 'actividad'),
   'notificaciones_default', true,
   'threads_habilitados', true,
   'reacciones_habilitadas', false
 ));

-- Participante admin del workspace
INSERT INTO `chat_participantes_workspace` (
  `workspace_id`,
  `usuario_id`,
  `rol`,
  `agregado_por`,
  `configuracion_personal`
) VALUES (
  1,
  1,
  'ADMIN',
  1,
  JSON_OBJECT(
    'sonidos_habilitados', true,
    'notificaciones_push', true,
    'mostrar_previews', true
  )
);

-- Mensaje de bienvenida
INSERT INTO `chat_mensajes` (
  `canal_id`,
  `usuario_id`,
  `tipo`,
  `contenido`,
  `metadatos`
) VALUES (
  1,
  1,
  'SISTEMA',
  '¡Bienvenidos al sistema de chat real del Portal de Auditorías Técnicas! 🎉

Este workspace está configurado para facilitar la comunicación durante el proceso de auditoría. Pueden usar los diferentes canales según el propósito:

💬 **General**: Comunicación general del equipo
📄 **Documentos**: Compartir y revisar documentos
📊 **Seguimiento**: Seguimiento de tareas y progreso

¡Empecemos a colaborar!',
  JSON_OBJECT(
    'sistema', true,
    'tipo_sistema', 'bienvenida',
    'version_chat', '2.0'
  )
);

-- FIN DE MIGRACIÓN