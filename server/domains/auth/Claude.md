# Claude.md - Módulo Autenticación

> **📍 Ubicación**: `/server/domains/auth/`
> 
> **🎯 Dominio**: Sistema de Autenticación y Autorización

## 🎯 Propósito

Este módulo implementa un **sistema completo de autenticación JWT** con funcionalidades avanzadas de seguridad, incluyendo gestión de usuarios, roles, permisos y sesiones para el Portal de Auditorías Técnicas.

### Responsabilidades Principales
- **Autenticación JWT** con tokens de acceso y refresh
- **Gestión de usuarios** con roles (ADMIN, AUDITOR, SUPERVISOR, PROVEEDOR)
- **Autorización basada en roles** y permisos granulares
- **Seguridad avanzada** con rate limiting, bloqueo de cuentas y validaciones
- **Recuperación de contraseñas** y verificación de email
- **Gestión de sesiones** y cierre de sesión seguro

## 🏗️ Componentes Clave

### Controller Layer
- **`auth.controller.js`**: 15+ endpoints para autenticación completa
- **Endpoints principales**: login, register, refresh, profile, change-password, logout

### Service Layer
- **`auth.service.js`**: Lógica de negocio JWT, bcrypt, validaciones de seguridad
- **Funciones principales**: generateToken, verifyToken, login, register, refreshToken

### Middleware
- **`middleware/authentication.js`**: Verificación JWT, estados de cuenta, rate limiting
- **`middleware/authorization.js`**: Control de roles, permisos, acceso a recursos

### Models (Sequelize)
- **`models/Usuario.model.js`**: Esquema completo de usuario con hooks bcrypt
- **Campos**: email, password_hash, nombres, apellidos, rol, estado, configuración

### Validators
- **`validators/auth.validators.js`**: Validaciones express-validator para todos los endpoints

## 🔌 Interfaces/APIs

### Endpoints de Autenticación

#### Endpoints Públicos
```javascript
// POST /api/auth/login - Iniciar sesión
Body: {
  email: "usuario@ejemplo.com",
  password: "Password123"
}
Response: {
  status: "success",
  data: {
    user: { id, email, nombres, apellidos, rol, ... },
    tokens: {
      access_token: "jwt-access-token",
      refresh_token: "jwt-refresh-token",
      token_type: "Bearer",
      expires_in: "24h"
    }
  }
}

// POST /api/auth/register - Registrar usuario
Body: {
  email: "nuevo@ejemplo.com",
  password: "Password123",
  nombres: "Nombre",
  apellidos: "Apellidos",
  documento: "12345678",
  telefono: "+57 300 123-4567",
  rol: "PROVEEDOR" // opcional, solo admins pueden asignar otros roles
}
Response: {
  status: "success",
  message: "Usuario registrado. Revisa tu email para verificar",
  data: { user: {...}, verification_token: "..." }
}

// POST /api/auth/refresh - Renovar token
Body: { refreshToken: "jwt-refresh-token" }
Response: {
  status: "success",
  data: {
    access_token: "new-jwt-access-token",
    token_type: "Bearer",
    expires_in: "24h"
  }
}

// POST /api/auth/forgot-password - Solicitar recuperación
Body: { email: "usuario@ejemplo.com" }
Response: {
  status: "success",
  message: "Si el email existe, se enviará enlace de recuperación"
}

// POST /api/auth/reset-password - Resetear contraseña
Body: {
  token: "reset-token",
  newPassword: "NewPassword123"
}
Response: {
  status: "success",
  message: "Contraseña actualizada exitosamente"
}

// POST /api/auth/verify-email - Verificar email
Body: { token: "verification-token" }
Response: {
  status: "success",
  message: "Email verificado. Ya puedes iniciar sesión"
}
```

#### Endpoints Protegidos (requieren autenticación)
```javascript
// Headers requeridos para endpoints protegidos
Authorization: Bearer <access-token>

// GET /api/auth/profile - Obtener perfil
Response: {
  status: "success",
  data: {
    user: {
      id, email, nombres, apellidos, documento, telefono,
      rol, estado, avatar_url, configuracion, ultimo_login
    }
  }
}

// PUT /api/auth/profile - Actualizar perfil
Body: {
  nombres: "Nuevo Nombre",
  apellidos: "Nuevos Apellidos",
  telefono: "+57 310 987-6543",
  avatar_url: "https://ejemplo.com/avatar.jpg",
  configuracion: {
    notificaciones_email: true,
    idioma: "es",
    zona_horaria: "America/Bogota"
  }
}

// POST /api/auth/change-password - Cambiar contraseña
Body: {
  currentPassword: "CurrentPassword123",
  newPassword: "NewPassword123"
}

// GET /api/auth/validate-token - Validar token actual
Response: {
  status: "success",
  data: {
    user: {...},
    token_valid: true
  }
}

// GET /api/auth/permissions - Obtener permisos del usuario
Response: {
  status: "success",
  data: {
    user_role: "AUDITOR",
    permissions: [
      "auditorias.crear", "auditorias.editar", "auditorias.ver",
      "documentos.subir", "documentos.validar", "etl.procesar"
    ],
    has_admin_access: false,
    is_auditor: true,
    is_provider: false
  }
}

// GET /api/auth/sessions - Sesiones activas
Response: {
  status: "success",
  data: {
    current_session: {...},
    active_sessions: [...]
  }
}

// POST /api/auth/logout - Cerrar sesión
Response: {
  status: "success",
  message: "Sesión cerrada exitosamente"
}
```

