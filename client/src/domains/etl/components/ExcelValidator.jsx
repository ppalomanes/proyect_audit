import React, { useState, useEffect } from 'react';

const ExcelValidator = ({ 
  validationResults = null, 
  configuration = null,
  onConfigurationChange 
}) => {
  const [activeTab, setActiveTab] = useState('rules');
  const [customRules, setCustomRules] = useState({
    ram_minima_gb: 4,
    cpu_minima_ghz: 2.0,
    os_soportados: ['Windows 10', 'Windows 11', 'Linux'],
    navegadores_permitidos: ['Chrome', 'Firefox', 'Edge']
  });

  const validationCategories = [
    {
      id: 'critical',
      name: 'Errores Críticos',
      icon: '❌',
      color: 'var(--error)',
      bgColor: 'var(--error-bg)',
      description: 'Errores que impiden el procesamiento'
    },
    {
      id: 'warning',
      name: 'Advertencias',
      icon: '⚠️',
      color: 'var(--warning)',
      bgColor: 'var(--warning-bg)',
      description: 'Problemas que requieren atención'
    },
    {
      id: 'info',
      name: 'Información',
      icon: 'ℹ️',
      color: 'var(--info)',
      bgColor: 'var(--info-bg)',
      description: 'Observaciones y sugerencias'
    }
  ];

  const defaultBusinessRules = [
    {
      id: 'ram_requirement',
      name: 'RAM Mínima Requerida',
      description: 'Equipos deben tener al menos 4GB de RAM para Windows 10/11',
      field: 'ram_gb',
      operator: 'greaterThanInclusive',
      value: 4,
      severity: 'error',
      enabled: true
    },
    {
      id: 'cpu_performance',
      name: 'Rendimiento CPU',
      description: 'CPU debe tener al menos 2.5 GHz para rendimiento óptimo',
      field: 'cpu_speed_ghz',
      operator: 'greaterThanInclusive',
      value: 2.5,
      severity: 'warning',
      enabled: true
    },
    {
      id: 'os_compatibility',
      name: 'Sistema Operativo Compatible',
      description: 'SO debe estar en la lista de versiones soportadas',
      field: 'os_name',
      operator: 'in',
      value: ['Windows 10', 'Windows 11', 'Linux'],
      severity: 'error',
      enabled: true
    },
    {
      id: 'browser_support',
      name: 'Navegador Soportado',
      description: 'Navegador debe estar homologado para aplicaciones',
      field: 'browser_name',
      operator: 'in',
      value: ['Chrome', 'Firefox', 'Edge'],
      severity: 'warning',
      enabled: true
    },
    {
      id: 'antivirus_required',
      name: 'Antivirus Requerido',
      description: 'Todos los equipos deben tener antivirus configurado',
      field: 'antivirus_brand',
      operator: 'notEmpty',
      value: true,
      severity: 'error',
      enabled: true
    },
    {
      id: 'disk_space',
      name: 'Espacio en Disco',
      description: 'Disco debe tener al menos 100GB de capacidad',
      field: 'disk_capacity_gb',
      operator: 'greaterThanInclusive',
      value: 100,
      severity: 'warning',
      enabled: true
    }
  ];

  const requiredFields = [
    { field: 'proveedor', description: 'Nombre del proveedor', example: 'TechCorp S.A.' },
    { field: 'sitio', description: 'Código del sitio', example: 'BOG-001' },
    { field: 'atencion', description: 'Tipo de atención', example: 'Inbound, Outbound' },
    { field: 'usuario_id', description: 'ID único del usuario', example: 'USR001' },
    { field: 'cpu_brand', description: 'Marca del procesador', example: 'Intel, AMD' },
    { field: 'cpu_model', description: 'Modelo del CPU', example: 'Core i5-8400' },
    { field: 'cpu_speed_ghz', description: 'Velocidad en GHz', example: '2.8' },
    { field: 'ram_gb', description: 'Memoria RAM en GB', example: '8' },
    { field: 'disk_type', description: 'Tipo de disco', example: 'SSD, HDD' },
    { field: 'disk_capacity_gb', description: 'Capacidad en GB', example: '500' },
    { field: 'os_name', description: 'Sistema operativo', example: 'Windows 10' },
    { field: 'os_version', description: 'Versión del SO', example: '21H2' },
    { field: 'browser_name', description: 'Navegador principal', example: 'Chrome' },
    { field: 'browser_version', description: 'Versión del navegador', example: '96.0' },
    { field: 'antivirus_brand', description: 'Marca del antivirus', example: 'Windows Defender' }
  ];

  const getValidationSummary = () => {
    if (!validationResults) return null;

    const summary = {
      total: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      score: 0
    };

    if (validationResults.errores) {
      summary.errors = validationResults.errores.length;
      summary.total += summary.errors;
    }

    if (validationResults.advertencias) {
      summary.warnings = validationResults.advertencias.length;
      summary.total += summary.warnings;
    }

    if (validationResults.informacion) {
      summary.info = validationResults.informacion.length;
      summary.total += summary.info;
    }

    summary.score = validationResults.scoreValidacion || 0;

    return summary;
  };

  const renderValidationIssues = (issues, category) => {
    if (!issues || issues.length === 0) {
      return (
        <div 
          className="text-center py-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div className="text-2xl mb-2">✨</div>
          <p>No hay {category.name.toLowerCase()} que mostrar</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {issues.map((issue, index) => (
          <div 
            key={index}
            className="border rounded-lg p-4"
            style={{
              backgroundColor: category.bgColor,
              borderColor: category.color
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="text-lg">{category.icon}</div>
              <div className="flex-1">
                <div 
                  className="font-medium text-sm"
                  style={{ color: category.color }}
                >
                  {issue.campo && `Campo: ${issue.campo}`}
                </div>
                <p 
                  className="text-sm mt-1"
                  style={{ color: category.color }}
                >
                  {issue.mensaje || issue.message}
                </p>
                {issue.accion_sugerida && (
                  <div 
                    className="text-xs mt-2 p-2 rounded"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: category.color
                    }}
                  >
                    💡 Sugerencia: {issue.accion_sugerida}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBusinessRules = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          📋 Reglas de Validación Activas
        </h3>
        <span 
          className="text-sm px-3 py-1 rounded"
          style={{
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)'
          }}
        >
          {defaultBusinessRules.filter(r => r.enabled).length} reglas activas
        </span>
      </div>

      <div className="grid gap-4">
        {defaultBusinessRules.map((rule) => (
          <div 
            key={rule.id}
            className={`border rounded-lg p-4 transition-opacity ${
              rule.enabled ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: rule.severity === 'error' 
                ? 'var(--error)' 
                : rule.severity === 'warning' 
                  ? 'var(--warning)' 
                  : 'var(--info)'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span 
                    className="text-sm px-2 py-1 rounded"
                    style={{
                      backgroundColor: rule.severity === 'error' 
                        ? 'var(--error-bg)' 
                        : rule.severity === 'warning' 
                          ? 'var(--warning-bg)' 
                          : 'var(--info-bg)',
                      color: rule.severity === 'error' 
                        ? 'var(--error)' 
                        : rule.severity === 'warning' 
                          ? 'var(--warning)' 
                          : 'var(--info)'
                    }}
                  >
                    {rule.severity === 'error' ? '❌' : rule.severity === 'warning' ? '⚠️' : 'ℹ️'}
                    {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                  </span>
                  <span 
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {rule.name}
                  </span>
                </div>
                
                <p 
                  className="text-sm mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {rule.description}
                </p>
                
                <div 
                  className="text-xs font-mono p-2 rounded"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {rule.field} {rule.operator} {Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                </div>
              </div>
              
              <label className="flex items-center ml-4">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => {
                    // Aquí iría la lógica para actualizar reglas
                    console.log(`Regla ${rule.id} ${e.target.checked ? 'activada' : 'desactivada'}`);
                  }}
                  className="rounded"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span 
                  className="ml-2 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Activa
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRequiredFields = () => (
    <div className="space-y-6">
      <h3 
        className="text-lg font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        📝 Campos Requeridos (15 de 28)
      </h3>
      
      <div className="grid gap-3">
        {requiredFields.map((field, index) => (
          <div 
            key={field.field}
            className="flex items-center justify-between p-3 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: '3px solid var(--success)'
            }}
          >
            <div>
              <div 
                className="font-medium text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                {field.field}
              </div>
              <div 
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                {field.description}
              </div>
            </div>
            
            <div 
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--info-bg)',
                color: 'var(--info)'
              }}
            >
              {field.example}
            </div>
          </div>
        ))}
      </div>
      
      <div 
        className="p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--warning-bg)',
          borderColor: 'var(--warning)'
        }}
      >
        <h4 
          className="font-medium text-sm mb-2"
          style={{ color: 'var(--warning)' }}
        >
          💡 Campos Opcionales Adicionales
        </h4>
        <p 
          className="text-xs"
          style={{ color: 'var(--warning)' }}
        >
          Además de estos campos requeridos, el sistema puede procesar 13 campos adicionales como 
          hostname, headset_brand, isp_name, velocidades de conexión, etc. para un análisis más completo.
        </p>
      </div>
    </div>
  );

  const summary = getValidationSummary();

  return (
    <div 
      className="border rounded-xl"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      {/* Header */}
      <div 
        className="p-6 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <h2 
          className="text-xl font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          🔍 Validación y Reglas de Negocio
        </h2>
        
        {summary && (
          <div className="flex items-center space-x-4 mt-4">
            <div 
              className="text-sm px-3 py-1 rounded"
              style={{
                backgroundColor: summary.score >= 80 ? 'var(--success-bg)' : summary.score >= 60 ? 'var(--warning-bg)' : 'var(--error-bg)',
                color: summary.score >= 80 ? 'var(--success)' : summary.score >= 60 ? 'var(--warning)' : 'var(--error)'
              }}
            >
              📊 Score: {summary.score}%
            </div>
            
            {summary.errors > 0 && (
              <div 
                className="text-sm px-3 py-1 rounded"
                style={{
                  backgroundColor: 'var(--error-bg)',
                  color: 'var(--error)'
                }}
              >
                ❌ {summary.errors} errores
              </div>
            )}
            
            {summary.warnings > 0 && (
              <div 
                className="text-sm px-3 py-1 rounded"
                style={{
                  backgroundColor: 'var(--warning-bg)',
                  color: 'var(--warning)'
                }}
              >
                ⚠️ {summary.warnings} advertencias
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div 
        className="flex border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {[
          { id: 'rules', name: 'Reglas de Validación', icon: '📋' },
          { id: 'fields', name: 'Campos Requeridos', icon: '📝' },
          { id: 'results', name: 'Resultados', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-4 text-sm font-medium transition-colors ${
              activeTab === tab.id ? '' : 'hover:opacity-70'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
            }}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'rules' && renderBusinessRules()}
        {activeTab === 'fields' && renderRequiredFields()}
        {activeTab === 'results' && (
          <div>
            {validationResults ? (
              <div className="space-y-6">
                {validationCategories.map((category) => {
                  const issues = category.id === 'critical' 
                    ? validationResults.errores
                    : category.id === 'warning' 
                      ? validationResults.advertencias 
                      : validationResults.informacion;

                  return (
                    <div key={category.id}>
                      <h3 
                        className="text-lg font-semibold mb-4 flex items-center space-x-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                        {issues && issues.length > 0 && (
                          <span 
                            className="text-sm px-2 py-1 rounded"
                            style={{
                              backgroundColor: category.bgColor,
                              color: category.color
                            }}
                          >
                            {issues.length}
                          </span>
                        )}
                      </h3>
                      {renderValidationIssues(issues, category)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div 
                className="text-center py-12"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="text-4xl mb-4">📊</div>
                <h3 
                  className="text-lg font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Sin Resultados de Validación
                </h3>
                <p>Procesa un archivo para ver los resultados de validación detallados</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelValidator;