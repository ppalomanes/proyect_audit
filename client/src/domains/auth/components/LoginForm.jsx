import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../authStore';

const LoginForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: 'admin@portal-auditorias.com',
    password: 'admin123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, error, clearError } = useAuthStore();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    const result = await login(formData.email, formData.password, rememberMe);
    if (result.success) {
      onSuccess?.();
    }
  };

  const demoUsers = [
    { role: 'Admin', email: 'admin@portal-auditorias.com', password: 'admin123', icon: '👤' },
    { role: 'Auditor', email: 'auditor@portal-auditorias.com', password: 'auditor123', icon: '🔍' },
    { role: 'Proveedor', email: 'proveedor@callcenterdemo.com', password: 'proveedor123', icon: '🏢' }
  ];

  const loadDemoUser = (user) => {
    setFormData({
      email: user.email,
      password: user.password
    });
    clearError();
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="input-field pr-10"
              placeholder="Tu contraseña"
              value={formData.password}
              onChange={handleInputChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Recordarme
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error de autenticación
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </div>

        {/* Demo Users */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Usuarios de demostración</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {demoUsers.map((user, index) => (
              <button
                key={index}
                type="button"
                onClick={() => loadDemoUser(user)}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">{user.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">{user.role}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">Click para usar</div>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
