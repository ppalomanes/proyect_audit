import React, { useState, useEffect } from 'react';
import { useETLStore } from './etlStore';

const ETLProcessor = () => {
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({
    strict_mode: false,
    auto_fix: true,
    skip_validation: []
  });

  const {
    processing,
    processResult,
    statistics,
    configuration,
    error,
    uploadAndProcess,
    getConfiguration,
    getStatistics,
    clearError,
    clearResults
  } = useETLStore();

  const auditoriaId = 'demo-audit-id'; // En implementación real, esto vendría de contexto

  useEffect(() => {
    getConfiguration();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        clearError();
      } else {
        alert('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV');
      }
    }
  };

  const handleProcess = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    const result = await uploadAndProcess(file, auditoriaId, options);
    if (result.success) {
      // Obtener estadísticas después del procesamiento
      await getStatistics(auditoriaId);
    }
  };

  const handleClear = () => {
    setFile(null);
    clearResults();
    clearError();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔄 Procesador ETL - Parque Informático
        </h1>
        <p className="text-gray-600">
          Carga y procesa archivos Excel/CSV del inventario tecnológico
        </p>
      </div>

      {/* Upload Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">📁 Cargar Archivo</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo (Excel o CSV)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {file && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">📄 {file.name}</p>
                  <p className="text-xs text-blue-700">Tamaño: {formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-blue-700 hover:text-blue-900 text-sm"
                >
                  ✕ Remover
                </button>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">⚙️ Opciones de Procesamiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.strict_mode}
                  onChange={(e) => setOptions({...options, strict_mode: e.target.checked})}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Modo estricto (solo registros 100% válidos)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.auto_fix}
                  onChange={(e) => setOptions({...options, auto_fix: e.target.checked})}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Correcciones automáticas</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleProcess}
              disabled={!file || processing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? '🔄 Procesando...' : '🚀 Procesar Archivo'}
            </button>
            
            {(file || processResult) && (
              <button
                onClick={handleClear}
                className="btn-secondary"
              >
                🗑️ Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error de Procesamiento</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {processResult && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">📊 Resultados del Procesamiento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-700 text-sm font-medium">Registros Procesados</div>
              <div className="text-2xl font-bold text-green-900">{processResult.registros_procesados}</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-700 text-sm font-medium">Registros Originales</div>
              <div className="text-2xl font-bold text-blue-900">{processResult.registros_originales}</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-700 text-sm font-medium">Score Validación</div>
              <div className="text-2xl font-bold text-purple-900">
                {processResult.validaciones?.scoreValidacion || 0}%
              </div>
            </div>
          </div>

          {/* Validation Details */}
          {processResult.validaciones && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">🔍 Detalles de Validación</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {processResult.validaciones.errores?.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-red-700 text-sm font-medium mb-2">❌ Errores ({processResult.validaciones.errores.length})</div>
                    <div className="text-xs text-red-600 max-h-32 overflow-y-auto">
                      {processResult.validaciones.errores.slice(0, 3).map((error, idx) => (
                        <div key={idx} className="mb-1">• {error.mensaje || error.message}</div>
                      ))}
                      {processResult.validaciones.errores.length > 3 && (
                        <div className="text-red-500">... y {processResult.validaciones.errores.length - 3} más</div>
                      )}
                    </div>
                  </div>
                )}

                {processResult.validaciones.advertencias?.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-yellow-700 text-sm font-medium mb-2">⚠️ Advertencias ({processResult.validaciones.advertencias.length})</div>
                    <div className="text-xs text-yellow-600 max-h-32 overflow-y-auto">
                      {processResult.validaciones.advertencias.slice(0, 3).map((warning, idx) => (
                        <div key={idx} className="mb-1">• {warning.mensaje || warning.message}</div>
                      ))}
                      {processResult.validaciones.advertencias.length > 3 && (
                        <div className="text-yellow-500">... y {processResult.validaciones.advertencias.length - 3} más</div>
                      )}
                    </div>
                  </div>
                )}

                {processResult.validaciones.informacion?.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-blue-700 text-sm font-medium mb-2">ℹ️ Información ({processResult.validaciones.informacion.length})</div>
                    <div className="text-xs text-blue-600 max-h-32 overflow-y-auto">
                      {processResult.validaciones.informacion.slice(0, 3).map((info, idx) => (
                        <div key={idx} className="mb-1">• {info.mensaje || info.message}</div>
                      ))}
                      {processResult.validaciones.informacion.length > 3 && (
                        <div className="text-blue-500">... y {processResult.validaciones.informacion.length - 3} más</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">📈 Estadísticas de Auditoría</h2>
          
          {statistics.mensaje ? (
            <p className="text-gray-600">{statistics.mensaje}</p>
          ) : (
            <div className="space-y-6">
              {/* Hardware Stats */}
              {statistics.hardware_stats && (
                <div>
                  <h3 className="text-lg font-medium mb-3">💻 Estadísticas de Hardware</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-gray-700 text-sm font-medium">RAM Promedio</div>
                      <div className="text-xl font-bold text-gray-900">{statistics.hardware_stats.ram_promedio} GB</div>
                    </div>
                    
                    {statistics.hardware_stats.cpu_brands && Object.keys(statistics.hardware_stats.cpu_brands).length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-gray-700 text-sm font-medium mb-2">Marcas de CPU</div>
                        {Object.entries(statistics.hardware_stats.cpu_brands).map(([brand, count]) => (
                          <div key={brand} className="text-sm flex justify-between">
                            <span>{brand}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {statistics.hardware_stats.os_distribution && Object.keys(statistics.hardware_stats.os_distribution).length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-gray-700 text-sm font-medium mb-2">Sistemas Operativos</div>
                        {Object.entries(statistics.hardware_stats.os_distribution).map(([os, count]) => (
                          <div key={os} className="text-sm flex justify-between">
                            <span>{os}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Distribution Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {statistics.distribucion_por_sitio && Object.keys(statistics.distribucion_por_sitio).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">📍 Distribución por Sitio</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {Object.entries(statistics.distribucion_por_sitio).map(([sitio, count]) => (
                        <div key={sitio} className="flex justify-between py-1">
                          <span className="text-sm">{sitio}</span>
                          <span className="text-sm font-medium">{count} equipos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {statistics.distribucion_por_atencion && Object.keys(statistics.distribucion_por_atencion).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">📞 Distribución por Atención</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {Object.entries(statistics.distribucion_por_atencion).map(([atencion, count]) => (
                        <div key={atencion} className="flex justify-between py-1">
                          <span className="text-sm">{atencion}</span>
                          <span className="text-sm font-medium">{count} equipos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Info */}
      {configuration && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">⚙️ Configuración ETL</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">📋 Campos Requeridos</h3>
              <div className="bg-green-50 p-3 rounded">
                <div className="flex flex-wrap gap-1">
                  {configuration.campos_requeridos?.map((campo) => (
                    <span key={campo} className="badge badge-success text-xs">{campo}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">📝 Formatos Soportados</h3>
              <div className="bg-blue-50 p-3 rounded">
                <div className="flex flex-wrap gap-1">
                  {configuration.formatos_soportados?.map((formato) => (
                    <span key={formato} className="badge badge-info text-xs">.{formato}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">🎯 Tipos de Atención</h3>
              <div className="bg-purple-50 p-3 rounded">
                <div className="flex flex-wrap gap-1">
                  {configuration.tipos_atencion?.map((tipo) => (
                    <span key={tipo} className="badge bg-purple-100 text-purple-800 text-xs">{tipo}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">✅ Validaciones Activas</h3>
              <div className="bg-yellow-50 p-3 rounded max-h-32 overflow-y-auto">
                {configuration.validaciones_activas?.map((validacion) => (
                  <div key={validacion.name} className="text-xs text-yellow-800 mb-1">
                    • {validacion.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ETLProcessor;
