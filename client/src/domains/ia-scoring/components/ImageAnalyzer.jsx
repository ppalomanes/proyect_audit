import React, { useState, useRef } from 'react';

const ImageAnalyzer = ({ criteria, onAnalysisStart, ollamaStatus }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [analysisOptions, setAnalysisOptions] = useState({
    detectar_objetos: true,
    evaluar_organizacion: true,
    verificar_seguridad: true,
    analizar_equipos: true,
    generar_recomendaciones: true
  });
  const fileInputRef = useRef(null);

  const handleImageSelect = (files) => {
    const validImages = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
      const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      return isImage && isValidSize && validFormats.includes(file.type);
    });

    if (validImages.length > 0) {
      const imagesWithPreview = validImages.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }));
      setSelectedImages(prev => [...prev, ...imagesWithPreview]);
    }

    if (files.length > validImages.length) {
      alert('Solo se permiten imágenes JPEG, PNG, WebP o GIF de máximo 10MB');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    handleImageSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeImage = (id) => {
    setSelectedImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter(img => img.id !== id);
    });
  };

  const startAnalysis = async () => {
    if (selectedImages.length === 0) {
      alert('Seleccione al menos una imagen');
      return;
    }

    if (ollamaStatus !== 'connected') {
      alert('Ollama no está conectado. El análisis usará datos simulados.');
    }

    // Simular upload y enviar a análisis
    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      setUploadProgress(prev => ({ ...prev, [image.id]: 0 }));
      
      // Simular progreso de upload
      for (let progress = 0; progress <= 100; progress += 15) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setUploadProgress(prev => ({ ...prev, [image.id]: progress }));
      }
    }

    // Iniciar análisis
    const analysisData = {
      images: selectedImages,
      criteria: criteria,
      options: analysisOptions,
      timestamp: new Date().toISOString()
    };

    onAnalysisStart(analysisData);
  };

  const analysisCategories = [
    { 
      id: 'detectar_objetos', 
      icon: '🔍', 
      title: 'Detección de Objetos',
      desc: 'Identificar equipos, dispositivos y elementos técnicos'
    },
    { 
      id: 'evaluar_organizacion', 
      icon: '📐', 
      title: 'Evaluación de Organización',
      desc: 'Verificar orden, limpieza y distribución del espacio'
    },
    { 
      id: 'verificar_seguridad', 
      icon: '🛡️', 
      title: 'Verificación de Seguridad',
      desc: 'Detectar riesgos, cables expuestos, elementos peligrosos'
    },
    { 
      id: 'analizar_equipos', 
      icon: '💻', 
      title: 'Análisis de Equipos',
      desc: 'Evaluar estado, condición y especificaciones visibles'
    },
    { 
      id: 'generar_recomendaciones', 
      icon: '💡', 
      title: 'Generar Recomendaciones',
      desc: 'Sugerir mejoras y acciones correctivas específicas'
    }
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
            <span className="text-6xl">🖼️</span>
          </div>
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            📷 Subir Imágenes para Análisis Visual
          </h3>
          <p 
            className="mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Arrastra imágenes aquí o haz clic para seleccionar
          </p>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-secondary)',
              color: 'white'
            }}
          >
            Seleccionar Imágenes
          </button>
          <input 
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelect(e.target.files)}
          />
          <p 
            className="text-sm mt-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Máximo 10MB por imagen • JPEG, PNG, WebP, GIF
          </p>
        </div>
      </div>

      {/* Selected Images */}
      {selectedImages.length > 0 && (
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
            🖼️ Imágenes Seleccionadas ({selectedImages.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedImages.map((image) => (
              <div 
                key={image.id}
                className="relative group rounded-lg overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <img 
                  src={image.preview}
                  alt={image.file.name}
                  className="w-full h-32 object-cover"
                />
                
                {/* Overlay with file info */}
                <div 
                  className="absolute bottom-0 left-0 right-0 p-3"
                  style={{
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                  }}
                >
                  <div className="text-white">
                    <div className="text-sm font-medium truncate">
                      {image.file.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {(image.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button 
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  style={{
                    backgroundColor: 'var(--error)',
                    color: 'white'
                  }}
                >
                  ✕
                </button>

                {/* Upload progress */}
                {uploadProgress[image.id] !== undefined && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--success)',
                      width: `${uploadProgress[image.id]}%`
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Options */}
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
          🎯 Opciones de Análisis Visual
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisCategories.map((category) => (
            <label 
              key={category.id}
              className="flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-all duration-200"
              style={{
                backgroundColor: analysisOptions[category.id] ? 'var(--accent-bg)' : 'var(--bg-secondary)'
              }}
            >
              <input 
                type="checkbox"
                checked={analysisOptions[category.id]}
                onChange={(e) => setAnalysisOptions(prev => ({
                  ...prev,
                  [category.id]: e.target.checked
                }))}
                className="mt-1"
                style={{ accentColor: 'var(--accent-secondary)' }}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{category.icon}</span>
                  <span 
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {category.title}
                  </span>
                </div>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {category.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Moondream Info */}
      <div 
        className="card rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 4px 12px var(--shadow-light)'
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🌙</div>
          <div>
            <h4 
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Análisis con Moondream
            </h4>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Modelo de visión por computadora especializado en análisis técnico e industrial
            </p>
          </div>
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: ollamaStatus === 'connected' ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: ollamaStatus === 'connected' ? 'var(--success)' : 'var(--warning)'
            }}
          >
            {ollamaStatus === 'connected' ? '✅ Conectado' : '⚠️ Simulado'}
          </div>
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
              <div className="font-medium">Moondream No Disponible</div>
              <div className="text-sm">
                El análisis de imágenes se realizará con datos simulados para fines de desarrollo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Preview */}
      {selectedImages.length > 0 && (
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--info-bg)',
            borderColor: 'var(--info)'
          }}
        >
          <h4 
            className="text-lg font-semibold mb-3"
            style={{ color: 'var(--info)' }}
          >
            📊 Resumen del Análisis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div 
                className="text-2xl font-bold"
                style={{ color: 'var(--info)' }}
              >
                {selectedImages.length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--info)' }}
              >
                Imágenes
              </div>
            </div>
            <div>
              <div 
                className="text-2xl font-bold"
                style={{ color: 'var(--info)' }}
              >
                {Object.values(analysisOptions).filter(Boolean).length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--info)' }}
              >
                Categorías
              </div>
            </div>
            <div>
              <div 
                className="text-2xl font-bold"
                style={{ color: 'var(--info)' }}
              >
                {criteria.length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--info)' }}
              >
                Criterios
              </div>
            </div>
            <div>
              <div 
                className="text-2xl font-bold"
                style={{ color: 'var(--info)' }}
              >
                ~{selectedImages.length * 2}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--info)' }}
              >
                Min Estimados
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Analysis Button */}
      <div className="flex justify-center">
        <button 
          onClick={startAnalysis}
          disabled={selectedImages.length === 0}
          className="px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            backgroundColor: 'var(--accent-secondary)',
            color: 'white'
          }}
        >
          🌙 Iniciar Análisis con Moondream
        </button>
      </div>
    </div>
  );
};

export default ImageAnalyzer;