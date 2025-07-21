import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../domains/auth/authStore';

const Navbar = () => {
  const { user, logout, hasRole, hasAnyRole } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'AUDITOR': return 'bg-blue-100 text-blue-800';
      case 'SUPERVISOR': return 'bg-purple-100 text-purple-800';
      case 'PROVEEDOR': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      roles: ['ADMIN', 'AUDITOR', 'SUPERVISOR', 'PROVEEDOR']
    },
    {
      name: 'Auditorías',
      href: '/auditorias',
      icon: '📋',
      roles: ['ADMIN', 'AUDITOR', 'SUPERVISOR']
    },
    {
      name: 'ETL',
      href: '/etl',
      icon: '🔄',
      roles: ['ADMIN', 'AUDITOR']
    },
    {
      name: 'IA',
      href: '/ia',
      icon: '🤖',
      roles: ['ADMIN', 'AUDITOR']
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: '⚙️',
      roles: ['ADMIN']
    }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    hasAnyRole(item.roles)
  );

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y navegación principal */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                  Portal de Auditorías
                </h1>
              </Link>
            </div>

            {/* Navegación Desktop */}
            <div className="hidden md:ml-6 md:flex md:space-x-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isCurrentPath(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Perfil de usuario */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 p-2"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-bold">
                      {user.nombres?.charAt(0)}{user.apellidos?.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.nombres} {user.apellidos}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <div className={`badge ${getRoleColor(user.rol)} hidden lg:inline-flex`}>
                    {user.rol}
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Dropdown Profile */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      👤 Mi Perfil
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isCurrentPath(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              
              {/* Profile Mobile */}
              {user && (
                <>
                  <hr className="my-2" />
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 text-sm font-bold">
                          {user.nombres?.charAt(0)}{user.apellidos?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.nombres} {user.apellidos}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    👤 Mi Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-900 hover:bg-red-50"
                  >
                    🚪 Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