## 🔗 Dependencias

### Dependencias Internas
- **`../../models/index.js`**: Acceso a modelos Sequelize (Usuario)
- **`../../shared/middleware/errorHandler.js`**: Manejo de errores async
- **`../../shared/middleware/requestLogger.js`**: Logging de operaciones
- **`../../config/database.js`**: Conexión MySQL para persistencia

### Dependencias Externas
- **`jsonwebtoken`**: Generación y verificación de tokens JWT
- **`bcrypt`**: Hash seguro de contraseñas con salt
- **`express-validator`**: Validación y sanitización de entrada
- **`crypto`**: Generación de tokens seguros para verificación/reset
- **`express-rate-limit`**: Rate limiting para endpoints sensibles

## ⚠️ Peculiaridades y Consideraciones Críticas

### 1. **Sistema de Roles y Permisos**
```javascript
// Jerarquía de roles (de menor a mayor privilegio)
const ROLES = {
  PROVEEDOR: {
    permisos: [
      'auditorias.ver_propias', 'documentos.subir_propios',
      'etl.subir_parque', 'chat.participar', 'perfil.editar'
    ]
  },
  AUDITOR: {
    permisos: [
      'auditorias.crear', 'auditorias.editar', 'auditorias.ver',
      'documentos.subir', 'documentos.validar',
      'etl.procesar', 'etl.validar', 'ia.analizar', 'reportes.ver'
    ]
  },
  SUPERVISOR: {
    permisos: [
      ...AUDITOR.permisos,
      'usuarios.ver', 'usuarios.editar',
      'reportes.generar', 'dashboards.ver'
    ]
  },
  ADMIN: {
    permisos: ['*'] // Todos los permisos
  }
};
```

### 2. **Configuración JWT Avanzada**
```javascript
// Configuración de tokens
const JWT_CONFIG = {
  access_token: {
    expires_in: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256',
    issuer: 'portal-auditorias',
    audience: 'portal-users'
  },
  refresh_token: {
    expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    single_use: true // Los refresh tokens se invalidan al usarse
  }
};

// Payload del JWT
const tokenPayload = {
  id: user.id,
  email: user.email,
  rol: user.rol,
  nombres: user.nombres,
  apellidos: user.apellidos,
  type: 'access' | 'refresh',
  iat: timestamp,
  exp: expiration,
  iss: 'portal-auditorias',
  sub: user.id
};
```

### 3. **Seguridad Avanzada**
```javascript
// Rate Limiting por IP
const RATE_LIMITS = {
  login: '5 attempts per 15 minutes per IP',
  register: '3 attempts per hour per IP',
  forgot_password: '3 attempts per hour per email',
  general_api: '100 requests per 15 minutes per IP'
};

// Bloqueo de cuentas por intentos fallidos
const ACCOUNT_LOCKOUT = {
  max_attempts: 5,
  lockout_duration: 30 * 60 * 1000, // 30 minutos
  auto_unlock: true
};

// Validación de contraseñas
const PASSWORD_POLICY = {
  min_length: 8,
  require_uppercase: true,
  require_lowercase: true,
  require_numbers: true,
  require_special_chars: process.env.NODE_ENV === 'production',
  prevent_common_passwords: true
};
```

### 4. **Estados de Cuenta y Verificaciones**
```javascript
// Estados posibles de usuario
const USER_STATES = {
  PENDIENTE_VERIFICACION: 'Cuenta creada, email no verificado',
  ACTIVO: 'Cuenta activa y verificada',
  INACTIVO: 'Cuenta desactivada temporalmente',
  BLOQUEADO: 'Cuenta bloqueada por admin o múltiples intentos fallidos'
};

// Flujo de verificación
const VERIFICATION_FLOW = {
  1: 'Usuario se registra → estado PENDIENTE_VERIFICACION',
  2: 'Sistema envía email con token de verificación',
  3: 'Usuario hace clic en enlace → POST /verify-email',
  4: 'Sistema marca email_verificado=true, estado=ACTIVO',
  5: 'Usuario puede hacer login normalmente'
};
```

## 💡 Fragmentos de Código Ilustrativos

