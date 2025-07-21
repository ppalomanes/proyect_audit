/**
 * Controlador de Autenticación Simplificado (Sin BD) - CORREGIDO
 * Para testing inmediato del frontend
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Función para generar hashes correctos (para referencia)
const generateHash = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Usuarios demo hardcodeados (sin base de datos) - CONTRASEÑAS CORREGIDAS
const DEMO_USERS = {
  'admin@portal-auditorias.com': {
    id: 1,
    email: 'admin@portal-auditorias.com',
    password: 'admin123', // Usaremos comparación directa por simplicidad
    nombres: 'Administrator',
    apellidos: 'Portal',
    rol: 'ADMIN',
    empresa: 'Portal Auditorías',
    telefono: '+1-555-0100',
    estado: 'ACTIVO',
    email_verificado: true
  },
  'auditor@portal-auditorias.com': {
    id: 2,
    email: 'auditor@portal-auditorias.com',
    password: 'auditor123',
    nombres: 'María',
    apellidos: 'García',
    rol: 'AUDITOR',
    empresa: 'Portal Auditorías',
    telefono: '+1-555-0101',
    estado: 'ACTIVO',
    email_verificado: true
  },
  'proveedor@callcenterdemo.com': {
    id: 3,
    email: 'proveedor@callcenterdemo.com',
    password: 'proveedor123',
    nombres: 'Juan',
    apellidos: 'Pérez',
    rol: 'PROVEEDOR',
    empresa: 'Call Center Demo',
    telefono: '+1-555-0102',
    estado: 'ACTIVO',
    email_verificado: true
  }
};

class AuthControllerSimple {

  /**
   * POST /api/auth/login
   */
  login = async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log('🔐 Login attempt:', { email, hasPassword: !!password });

      // Validar datos requeridos
      if (!email || !password) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email y contraseña son requeridos',
          data: null
        });
      }

      // Buscar usuario demo
      const user = DEMO_USERS[email.toLowerCase()];
      if (!user) {
        console.log('❌ Usuario no encontrado:', email);
        return res.status(401).json({
          status: 'fail',
          message: 'Credenciales inválidas',
          data: null
        });
      }

      // Verificar contraseña (comparación directa para modo demo)
      if (password !== user.password) {
        console.log('❌ Contraseña incorrecta para:', email);
        console.log('❌ Esperada:', user.password, 'Recibida:', password);
        return res.status(401).json({
          status: 'fail',
          message: 'Credenciales inválidas',
          data: null
        });
      }

      // Generar tokens JWT
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          rol: user.rol,
          nombres: user.nombres,
          apellidos: user.apellidos
        },
        process.env.JWT_SECRET || 'portal-auditorias-secret-key',
        { 
          expiresIn: '24h',
          issuer: 'portal-auditorias'
        }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          type: 'refresh'
        },
        process.env.JWT_SECRET || 'portal-auditorias-secret-key',
        { 
          expiresIn: '7d',
          issuer: 'portal-auditorias'
        }
      );

      // Respuesta exitosa
      const userData = {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        rol: user.rol,
        empresa: user.empresa,
        telefono: user.telefono,
        estado: user.estado,
        email_verificado: user.email_verificado
      };

      console.log('✅ Login exitoso:', { userId: user.id, rol: user.rol });

      res.status(200).json({
        status: 'success',
        message: 'Login exitoso',
        data: {
          token: accessToken,
          refresh_token: refreshToken,
          user: userData
        }
      });

    } catch (error) {
      console.error('💥 Error en login:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      });
    }
  };

  /**
   * POST /api/auth/register
   */
  register = async (req, res) => {
    try {
      const { email, password, nombres, apellidos, empresa, telefono, rol = 'PROVEEDOR' } = req.body;

      console.log('📝 Register attempt:', { email, rol });

      // Validar datos requeridos
      if (!email || !password || !nombres || !apellidos) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email, contraseña, nombres y apellidos son requeridos',
          data: null
        });
      }

      // Verificar si el usuario ya existe
      if (DEMO_USERS[email.toLowerCase()]) {
        return res.status(409).json({
          status: 'fail',
          message: 'El usuario ya existe',
          data: null
        });
      }

      // Simular registro exitoso y hacer login automático
      const newUser = {
        id: Object.keys(DEMO_USERS).length + 1,
        email: email.toLowerCase(),
        password: password,
        nombres,
        apellidos,
        rol,
        empresa: empresa || 'Nueva Empresa',
        telefono: telefono || '',
        estado: 'ACTIVO',
        email_verificado: true
      };

      // Agregar temporalmente a usuarios demo
      DEMO_USERS[email.toLowerCase()] = newUser;

      // Generar tokens para auto-login
      const accessToken = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          rol: newUser.rol,
          nombres: newUser.nombres,
          apellidos: newUser.apellidos
        },
        process.env.JWT_SECRET || 'portal-auditorias-secret-key',
        { 
          expiresIn: '24h',
          issuer: 'portal-auditorias'
        }
      );

      const refreshToken = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          type: 'refresh'
        },
        process.env.JWT_SECRET || 'portal-auditorias-secret-key',
        { 
          expiresIn: '7d',
          issuer: 'portal-auditorias'
        }
      );

      console.log('✅ Registro exitoso (modo demo):', { userId: newUser.id, rol: newUser.rol });

      res.status(201).json({
        status: 'success',
        message: 'Usuario registrado exitosamente',
        data: {
          token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: newUser.id,
            email: newUser.email,
            nombres: newUser.nombres,
            apellidos: newUser.apellidos,
            rol: newUser.rol,
            empresa: newUser.empresa,
            telefono: newUser.telefono
          }
        }
      });

    } catch (error) {
      console.error('💥 Error en register:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      });
    }
  };

  /**
   * GET /api/auth/me
   */
  me = async (req, res) => {
    try {
      // El usuario viene del middleware de autenticación
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'No autorizado',
          data: null
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Usuario obtenido',
        data: {
          id: user.id,
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          rol: user.rol,
          empresa: user.empresa || 'N/A',
          telefono: user.telefono || 'N/A'
        }
      });

    } catch (error) {
      console.error('💥 Error en me:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      });
    }
  };

  /**
   * PUT /api/auth/profile
   */
  updateProfile = async (req, res) => {
    try {
      const user = req.user;
      const { nombres, apellidos, telefono, empresa } = req.body;

      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'No autorizado',
          data: null
        });
      }

      // Buscar usuario en demo users
      const userEmail = Object.keys(DEMO_USERS).find(email => 
        DEMO_USERS[email].id === user.id
      );

      if (userEmail && DEMO_USERS[userEmail]) {
        // Actualizar datos del usuario
        if (nombres) DEMO_USERS[userEmail].nombres = nombres;
        if (apellidos) DEMO_USERS[userEmail].apellidos = apellidos;
        if (telefono) DEMO_USERS[userEmail].telefono = telefono;
        if (empresa) DEMO_USERS[userEmail].empresa = empresa;

        console.log('✅ Perfil actualizado:', { userId: user.id });

        res.status(200).json({
          status: 'success',
          message: 'Perfil actualizado exitosamente',
          data: {
            id: DEMO_USERS[userEmail].id,
            email: DEMO_USERS[userEmail].email,
            nombres: DEMO_USERS[userEmail].nombres,
            apellidos: DEMO_USERS[userEmail].apellidos,
            rol: DEMO_USERS[userEmail].rol,
            empresa: DEMO_USERS[userEmail].empresa,
            telefono: DEMO_USERS[userEmail].telefono
          }
        });
      } else {
        res.status(404).json({
          status: 'fail',
          message: 'Usuario no encontrado',
          data: null
        });
      }

    } catch (error) {
      console.error('💥 Error en updateProfile:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      });
    }
  };

  /**
   * PUT /api/auth/change-password
   */
  changePassword = async (req, res) => {
    try {
      const user = req.user;
      const { current_password, new_password } = req.body;

      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'No autorizado',
          data: null
        });
      }

      // Buscar usuario en demo users
      const userEmail = Object.keys(DEMO_USERS).find(email => 
        DEMO_USERS[email].id === user.id
      );

      if (userEmail && DEMO_USERS[userEmail]) {
        // Verificar contraseña actual
        if (current_password !== DEMO_USERS[userEmail].password) {
          return res.status(400).json({
            status: 'fail',
            message: 'Contraseña actual incorrecta',
            data: null
          });
        }

        // Actualizar contraseña
        DEMO_USERS[userEmail].password = new_password;

        console.log('✅ Contraseña cambiada:', { userId: user.id });

        res.status(200).json({
          status: 'success',
          message: 'Contraseña cambiada exitosamente',
          data: null
        });
      } else {
        res.status(404).json({
          status: 'fail',
          message: 'Usuario no encontrado',
          data: null
        });
      }

    } catch (error) {
      console.error('💥 Error en changePassword:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      });
    }
  };

  /**
   * POST /api/auth/refresh
   */
  refresh = async (req, res) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          status: 'fail',
          message: 'Refresh token requerido',
          data: null
        });
      }

      // Verificar refresh token
      const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET || 'portal-auditorias-secret-key');
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          status: 'fail',
          message: 'Token inválido',
          data: null
        });
      }

      // Buscar usuario
      const userEmail = Object.keys(DEMO_USERS).find(email => 
        DEMO_USERS[email].id === decoded.id
      );

      if (!userEmail) {
        return res.status(401).json({
          status: 'fail',
          message: 'Usuario no encontrado',
          data: null
        });
      }

      const user = DEMO_USERS[userEmail];

      // Generar nuevo access token
      const newAccessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          rol: user.rol,
          nombres: user.nombres,
          apellidos: user.apellidos
        },
        process.env.JWT_SECRET || 'portal-auditorias-secret-key',
        { 
          expiresIn: '24h',
          issuer: 'portal-auditorias'
        }
      );

      res.status(200).json({
        status: 'success',
        message: 'Token renovado',
        data: {
          token: newAccessToken,
          refresh_token: refresh_token // Mantener el mismo refresh token
        }
      });

    } catch (error) {
      console.error('💥 Error en refresh:', error);
      res.status(401).json({
        status: 'fail',
        message: 'Refresh token inválido',
        data: null
      });
    }
  };

  /**
   * POST /api/auth/logout
   */
  logout = async (req, res) => {
    try {
      console.log('👋 Logout request');

      // En modo demo, simplemente confirmamos el logout
      res.status(200).json({
        status: 'success',
        message: 'Logout exitoso',
        data: null
      });

    } catch (error) {
      console.error('💥 Error en logout:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        data: null
      });
    }
  };
}

module.exports = new AuthControllerSimple();
