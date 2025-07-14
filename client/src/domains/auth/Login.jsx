import React, { useState } from 'react';
import { useAuthStore } from './authStore';

const Login = () => {
  const [email, setEmail] = useState('admin@portal-auditorias.com');
  const [password, setPassword] = useState('admin123');
  const { login, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    const result = await login(email, password);
    if (result.success) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Portal de Auditorías Técnicas
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión para continuar
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600">
              <strong>Usuarios de prueba:</strong>
            </div>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div>👤 Admin: admin@portal-auditorias.com / admin123</div>
              <div>🔍 Auditor: auditor@portal-auditorias.com / auditor123</div>
              <div>🏢 Proveedor: proveedor@callcenterdemo.com / proveedor123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
