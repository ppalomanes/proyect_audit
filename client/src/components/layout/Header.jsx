// client/src/components/layout/Header.jsx
import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  UserIcon,
  PowerIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

const Header = ({ user, onToggleSidebar, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([
    {
      id: 1,
      title: 'Nueva auditoría asignada',
      description: 'TechCorp - Proceso iniciado',
      time: '5 min ago',
      unread: true,
    },
    {
      id: 2,
      title: 'ETL completado',
      description: '245 equipos procesados exitosamente',
      time: '2 horas ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Mensaje de proveedor',
      description: 'ContactPlus requiere clarificación',
      time: '1 día ago',
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  const handleProfileAction = (action) => {
    switch (action) {
      case 'profile':
        navigate('/perfil');
        break;
      case 'settings':
        navigate('/configuracion');
        break;
      case 'help':
        window.open('/ayuda', '_blank');
        break;
      case 'logout':
        onLogout();
        navigate('/login');
        break;
      default:
        break;
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 z-30 h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors md:hidden"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-64 pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Buscar auditorías, proveedores..."
              />
              {searchQuery && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <button
                    type="submit"
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-700 border border-gray-600 rounded">
                      Enter
                    </kbd>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Mobile Search Button */}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors md:hidden">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button className="text-xs text-blue-400 hover:text-blue-300">
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            active ? 'bg-gray-700' : ''
                          } ${notification.unread ? 'bg-gray-800/50' : ''}`}
                        >
                          <div className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                              notification.unread ? 'bg-blue-500' : 'bg-transparent'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-700">
                  <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                    Ver todas las notificaciones
                  </button>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Quick Chat */}
          <button
            onClick={() => navigate('/chat')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                <span className="text-sm font-medium text-white">
                  {user?.nombres?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">
                  {user?.nombres || 'Usuario'}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.rol || 'Sin rol'}
                </p>
              </div>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-medium text-white">
                    {user?.nombres} {user?.apellidos}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  <div className="flex items-center mt-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                      {user?.rol}
                    </span>
                  </div>
                </div>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleProfileAction('profile')}
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        active ? 'bg-gray-700 text-white' : 'text-gray-300'
                      }`}
                    >
                      <UserIcon className="w-4 h-4 mr-3" />
                      Mi Perfil
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleProfileAction('settings')}
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        active ? 'bg-gray-700 text-white' : 'text-gray-300'
                      }`}
                    >
                      <Cog6ToothIcon className="w-4 h-4 mr-3" />
                      Configuración
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleProfileAction('help')}
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        active ? 'bg-gray-700 text-white' : 'text-gray-300'
                      }`}
                    >
                      <QuestionMarkCircleIcon className="w-4 h-4 mr-3" />
                      Ayuda
                    </button>
                  )}
                </Menu.Item>

                <div className="border-t border-gray-700 my-2" />

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleProfileAction('logout')}
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        active ? 'bg-red-600 text-white' : 'text-red-400'
                      }`}
                    >
                      <PowerIcon className="w-4 h-4 mr-3" />
                      Cerrar Sesión
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden border-t border-gray-700/50 p-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Buscar auditorías, proveedores..."
          />
        </form>
      </div>
    </header>
  );
};

export default Header;