### Autenticación JWT Completa
```javascript
// auth.service.js - Login completo con todas las validaciones
const login = async (email, password) => {
  try {
    // 1. Buscar usuario
    const usuario = await Usuario.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // 2. Verificar bloqueo de cuenta
    if (usuario.estaBloqueado()) {
      const tiempoRestante = Math.ceil((usuario.bloqueado_hasta - new Date()) / (1000 * 60));
      throw new Error(`Cuenta bloqueada. Intenta en ${tiempoRestante} minutos`);
    }

    // 3. Verificar estado activo
    if (usuario.estado !== 'ACTIVO') {
      const mensajes = {
        'INACTIVO': 'Cuenta inactiva. Contacta al administrador',
        'BLOQUEADO': 'Cuenta bloqueada. Contacta al administrador',
        'PENDIENTE_VERIFICACION': 'Verifica tu email antes de iniciar sesión'
      };
      throw new Error(mensajes[usuario.estado] || 'Cuenta no disponible');
    }

    // 4. Verificar contraseña
    const passwordValida = await usuario.verificarPassword(password);
    
    if (!passwordValida) {
      await usuario.incrementarIntentosLogin();
      throw new Error('Credenciales inválidas');
    }

    // 5. Verificar email verificado
    if (!usuario.email_verificado) {
      throw new Error('Debes verificar tu email antes de iniciar sesión');
    }

    // 6. Login exitoso - resetear intentos y generar tokens
    await usuario.resetearIntentosLogin();
    
    const accessToken = this.generateToken(usuario, 'access');
    const refreshToken = this.generateToken(usuario, 'refresh');

    return {
      success: true,
      data: {
        user: this.sanitizeUserData(usuario),
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: this.jwtExpiresIn
        }
      }
    };

  } catch (error) {
    return { success: false, message: error.message };
  }
};
```

### Middleware de Autenticación
```javascript
// middleware/authentication.js - Verificación completa de JWT
const authenticate = async (req, res, next) => {
  try {
    // 1. Extraer token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token de autenticación requerido'
      });
    }
    
    const token = authHeader.substring(7);
    
    // 2. Verificar y decodificar token
    const decoded = authService.verifyToken(token);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token de acceso inválido'
      });
    }
    
    // 3. Obtener usuario actualizado de BD
    const { Usuario } = await getModels();
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        status: 'fail',
        message: 'Usuario no encontrado'
      });
    }
    
    // 4. Verificar estado del usuario
    if (usuario.estado !== 'ACTIVO' || !usuario.email_verificado) {
      return res.status(401).json({
        status: 'fail',
        message: 'Cuenta no activa o email no verificado'
      });
    }
    
    // 5. Verificar bloqueo
    if (usuario.estaBloqueado()) {
      return res.status(401).json({
        status: 'fail',
        message: 'Cuenta temporalmente bloqueada'
      });
    }
    
    // 6. Agregar usuario a request
    req.user = {
      id: usuario.id,
      email: usuario.email,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      rol: usuario.rol,
      estado: usuario.estado
    };
    
    next();
    
  } catch (error) {
    let mensaje = 'Token inválido';
    
    if (error.message === 'Token expirado') {
      mensaje = 'Token expirado. Inicia sesión nuevamente';
    }
    
    return res.status(401).json({
      status: 'fail',
      message: mensaje
    });
  }
};
```

### Autorización Basada en Roles
```javascript
// middleware/authorization.js - Control granular de permisos
const requirePermission = (permiso) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Autenticación requerida'
      });
    }
    
    // Verificar permiso usando el servicio
    const tienePermiso = await authService.validatePermission(req.user.id, permiso);
    
    if (!tienePermiso) {
      return res.status(403).json({
        status: 'fail',
        message: `No tienes el permiso: ${permiso}`,
        data: {
          required_permission: permiso,
          user_role: req.user.rol
        }
      });
    }
    
    next();
  };
};

// Uso en rutas
router.post('/auditorias', 
  authenticate,
  requirePermission('auditorias.crear'),
  auditoriasController.create
);

router.get('/admin/users',
  authenticate,
  requireRole('ADMIN'),
  usersController.listAll
);
```

## 🔍 Patrones de Uso para Claude

### Desarrollo en este Módulo
1. **Consultar** este `Claude.md` para entender flujos de autenticación
2. **Examinar** `auth.service.js` para lógica de negocio JWT
3. **Revisar** middleware para implementar protección de rutas
4. **Verificar** validadores para nuevos endpoints

### Debugging Común
- **Token inválido**: Verificar formato Bearer, expiración, tipo de token
- **Usuario no autenticado**: Revisar middleware authentication en rutas
- **Permisos denegados**: Verificar roles y permisos en authorization
- **Cuenta bloqueada**: Revisar intentos de login fallidos y lockout

### Extensión del Módulo
- **Nuevos roles**: Actualizar enum en modelo Usuario y permisos
- **Nuevos permisos**: Agregar en tienePermiso() del modelo Usuario
- **OAuth/SSO**: Extender auth.service.js con proveedores externos
- **2FA**: Implementar verificación de segundo factor

---

**📝 Generado automáticamente por**: Claude.md Strategy
**🔄 Última sincronización**: Implementación completa JWT  
**📊 Estado**: ✅ Sistema de autenticación funcional y robusto