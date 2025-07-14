import React from 'react';
import { useAuthStore } from '../domains/auth/authStore';

const Navbar = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                Portal de Auditorías Técnicas
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user.nombres} {user.apellidos}</span>
                  <span className="ml-2 badge badge-info">{user.rol}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
