import React, { useState, useRef, useCallback } from 'react';

const ETLUploader = ({ onFileSelect, onFileRemove, processing = false, acceptedTypes = ['.xlsx', '.xls', '.csv'] }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls) o CSV.');
    }
    
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Tamaño máximo: 50MB');
    }
    
    return true;
  };

  const previewFile = async (file) => {
    if (file.type === 'text/csv') {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          const lines = text.split('\n').slice(0, 5); // Primeras 5 líneas
          const preview = {
            type: 'csv',
            headers: lines[0]?.split(',') || [],
            sampleRows: lines.slice(1).map(line => line.split(',')),
            totalLines: text.split('\n').length
          };
          resolve(preview);
        };
        reader.readAsText(file, 'UTF-8');
      });
    } else {
      // Para Excel, solo mostramos info básica sin parser completo
      return {
        type: 'excel',
        name: file.name,
        size: file.size,
        message: 'Archivo Excel detectado. El preview detallado estará disponible después del procesamiento.'
      };
    }
  };

  const handleFiles = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      validateFile(file);
      
      setSelectedFile(file);
      
      // Generar preview
      const preview = await previewFile(file);
      setPreviewData(preview);
      
      onFileSelect(file);
    } catch (error) {
      alert(error.message);
    }
  }, [onFileSelect]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemove();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      {!selectedFile && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-[var(--accent-primary)] bg-[rgba(123,104,238,0.05)]' 
              : 'border-[var(--border-primary)] hover:border-[var(--accent-secondary)]'
          } ${processing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          style={{
            backgroundColor: dragActive ? 'rgba(123, 104, 238, 0.05)' : 'var(--bg-secondary)'
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={processing}
          />
          
          <div className="space-y-4">
            <div 
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{
                backgroundColor: dragActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: dragActive ? 'white' : 'var(--text-secondary)'
              }}
            >
              {dragActive ? '📥' : '📁'}
            </div>
            
            <div>
              <h3 
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {dragActive ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo de parque informático'}
              </h3>
              <p 
                className="text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                O <span 
                  className="font-medium underline"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  haz clic para seleccionar
                </span>
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span 
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success)'
                  }}
                >
                  📊 Excel (.xlsx, .xls)
                </span>
                <span 
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--info-bg)',
                    color: 'var(--info)'
                  }}
                >
                  📄 CSV (.csv)
                </span>
              </div>
              
              <p 
                className="text-xs mt-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                Tamaño máximo: 50MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Selected Preview */}
      {selectedFile && (
        <div 
          className="border rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--success)'
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                style={{
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)'
                }}
              >
                {selectedFile.type.includes('csv') ? '📄' : '📊'}
              </div>
              <div>
                <h3 
                  className="font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {selectedFile.name}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {formatBytes(selectedFile.size)} • {selectedFile.type.includes('csv') ? 'CSV' : 'Excel'}
                </p>
              </div>
            </div>
            
            {!processing && (
              <button
                onClick={removeFile}
                className="text-sm px-3 py-1 rounded hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'var(--error-bg)',
                  color: 'var(--error)'
                }}
              >
                🗑️ Remover
              </button>
            )}
          </div>

          {/* Preview Data */}
          {previewData && (
            <div 
              className="border-t pt-4"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <h4 
                className="text-sm font-medium mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                👁️ Vista Previa
              </h4>
              
              {previewData.type === 'csv' && (
                <div className="space-y-3">
                  <div>
                    <p 
                      className="text-xs mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Columnas detectadas ({previewData.headers.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {previewData.headers.slice(0, 8).map((header, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: 'var(--info-bg)',
                            color: 'var(--info)'
                          }}
                        >
                          {header.trim()}
                        </span>
                      ))}
                      {previewData.headers.length > 8 && (
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          +{previewData.headers.length - 8} más
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p 
                      className="text-xs mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Primeras filas de datos:
                    </p>
                    <div 
                      className="bg-[var(--bg-secondary)] rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {previewData.sampleRows.slice(0, 4).map((row, idx) => (
                        <div key={idx} className="mb-1">
                          {row.slice(0, 5).join(' | ')}
                          {row.length > 5 && ' | ...'}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p 
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    📈 Total de filas detectadas: ~{previewData.totalLines}
                  </p>
                </div>
              )}
              
              {previewData.type === 'excel' && (
                <div 
                  className="p-4 rounded-lg text-center"
                  style={{
                    backgroundColor: 'var(--info-bg)',
                    color: 'var(--info)'
                  }}
                >
                  <p className="text-sm">{previewData.message}</p>
                </div>
              )}
            </div>
          )}

          {processing && (
            <div 
              className="border-t pt-4"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
                <span 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Procesando archivo...
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ETLUploader;