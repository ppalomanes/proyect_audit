import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText,
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuditoriaStore } from '../AuditoriaStore';
import { auditoriaService } from '../services/auditoriaService';

const ParqueInformaticoModal = ({ isOpen, onClose, auditoriaId }) => {
  const { 
    auditoriaActual, 
    actualizarParqueInformatico,
    agregarIncumplimiento 
  } = useAuditoriaStore();

  // Estados locales
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progreso, setProgreso] = useState(0);
  const [resultados, setResultados] = useState(null);
  const [validaciones, setValidaciones] = useState(null);
  const [error, setError] = useState(null);
  const [etapaActual, setEtapaActual] = useState('upload'); // upload, validating, results
  const [configuracion, setConfiguracion] = useState({
    strict_mode: false,
    auto_fix: true,
    scoring_ia: true
  });

  // Configuración de dropzone
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError('Formato de archivo no válido. Solo se aceptan archivos .xlsx, .xls, .csv');
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setArchivo(file);
      setError(null);
      setResultados(null);
      setValidaciones(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    multiple: false
  });

  // Procesar archivo
  const procesarArchivo = async () => {
    if (!archivo) return;

    setProcesando(true);
    setError(null);
    setEtapaActual('validating');

    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('configuracion', JSON.stringify(configuracion));

      const response = await auditoriaService.procesarParqueInformatico(auditoriaId, formData);
      
      if (response.success) {
        setJobId(response.job_id);
        // Iniciar polling para obtener progreso
        iniciarPollingProgreso(response.job_id);
      } else {
        throw new Error(response.message || 'Error al procesar archivo');
      }
    } catch (err) {
      setError(err.message);
      setProcesando(false);
      setEtapaActual('upload');
    }
  };

  // Polling para obtener progreso del job
  const iniciarPollingProgreso = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await auditoriaService.obtenerEstadoJob(jobId);
        
        if (statusResponse.success) {
          const { estado, progreso: prog, error: jobError } = statusResponse.data;
          
          setProgreso(prog || 0);

          if (estado === 'COMPLETADO') {
            clearInterval(pollInterval);
            await obtenerResultados(jobId);
          } else if (estado === 'ERROR') {
            clearInterval(pollInterval);
            setError(jobError || 'Error en el procesamiento');
            setProcesando(false);
            setEtapaActual('upload');
          }
        }
      } catch (err) {
        console.error('Error obteniendo progreso:', err);
      }
    }, 2000); // Poll cada 2 segundos

    // Cleanup después de 5 minutos
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  // Obtener resultados del procesamiento
  const obtenerResultados = async (jobId) => {
    try {
      const response = await auditoriaService.obtenerResultadosJob(jobId);
      
      if (response.success) {
        setResultados(response.data);
        setValidaciones(response.data.validaciones);
        
        // Actualizar store con resultados
        actualizarParqueInformatico(auditoriaId, {
          archivo_nombre: archivo.name,
          total_equipos: response.data.total_registros,
          equipos_os: response.data.estadisticas?.os_count || 0,
          equipos_ho: response.data.estadisticas?.ho_count || 0,
          equipos_cumplen: response.data.estadisticas?.equipos_validos || 0,
          score_calidad: response.data.score_promedio || 0,
          incumplimientos: response.data.incumplimientos || []
        });

        // Agregar incumplimientos al store si existen
        if (response.data.incumplimientos?.length > 0) {
          response.data.incumplimientos.forEach(inc => {
            agregarIncumplimiento(auditoriaId, inc);
          });
        }

        setEtapaActual('results');
      }
    } catch (err) {
      setError('Error obteniendo resultados: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  // Resetear formulario
  const resetearFormulario = () => {
    setArchivo(null);
    setProgreso(0);
    setResultados(null);
    setValidaciones(null);
    setError(null);
    setEtapaActual('upload');
    setProcesando(false);
    setJobId(null);
  };

  // Cerrar modal
  const handleClose = () => {
    resetearFormulario();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Parque Informático</h2>
            <p className="text-blue-100 text-sm">
              Procesamiento ETL y validación automática de umbrales técnicos
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-6">
          {/* Etapa: Upload */}
          {etapaActual === 'upload' && (
            <div className="space-y-6">
              {/* Configuración */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Configuración de Procesamiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={configuracion.auto_fix}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        auto_fix: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Corrección automática</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={configuracion.scoring_ia}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        scoring_ia: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Análisis con IA</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={configuracion.strict_mode}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        strict_mode: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Modo estricto</span>
                  </label>
                </div>
              </div>

              {/* Zona de drop */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                {archivo ? (
                  <div className="space-y-2">
                    <FileText size={48} className="mx-auto text-green-500" />
                    <div>
                      <p className="font-medium">{archivo.name}</p>
                      <p className="text-sm text-gray-500">
                        {(archivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchivo(null);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remover archivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={48} className="mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo de parque informático'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Formatos aceptados: .xlsx, .xls, .csv (Máximo 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-red-800">Error</p>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarArchivo}
                  disabled={!archivo || procesando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Upload size={16} />
                  <span>Procesar Archivo</span>
                </button>
              </div>
            </div>
          )}

          {/* Etapa: Validating */}
          {etapaActual === 'validating' && (
            <div className="space-y-6">
              <div className="text-center">
                <RefreshCw className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
                <h3 className="text-lg font-medium mb-2">Procesando Parque Informático</h3>
                <p className="text-gray-600 mb-4">
                  Validando {archivo?.name} con umbrales técnicos...
                </p>
                
                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progreso}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{progreso}% completado</p>
              </div>

              {/* Información del procesamiento */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Proceso ETL en ejecución:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Parsing de archivo Excel/CSV</li>
                  <li>✓ Detección automática de campos</li>
                  <li>✓ Normalización de 28 campos</li>
                  <li>→ Validación de umbrales técnicos</li>
                  <li>→ Scoring de calidad de datos</li>
                </ul>
              </div>
            </div>
          )}

          {/* Etapa: Results */}
          {etapaActual === 'results' && resultados && (
            <div className="space-y-6">
              {/* Resumen ejecutivo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {resultados.total_registros}
                  </p>
                  <p className="text-sm text-gray-600">Total Equipos</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp className="text-green-500" size={16} />
                    <p className="text-2xl font-bold text-green-600">
                      {resultados.registros_validos || 0}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">Cumplen</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingDown className="text-red-500" size={16} />
                    <p className="text-2xl font-bold text-red-600">
                      {resultados.registros_con_errores || 0}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">No Cumplen</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {Math.round(resultados.score_promedio || 0)}%
                  </p>
                  <p className="text-sm text-gray-600">Score Calidad</p>
                </div>
              </div>

              {/* Conteos por tipo de atención */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Equipos On Site (OS)</h4>
                  <p className="text-xl font-bold">{resultados.estadisticas?.os_count || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Equipos Home Office (HO)</h4>
                  <p className="text-xl font-bold">{resultados.estadisticas?.ho_count || 0}</p>
                </div>
              </div>

              {/* Lista de incumplimientos */}
              {validaciones?.errores?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-3 flex items-center">
                    <AlertTriangle className="mr-2" size={20} />
                    Equipos con Incumplimientos ({validaciones.errores.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto">
                    {validaciones.errores.slice(0, 10).map((error, index) => (
                      <div key={index} className="mb-2 p-2 bg-white rounded border-l-4 border-red-400">
                        <p className="font-medium text-sm">{error.hostname || `Equipo ${index + 1}`}</p>
                        <p className="text-red-700 text-xs">{error.problema}</p>
                      </div>
                    ))}
                    {validaciones.errores.length > 10 && (
                      <p className="text-sm text-gray-500 text-center mt-2">
                        y {validaciones.errores.length - 10} incumplimientos más...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Advertencias */}
              {validaciones?.advertencias?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertTriangle className="mr-2" size={20} />
                    Advertencias ({validaciones.advertencias.length})
                  </h4>
                  <div className="text-sm text-yellow-700">
                    {validaciones.advertencias.slice(0, 3).map((adv, index) => (
                      <p key={index}>• {adv.mensaje}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-between">
                <div className="space-x-3">
                  <button
                    onClick={resetearFormulario}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw size={16} />
                    <span>Procesar Nuevo Archivo</span>
                  </button>
                  <button
                    onClick={() => window.open(`/api/etl/jobs/${jobId}/export`, '_blank')}
                    className="px-4 py-2 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Descargar Reporte</span>
                  </button>
                </div>
                <div className="space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle size={16} />
                    <span>Confirmar y Continuar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParqueInformaticoModal;
