/**
 * ResourcesView.jsx
 * 
 * Vista para mostrar los recursos de software y herramientas disponibles.
 * Organiza los recursos por subcategorías con diseño de tarjetas.
 * 
 * Características:
 * - Diseño de grid responsive
 * - Filtro por subcategorías
 * - Soporte completo para Dark/Light theme
 * - Animaciones suaves
 */

import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  ExternalLink,
  Music2,
  Sliders,
  Wrench,
  Package,
  Search,
  Filter,
} from 'lucide-react';

// Importar datos de software
import { softwareCategories } from '../../data';

// ═══════════════════════════════════════════════════════════════════════════════
//   📦 COMPONENTE DE TARJETA DE RECURSO
// ═══════════════════════════════════════════════════════════════════════════════

const ResourceCard = memo(function ResourceCard({ resource }) {
  return (
    <div className="glass-card rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
      {/* Icono y nombre */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Package size={24} className="text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text)] truncate mb-1">
            {resource.name}
          </h3>
          {resource.type && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              {resource.type}
            </span>
          )}
        </div>
      </div>

      {/* Descripción */}
      {resource.description && (
        <p className="mt-3 text-sm text-[var(--text-muted)] line-clamp-2">
          {resource.description}
        </p>
      )}

      {/* Botón de descarga */}
      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg
            bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white
            font-medium transition-all duration-200 active:scale-[0.98]
          "
        >
          <Download size={18} />
          Descargar
        </a>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
//   📂 COMPONENTE DE SECCIÓN DE CATEGORÍA
// ═══════════════════════════════════════════════════════════════════════════════

// Renderizar el ícono basado en el id de categoría
const renderCategoryIcon = (categoryId) => {
  const iconProps = { size: 22, className: "text-[var(--accent)]" };
  switch (categoryId) {
    case 'daws': return <Music2 {...iconProps} />;
    case 'plugins': return <Sliders {...iconProps} />;
    case 'utilidades': return <Wrench {...iconProps} />;
    default: return <Package {...iconProps} />;
  }
};

const CategorySection = memo(function CategorySection({ category }) {
  if (!category.items || category.items.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      {/* Header de categoría */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
          {renderCategoryIcon(category.id)}
        </div>
        <div>
          <h2 className="text-xl font-bold">{category.name}</h2>
          {category.description && (
            <p className="text-sm text-[var(--text-muted)]">{category.description}</p>
          )}
        </div>
        <span className="ml-auto text-sm text-[var(--text-subtle)] tabular-nums">
          {category.items.length} {category.items.length === 1 ? 'recurso' : 'recursos'}
        </span>
      </div>

      {/* Grid de recursos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {category.items.map((resource) => (
          <ResourceCard key={resource.id || resource.name} resource={resource} />
        ))}
      </div>
    </section>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
//   🏠 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const ResourcesView = memo(function ResourcesView({ selectedCategory = null, onCategoryChange }) {
  const { t: _t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Usar selectedCategory del prop directamente para mantener sincronía con el sidebar
  const activeFilter = selectedCategory || 'all';
  
  // Handler para cambiar categoría (notifica al padre para sincronizar sidebar)
  const handleFilterChange = (categoryId) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId === 'all' ? null : categoryId);
    }
  };

  // Filtrar categorías y recursos
  const filteredData = useMemo(() => {
    let categories = softwareCategories;

    // Filtrar por categoría seleccionada
    if (activeFilter && activeFilter !== 'all') {
      categories = categories.filter(cat => cat.id === activeFilter);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      categories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query)
        ),
      })).filter(cat => cat.items.length > 0);
    }

    return categories;
  }, [activeFilter, searchQuery]);

  // Contar total de recursos
  const totalResources = useMemo(() => {
    return softwareCategories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
  }, []);

  // Estado vacío
  const isEmpty = filteredData.length === 0 || filteredData.every(cat => cat.items.length === 0);

  return (
    <div className="min-h-full pb-8">
      {/* Header - Centralizado */}
      <div className="mb-8 text-center">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <Package size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Software y Herramientas</h1>
            <p className="text-[var(--text-muted)]">
              {totalResources} recursos disponibles para producción musical
            </p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda - Centralizados */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-center">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md w-full">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            type="text"
            placeholder="Buscar software..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5 rounded-lg
              bg-[var(--input-bg)] border border-[var(--input-border)]
              text-[var(--text)] placeholder-[var(--text-subtle)]
              focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]
              transition-all duration-200
            "
          />
        </div>

        {/* Filtro por categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 flex-shrink-0">
          <Filter size={18} className="text-[var(--text-subtle)] flex-shrink-0" />
          <button
            onClick={() => handleFilterChange('all')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
              ${activeFilter === 'all'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--hover)]'
              }
            `}
          >
            Todos
          </button>
          {softwareCategories.map((cat) => {
            return (
              <button
                key={cat.id}
                onClick={() => handleFilterChange(cat.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${activeFilter === cat.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--hover)]'
                  }
                `}
              >
                {cat.id === 'daws' && <Music2 size={16} />}
                {cat.id === 'plugins' && <Sliders size={16} />}
                {cat.id === 'utilidades' && <Wrench size={16} />}
                {!['daws', 'plugins', 'utilidades'].includes(cat.id) && <Package size={16} />}
                {cat.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      {isEmpty ? (
        <div className="text-center py-16">
          <Package size={64} className="mx-auto text-[var(--text-subtle)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {searchQuery ? 'No se encontraron resultados' : 'No hay recursos disponibles'}
          </h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            {searchQuery
              ? `No hay recursos que coincidan con "${searchQuery}". Intenta con otra búsqueda.`
              : 'Pronto agregaremos más recursos. ¡Vuelve a visitarnos!'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] transition-colors"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div>
          {filteredData.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
});

export default ResourcesView;
