// SearchInput.jsx - Componente de búsqueda con alineación correcta
import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchInput = ({ 
  placeholder = "Buscar...", 
  value = "", 
  onChange, 
  className = "",
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "h-9 text-sm",
    md: "h-11 text-sm", 
    lg: "h-12 text-base"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const paddingLeft = {
    sm: "pl-9",
    md: "pl-11", 
    lg: "pl-12"
  };

  return (
    <div className={`relative search-container ${className}`}>
      {/* Icono de búsqueda posicionado correctamente */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <MagnifyingGlassIcon 
          className={`${iconSizes[size]}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
      
      {/* Input con padding correcto para el icono */}
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          search-input w-full ${paddingLeft[size]} pr-4 py-2 
          rounded-lg border transition-all duration-200 
          ${sizeClasses[size]}
        `}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-primary)'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--brand-primary)';
          e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
          e.target.style.backgroundColor = 'var(--bg-card)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-primary)';
          e.target.style.boxShadow = 'none';
          e.target.style.backgroundColor = 'var(--bg-secondary)';
        }}
      />
    </div>
  );
};

export default SearchInput;