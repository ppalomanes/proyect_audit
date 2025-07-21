import React, { useState } from 'react';

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState('usuarios');

  const adminSections = [
    {
      id: 'usuarios',
      title: 'Usuarios',
      icon: '👥',
      description: 'Gestión de usuarios, roles y permisos del sistema',
      color: 'var(--accent-primary)'
    },
    {
      id: 'sistema',
      title: 'Sistema',
      icon: '⚙️',
      description: 'Configuración global, parámetros y variables del sistema',
      color: 'var(--info)'
    },
    {
      id: 'monitoreo',
      title: 'Monitoreo',
      icon: '📊',
      description: 'Logs del sistema, métricas de performance y alertas',
      color: 'var(--error)'
    }
  ];

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            🛡️ Panel de Administración
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gestión completa del sistema - Solo para administradores
          </p>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <div 
              key={section.id}
              className="card rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-primary)',
                boxShadow: '0 2px 8px var(--shadow-light)'
              }}
              onClick={() => setActiveSection(section.id)}
            >
              <div className="text-center">
                <div 
                  className="text-4xl mb-4"
                  style={{ color: section.color }}
                >
                  {section.icon}
                </div>
                <h3 
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {section.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {section.description}
                </p>
                
                <div className="mt-4">
                  <button 
                    className="btn-primary px-4 py-2 text-sm"
                    style={{
                      backgroundColor: section.color,
                      borderColor: section.color
                    }}
                  >
                    Gestionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Section Content */}
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 2px 8px var(--shadow-light)'
          }}
        >
          {activeSection === 'usuarios' && (
            <div>
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                👥 Gestión de Usuarios
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--success-bg)',
                    borderColor: 'var(--success)'
                  }}
                >
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'var(--success)' }}
                  >
                    15
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--success)' }}
                  >
                    Usuarios Activos
                  </div>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--info-bg)',
                    borderColor: 'var(--info)'
                  }}
                >
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'var(--info)' }}
                  >
                    4
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--info)' }}
                  >
                    Roles Configurados
                  </div>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--warning-bg)',
                    borderColor: 'var(--warning)'
                  }}
                >
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'var(--warning)' }}
                  >
                    2
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--warning)' }}
                  >
                    Pendientes Aprobación
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <h3 
                    className="font-medium mb-3"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    🔧 Acciones Rápidas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      className="btn-secondary text-sm px-3 py-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Crear Usuario
                    </button>
                    <button 
                      className="btn-secondary text-sm px-3 py-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Gestionar Roles
                    </button>
                    <button 
                      className="btn-secondary text-sm px-3 py-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Exportar Lista
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'sistema' && (
            <div>
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                ⚙️ Configuración del Sistema
              </h2>
              
              <div className="space-y-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <h3 
                    className="font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    🌐 Configuración Global
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Nombre del Sistema:</span>
                      <span 
                        className="ml-2 font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Portal Auditorías Técnicas
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Versión:</span>
                      <span 
                        className="ml-2 font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        v1.0.0
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Modo Debug:</span>
                      <span 
                        className="ml-2 font-medium"
                        style={{ color: 'var(--success)' }}
                      >
                        Desactivado
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Backup Automático:</span>
                      <span 
                        className="ml-2 font-medium"
                        style={{ color: 'var(--success)' }}
                      >
                        Activado
                      </span>
                    </div>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--info-bg)',
                    borderColor: 'var(--info)'
                  }}
                >
                  <h3 
                    className="font-medium mb-2"
                    style={{ color: 'var(--info)' }}
                  >
                    🔧 Variables del Sistema
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--info)' }}
                  >
                    Gestión de parámetros, límites y configuraciones avanzadas
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'monitoreo' && (
            <div>
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                📊 Monitoreo y Logs
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--error-bg)',
                    borderColor: 'var(--error)'
                  }}
                >
                  <h3 
                    className="font-medium mb-2"
                    style={{ color: 'var(--error)' }}
                  >
                    🚨 Logs del Sistema
                  </h3>
                  <div 
                    className="text-sm space-y-1"
                    style={{ color: 'var(--error)' }}
                  >
                    <div>• Error conexión DB - 10:30 AM</div>
                    <div>• Login fallido user123 - 10:25 AM</div>
                    <div>• ETL timeout - 10:15 AM</div>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--success-bg)',
                    borderColor: 'var(--success)'
                  }}
                >
                  <h3 
                    className="font-medium mb-2"
                    style={{ color: 'var(--success)' }}
                  >
                    📈 Métricas de Performance
                  </h3>
                  <div 
                    className="text-sm space-y-1"
                    style={{ color: 'var(--success)' }}
                  >
                    <div>• CPU: 45% promedio</div>
                    <div>• RAM: 2.1GB / 8GB</div>
                    <div>• Uptime: 99.9%</div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button 
                  className="btn-primary px-4 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--error)',
                    borderColor: 'var(--error)'
                  }}
                >
                  Ver Logs Completos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;