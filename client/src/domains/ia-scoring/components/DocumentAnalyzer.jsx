import React, { useState, useRef } from 'react';

const DocumentAnalyzer = ({ criteria, onAnalysisStart, ollamaStatus }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [analysisOptions, setAnalysisOptions] = useState({
    tipo_documento: 'technical',
    nivel_detalle: 'completo',
    incluir_metadatos: true,
    generar_resumen: true
  });
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const isPDF = file.type === 'application/pdf';
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB max
      return isPDF && isValidSize;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    if (files.length > validFiles.length) {
      alert('Solo se permiten archivos PDF de máximo 50MB');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    if (selectedFiles.length === 0) {
      alert('Seleccione al menos un archivo PDF');
      return;
    }

    if (ollamaStatus !== 'connected') {
      alert('Ollama no está conectado. El análisis usará datos simulados.');
    }

    // Simular upload y enviar a análisis
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      // Simular progreso de upload
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      }
    }

    // Iniciar análisis
    const analysisData = {
      files: selectedFiles,
      criteria: criteria,
      options: analysisOptions,
      timestamp: new Date().toISOString()
    };

    onAnalysisStart(analysisData);
  };

  const documentTypes = [
    { id: 'technical', label: 'Documento Técnico', icon: '⚙️' },
    { id: 'policy', label: 'Política/Procedimiento', icon: '📋' },
    { id: 'training', label: 'Material de Capacitación', icon: '🎓' },
    { id: 'security', label: 'Documento de Seguridad', icon: '🔒' },
    { id: 'compliance', label: 'Cumplimiento Normativo', icon: '✅' }
  ];

  const detailLevels = [
    { id: 'basico', label: 'Básico', desc: 'Análisis rápido de elementos principales' },
    { id: 'completo', label: 'Completo', desc: 'Análisis detallado con recomendaciones' },
    { id: 'detallado', label: 'Detallado', desc: 'Análisis exhaustivo con métricas avanzadas' }
  ];

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div 
        className={`card rounded-xl p-8 border-2 border-dashed transition-all duration-300 ${
          dragActive ? 'border-blue-400 bg-blue-50' : ''
        }`}
        style={{
          backgroundColor: dragActive ? 'var(--accent-bg)' : 'var(--bg-primary)',
          borderColor: dragActive ? 'var(--accent-primary)' : 'var(--border-primary)',
          boxShadow: '0 4px 12px var(--shadow-light)'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <div className="mb-4">
            <span className="text-6xl">📄</span>
          </div>
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            📄 Subir Documentos PDF
          </h3>
          <p 
            className="mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Arrastra archivos PDF aquí o haz clic para seleccionar
          </p>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white'
            }}
          >
            Seleccionar Archivos PDF
          </button>
          <input 
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <p 
            className="text-sm mt-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Máximo 50MB por archivo • Solo archivos PDF
          </p>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 4px 12px var(--shadow-light)'
          }}
        >
          <h4 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            📁 Archivos Seleccionados ({selectedFiles.length})
          </h4>
          <div className="space-y-3">
            {selectedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <div 
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {file.name}
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                
                {uploadProgress[file.name] !== undefined ? (
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-24 h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <div 
                        className="h-full transition-all duration-300"
                        style={{
                          backgroundColor: 'var(--success)',
                          width: `${uploadProgress[file.name]}%`
                        }}
                      />
                    </div>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: 'var(--success)' }}
                    >
                      {uploadProgress[file.name]}%
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => removeFile(index)}
                    className="p-2 rounded-lg transition-all duration-200 hover:opacity-70"
                    style={{
                      backgroundColor: 'var(--error-bg)',
                      color: 'var(--error)'
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Type */}
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 4px 12px var(--shadow-light)'
          }}
        >
          <h4 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            📋 Tipo de Documento
          </h4>
          <div className="space-y-2">
            {documentTypes.map((type) => (
              <label 
                key={type.id}
                className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: analysisOptions.tipo_documento === type.id ? 'var(--accent-bg)' : 'var(--bg-secondary)'
                }}
              >
                <input 
                  type="radio"
                  name="documentType"
                  value={type.id}
                  checked={analysisOptions.tipo_documento === type.id}
                  onChange={(e) => setAnalysisOptions(prev => ({
                    ...prev,
                    tipo_documento: e.target.value
                  }))}
                  className="hidden"
                />
                <span className="text-xl">{type.icon}</span>
                <span 
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Analysis Level */}
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 4px 12px var(--shadow-light)'
          }}
        >
          <h4 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            🎯 Nivel de Detalle
          </h4>
          <div className="space-y-2">
            {detailLevels.map((level) => (
              <label 
                key={level.id}
                className="flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: analysisOptions.nivel_detalle === level.id ? 'var(--accent-bg)' : 'var(--bg-secondary)'
                }}
              >
                <input 
                  type="radio"
                  name="detailLevel"
                  value={level.id}
                  checked={analysisOptions.nivel_detalle === level.id}
                  onChange={(e) => setAnalysisOptions(prev => ({
                    ...prev,
                    nivel_detalle: e.target.value
                  }))}
                  className="mt-1"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <div>
                  <div 
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {level.label}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {level.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div 
        className="card rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 4px 12px var(--shadow-light)'
        }}
      >
        <h4 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          ⚙️ Opciones Adicionales
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox"
              checked={analysisOptions.incluir_metadatos}
              onChange={(e) => setAnalysisOptions(prev => ({
                ...prev,
                incluir_metadatos: e.target.checked
              }))}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ color: 'var(--text-primary)' }}>
              📊 Incluir metadatos del documento
            </span>
          </label>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox"
              checked={analysisOptions.generar_resumen}
              onChange={(e) => setAnalysisOptions(prev => ({
                ...prev,
                generar_resumen: e.target.checked
              }))}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ color: 'var(--text-primary)' }}>
              📝 Generar resumen ejecutivo
            </span>
          </label>
        </div>
      </div>

      {/* Ollama Status Warning */}
      {ollamaStatus !== 'connected' && (
        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--warning-bg)',
            borderColor: 'var(--warning)',
            color: 'var(--warning)'
          }}
        >
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <div>
              <div className="font-medium">Ollama Desconectado</div>
              <div className="text-sm">
                El análisis se realizará con datos simulados para fines de desarrollo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Analysis Button */}
      <div className="flex justify-center">
        <button 
          onClick={startAnalysis}
          disabled={selectedFiles.length === 0}
          className="px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white'
          }}
        >
          🚀 Iniciar Análisis con LLaMA 3.2
        </button>
      </div>
    </div>
  );
};

export default DocumentAnalyzer;