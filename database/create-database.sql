-- Script para crear base de datos en MySQL de XAMPP
-- Ejecutar en phpMyAdmin o cliente MySQL

-- Crear base de datos principal
CREATE DATABASE IF NOT EXISTS portal_auditorias 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Crear base de datos para testing
CREATE DATABASE IF NOT EXISTS portal_auditorias_test 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos principal
USE portal_auditorias;

-- Crear usuario específico (opcional, por defecto usa root sin password)
-- GRANT ALL PRIVILEGES ON portal_auditorias.* TO 'portal_user'@'localhost';
-- GRANT ALL PRIVILEGES ON portal_auditorias_test.* TO 'portal_user'@'localhost';

-- Mostrar bases de datos creadas
SHOW DATABASES LIKE 'portal_auditorias%';

SELECT 'Base de datos portal_auditorias creada exitosamente' AS status;
