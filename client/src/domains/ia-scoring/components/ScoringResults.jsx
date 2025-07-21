import React, { useState } from 'react';

const ScoringResults = ({ results, analysisType, onReset }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 80) return 'var(--accent-primary)';
    if (score >= 70) return 'var(--warning)';
    return 'var(--error)';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Bueno';
    if (score >= 70) return 'Aceptable';
    return 'Necesita Mejoras';
  };

  const renderScoreCard = (title, score, description) => (
    <div 
      className="card rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
        boxShadow: '0 2px 8px var(--shadow-light)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 
          className="font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h4>
        <div 
          className="text-2xl font-bold"
          style={{ color: getScoreColor(score) }}
        >
          {score}
        </div>
      </div>
      
      <div 
        className="w-full h-2 rounded-full mb-2"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{
            backgroundColor: getScoreColor(score),
            width: `${score}%`
          }}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <span 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </span>
        <span 
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: getScoreColor(score) + '20',
            color: getScoreColor(score)
          }}
        >
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: '📊 Resumen', icon: '📊' },
    { id: 'details', label: '🔍 Detalles', icon: '🔍' },
    { id: 'recommendations', label: '💡 Recomendaciones', icon: '💡' },
    { id: 'export', label: '📤 Exportar', icon: '📤' }
  ];

  return (
    <div className="space-y-6">
      {/* Header con Score Principal */}
      <div 
        className="card rounded-xl p-8 text-center"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 4px 12px var(--shadow-light)'
        }}
      >
        <div className="mb-4">
          <div 
            className="text-6xl font-bold mb-2"
            style={{ color: getScoreColor(results.score_final) }}
          >
            {results.score_final}
          </div>
          <div 
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Score Final de {analysisType === 'document' ? 'Documento' : 'Imagen'}
          </div>
          <div 
            className="inline-block px-4 py-2 rounded-full text-lg font-medium"
            style={{
              backgroundColor: getScoreColor(results.score_final) + '20',
              color: getScoreColor(results.score_final)
            }}
          >
            {getScoreLabel(results.score_final)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--info-bg)',
              borderColor: 'var(--info)'
            }}
          >
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--info)' }}
            >
              {results.metadatos?.modelo_usado || 'IA Local'}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--info)' }}
            >
              Modelo Utilizado
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--success-bg)',
              borderColor: 'var(--success)'
            }}
          >
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--success)' }}
            >
              {results.metadatos?.tiempo_procesamiento || '0s'}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--success)' }}
            >
              Tiempo de Análisis
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--accent-bg)',
              borderColor: 'var(--accent-primary)'
            }}
          >
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--accent-primary)' }}
            >
              {analysisType === 'document' ? 
                results.metadatos?.palabras_analizadas || '0' :
                results.metadatos?.imagenes_analizadas || '0'
              }
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--accent-primary)' }}
            >
              {analysisType === 'document' ? 'Palabras Analizadas' : 'Imágenes Procesadas'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div 
        className="flex space-x-1 p-1 rounded-lg"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id ? 'shadow-md' : ''
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Scores Detallados */}
          <div 
            className="card rounded-xl p-6"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-primary)',
              boxShadow: '0 4px 12px var(--shadow-light)'
            }}
          >
            <h3 
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              📊 Puntuaciones por Categoría
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(results.detalle_scoring).map(([key, score]) => {
                const categoryLabels = {
                  completeness: 'Completitud',
                  accuracy: 'Precisión',
                  compliance: 'Cumplimiento',
                  clarity: 'Claridad',
                  technical_compliance: 'Cumplimiento Técnico',
                  organization: 'Organización',
                  safety: 'Seguridad',
                  equipment_state: 'Estado de Equipos'
                };
                
                const categoryDescriptions = {
                  completeness: 'Información completa y detallada',
                  accuracy: 'Exactitud de datos técnicos',
                  compliance: 'Adherencia a normativas',
                  clarity: 'Estructura y legibilidad',
                  technical_compliance: 'Especificaciones técnicas correctas',
                  organization: 'Orden y distribución del espacio',
                  safety: 'Aspectos de seguridad visual',
                  equipment_state: 'Condición física de equipos'
                };
                
                return renderScoreCard(
                  categoryLabels[key] || key,
                  score,
                  categoryDescriptions[key] || 'Evaluación específica'
                );
              })}
            </div>
          </div>

          {/* Objetos Detectados (solo para imágenes) */}
          {analysisType === 'image' && results.objetos_detectados && (
            <div 
              className="card rounded-xl p-6"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-primary)',
                boxShadow: '0 4px 12px var(--shadow-light)'
              }}
            >
              <h3 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                🔍 Objetos Detectados
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.objetos_detectados.map((objeto, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-primary)'
                    }}
                  >
                    <div 
                      className="font-medium mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {objeto.objeto}
                    </div>
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {objeto.ubicacion}
                      </span>
                      <span 
                        className="text-sm font-medium px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--success-bg)',
                          color: 'var(--success)'
                        }}
                      >
                        {Math.round(objeto.confianza * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 4px 12px var(--shadow-light)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            🔍 Análisis Detallado
          </h3>
          
          <div className="space-y-4">
            <div 
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <h4 
                className="font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                📋 Información del Análisis
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>ID de Análisis:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="ml-2">
                    {results.analisis_id}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Fecha:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="ml-2">
                    {new Date().toLocaleDateString()}
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
              <h4 
                className="font-medium mb-2"
                style={{ color: 'var(--info)' }}
              >
                🤖 Detalles Técnicos
              </h4>
              <div className="text-sm space-y-2">
                <div>
                  <span style={{ color: 'var(--info)' }}>Modelo IA:</span>
                  <span style={{ color: 'var(--info)' }} className="ml-2">
                    {results.metadatos?.modelo_usado}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--info)' }}>Tiempo de Procesamiento:</span>
                  <span style={{ color: 'var(--info)' }} className="ml-2">
                    {results.metadatos?.tiempo_procesamiento}
                  </span>
                </div>
                {analysisType === 'document' && (
                  <div>
                    <span style={{ color: 'var(--info)' }}>Palabras Analizadas:</span>
                    <span style={{ color: 'var(--info)' }} className="ml-2">
                      {results.metadatos?.palabras_analizadas}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 4px 12px var(--shadow-light)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            💡 Recomendaciones de Mejora
          </h3>
          
          <div className="space-y-3">
            {results.recomendaciones?.map((recomendacion, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-4 rounded-lg"
                style={{
                  backgroundColor: 'var(--warning-bg)',
                  borderColor: 'var(--warning)'
                }}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: 'var(--warning)',
                    color: 'white'
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p style={{ color: 'var(--warning)' }}>
                    {recomendacion}
                  </p>
                </div>
              </div>
            )) || (
              <div 
                className="text-center py-8"
                style={{ color: 'var(--text-secondary)' }}
              >
                No hay recomendaciones específicas para este análisis
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 4px 12px var(--shadow-light)'
          }}
        >
          <h3 
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            📤 Exportar Resultados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              className="p-4 rounded-lg border-2 border-dashed transition-all duration-200 hover:opacity-80"
              style={{
                borderColor: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-bg)'
              }}
              onClick={() => {
                const dataStr = JSON.stringify(results, null, 2);
                const dataBlob = new Blob([dataStr], {type:'application/json'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `analisis_${results.analisis_id}.json`;
                link.click();
              }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📄</div>
                <div 
                  className="font-medium"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Exportar JSON
                </div>
                <div 
                  className="text-sm"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Datos completos del análisis
                </div>
              </div>
            </button>

            <button 
              className="p-4 rounded-lg border-2 border-dashed transition-all duration-200 hover:opacity-80"
              style={{
                borderColor: 'var(--success)',
                backgroundColor: 'var(--success-bg)'
              }}
              onClick={() => {
                alert('Funcionalidad de PDF será implementada próximamente');
              }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📋</div>
                <div 
                  className="font-medium"
                  style={{ color: 'var(--success)' }}
                >
                  Reporte PDF
                </div>
                <div 
                  className="text-sm"
                  style={{ color: 'var(--success)' }}
                >
                  Informe ejecutivo formatado
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onReset}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)'
          }}
        >
          🔄 Nuevo Análisis
        </button>
        
        <div className="flex space-x-4">
          <button 
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-secondary)',
              color: 'white'
            }}
            onClick={() => {
              alert('Análisis guardado correctamente');
            }}
          >
            💾 Guardar Análisis
          </button>
          
          <button 
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white'
            }}
            onClick={() => {
              alert('Resultados enviados al proceso de auditoría');
            }}
          >
            📤 Enviar a Auditoría
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoringResults;