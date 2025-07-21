import React, { useState } from 'react';

const CriteriaConfig = ({ criteria, setCriteria, analysisType }) => {
  const [newCriterion, setNewCriterion] = useState({
    nombre: '',
    descripcion: '',
    peso: 1,
    tipo: 'tecnico'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const predefinedCriteria = {
    document: [
      {
        id: 'completeness',
        nombre: 'Completitud de Información',
        descripcion: 'Verificar que el documento contenga toda la información requerida',
        peso: 3,
        tipo: 'tecnico',
        icon: '📋'
      },
      {
        id: 'accuracy',
        nombre: 'Precisión Técnica',
        descripcion: 'Evaluar la exactitud de los datos técnicos y especificaciones',
        peso: 3,
        tipo: 'tecnico',
        icon: '🎯'
      },
      {
        id: 'compliance',
        nombre: 'Cumplimiento Normativo',
        descripcion: 'Verificar adherencia a estándares y normativas aplicables',
        peso: 2,
        tipo: 'normativo',
        icon: '✅'
      },
      {
        id: 'clarity',
        nombre: 'Claridad y Estructura',
        descripcion: 'Evaluar organización, legibilidad y presentación del contenido',
        peso: 2,
        tipo: 'formato',
        icon: '📝'
      },
      {
        id: 'security',
        nombre: 'Aspectos de Seguridad',
        descripcion: 'Evaluar medidas de seguridad y protección de datos mencionadas',
        peso: 2,
        tipo: 'seguridad',
        icon: '🔒'
      }
    ],
    image: [
      {
        id: 'technical_compliance',
        nombre: 'Cumplimiento Técnico',
        descripcion: 'Verificar que los equipos cumplan con especificaciones técnicas',
        peso: 3,
        tipo: 'tecnico',
        icon: '⚙️'
      },
      {
        id: 'organization',
        nombre: 'Organización del Espacio',
        descripcion: 'Evaluar orden, limpieza y distribución del área de trabajo',
        peso: 2,
        tipo: 'organizacional',
        icon: '📐'
      },
      {
        id: 'safety',
        nombre: 'Seguridad Visual',
        descripcion: 'Detectar riesgos, cables expuestos y elementos peligrosos',
        peso: 3,
        tipo: 'seguridad',
        icon: '🛡️'
      },
      {
        id: 'equipment_state',
        nombre: 'Estado de Equipos',
        descripcion: 'Analizar condición física y funcional de los equipos',
        peso: 2,
        tipo: 'tecnico',
        icon: '💻'
      },
      {
        id: 'labeling',
        nombre: 'Etiquetado e Identificación',
        descripcion: 'Verificar identificación correcta de equipos y conexiones',
        peso: 1,
        tipo: 'organizacional',
        icon: '🏷️'
      }
    ],
    batch: [
      {
        id: 'consistency',
        nombre: 'Consistencia entre Documentos',
        descripcion: 'Verificar coherencia de información entre múltiples archivos',
        peso: 3,
        tipo: 'tecnico',
        icon: '🔄'
      },
      {
        id: 'completeness_set',
        nombre: 'Completitud del Set',
        descripcion: 'Evaluar si el conjunto de archivos está completo',
        peso: 2,
        tipo: 'organizacional',
        icon: '📦'
      },
      {
        id: 'version_control',
        nombre: 'Control de Versiones',
        descripcion: 'Verificar versiones actualizadas y compatibilidad',
        peso: 2,
        tipo: 'tecnico',
        icon: '🔖'
      }
    ]
  };

  const criteriaTypes = [
    { id: 'tecnico', label: 'Técnico', color: 'var(--accent-primary)', icon: '⚙️' },
    { id: 'normativo', label: 'Normativo', color: 'var(--success)', icon: '✅' },
    { id: 'seguridad', label: 'Seguridad', color: 'var(--error)', icon: '🔒' },
    { id: 'organizacional', label: 'Organizacional', color: 'var(--warning)', icon: '📐' },
    { id: 'formato', label: 'Formato', color: 'var(--info)', icon: '📝' }
  ];

  const addCriterion = (criterion) => {
    const newCrit = {
      ...criterion,
      id: criterion.id || `custom_${Date.now()}`,
      isCustom: !criterion.id
    };
    setCriteria(prev => [...prev, newCrit]);
  };

  const removeCriterion = (criterionId) => {
    setCriteria(prev => prev.filter(c => c.id !== criterionId));
  };

  const updateCriterionWeight = (criterionId, newWeight) => {
    setCriteria(prev => prev.map(c => 
      c.id === criterionId ? { ...c, peso: newWeight } : c
    ));
  };

  const handleAddCustomCriterion = () => {
    if (!newCriterion.nombre || !newCriterion.descripcion) {
      alert('Complete el nombre y descripción del criterio');
      return;
    }

    addCriterion(newCriterion);
    setNewCriterion({
      nombre: '',
      descripcion: '',
      peso: 1,
      tipo: 'tecnico'
    });
    setShowAddForm(false);
  };

  const getTypeColor = (tipo) => {
    const typeObj = criteriaTypes.find(t => t.id === tipo);
    return typeObj ? typeObj.color : 'var(--text-secondary)';
  };

  const getTypeIcon = (tipo) => {
    const typeObj = criteriaTypes.find(t => t.id === tipo);
    return typeObj ? typeObj.icon : '📋';
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.peso, 0);

  return (
    <div 
      className="card rounded-xl p-6"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
        boxShadow: '0 4px 12px var(--shadow-light)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          🎯 Criterios de Evaluación
        </h3>
        <div 
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent-primary)'
          }}
        >
          Peso Total: {totalWeight}
        </div>
      </div>

      {/* Predefined Criteria */}
      <div className="mb-6">
        <h4 
          className="text-lg font-medium mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          📋 Criterios Predefinidos
        </h4>
        <div className="space-y-2">
          {predefinedCriteria[analysisType]?.map((criterion) => {
            const isSelected = criteria.some(c => c.id === criterion.id);
            return (
              <div 
                key={criterion.id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isSelected ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)',
                  ringColor: 'var(--accent-primary)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{criterion.icon}</span>
                    <div>
                      <div 
                        className="font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {criterion.nombre}
                      </div>
                      <div 
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {criterion.descripcion}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span 
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: getTypeColor(criterion.tipo) + '20',
                            color: getTypeColor(criterion.tipo)
                          }}
                        >
                          {getTypeIcon(criterion.tipo)} {criteriaTypes.find(t => t.id === criterion.tipo)?.label}
                        </span>
                        <span 
                          className="text-xs"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Peso: {criterion.peso}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => updateCriterionWeight(criterion.id, Math.max(1, criterion.peso - 1))}
                          className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          -
                        </button>
                        <span 
                          className="w-8 text-center text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {criteria.find(c => c.id === criterion.id)?.peso || criterion.peso}
                        </span>
                        <button
                          onClick={() => updateCriterionWeight(criterion.id, Math.min(5, criterion.peso + 1))}
                          className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => isSelected ? removeCriterion(criterion.id) : addCriterion(criterion)}
                      className="px-3 py-1 rounded text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? 'var(--error)' : 'var(--accent-primary)',
                        color: 'white'
                      }}
                    >
                      {isSelected ? 'Quitar' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Criteria */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 
            className="text-lg font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            ⚡ Criterios Personalizados
          </h4>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: 'var(--accent-secondary)',
              color: 'white'
            }}
          >
            {showAddForm ? 'Cancelar' : '+ Agregar Criterio'}
          </button>
        </div>

        {/* Add Custom Criterion Form */}
        {showAddForm && (
          <div 
            className="p-4 rounded-lg mb-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Nombre del Criterio
                </label>
                <input 
                  type="text"
                  value={newCriterion.nombre}
                  onChange={(e) => setNewCriterion(prev => ({
                    ...prev,
                    nombre: e.target.value
                  }))}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Ej: Validación de configuración"
                />
              </div>
              
              <div>
                <label 
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Tipo
                </label>
                <select 
                  value={newCriterion.tipo}
                  onChange={(e) => setNewCriterion(prev => ({
                    ...prev,
                    tipo: e.target.value
                  }))}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {criteriaTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label 
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Descripción
                </label>
                <textarea 
                  value={newCriterion.descripcion}
                  onChange={(e) => setNewCriterion(prev => ({
                    ...prev,
                    descripcion: e.target.value
                  }))}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                  rows="2"
                  placeholder="Describe qué debe evaluar este criterio..."
                />
              </div>
              
              <div>
                <label 
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Peso (1-5)
                </label>
                <input 
                  type="number"
                  min="1"
                  max="5"
                  value={newCriterion.peso}
                  onChange={(e) => setNewCriterion(prev => ({
                    ...prev,
                    peso: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div className="flex items-end">
                <button 
                  onClick={handleAddCustomCriterion}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white'
                  }}
                >
                  Agregar Criterio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Criteria List */}
        <div className="space-y-2">
          {criteria.filter(c => c.isCustom).map((criterion) => (
            <div 
              key={criterion.id}
              className="p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--warning-bg)',
                borderColor: 'var(--warning)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">⚡</span>
                  <div>
                    <div 
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {criterion.nombre}
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {criterion.descripcion}
                    </div>
                    <span 
                      className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                      style={{
                        backgroundColor: getTypeColor(criterion.tipo) + '20',
                        color: getTypeColor(criterion.tipo)
                      }}
                    >
                      {getTypeIcon(criterion.tipo)} {criteriaTypes.find(t => t.id === criterion.tipo)?.label} • Peso: {criterion.peso}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => removeCriterion(criterion.id)}
                  className="px-3 py-1 rounded text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--error)',
                    color: 'white'
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {criteria.length > 0 && (
        <div 
          className="p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--success-bg)',
            borderColor: 'var(--success)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h5 
                className="font-medium"
                style={{ color: 'var(--success)' }}
              >
                ✅ Criterios Configurados
              </h5>
              <p 
                className="text-sm"
                style={{ color: 'var(--success)' }}
              >
                {criteria.length} criterios seleccionados con peso total de {totalWeight}
              </p>
            </div>
            <div 
              className="text-2xl font-bold"
              style={{ color: 'var(--success)' }}
            >
              {criteria.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriteriaConfig;