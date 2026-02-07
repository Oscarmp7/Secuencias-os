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

import { memo, useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
} from 'lucide-react';

// Importar datos de software
import { softwareCategories } from '../../data';

// Filtros por instrumento
const INSTRUMENT_FILTERS = [
  { id: 'keys', labelKey: 'resources.instruments.keys' },
  { id: 'drums', labelKey: 'resources.instruments.drums' },
  { id: 'guitars', labelKey: 'resources.instruments.guitars' },
  { id: 'pads', labelKey: 'resources.instruments.pads' },
  { id: 'strings', labelKey: 'resources.instruments.strings' },
  { id: 'vocals', labelKey: 'resources.instruments.vocals' },
  { id: 'fx', labelKey: 'resources.instruments.fx' },
  { id: 'samplers', labelKey: 'resources.instruments.samplers' },
  { id: 'other', labelKey: 'resources.instruments.other' },
];

// ═══════════════════════════════════════════════════════════════════════════════
//   📦 COMPONENTE DE TARJETA DE RECURSO
// ═══════════════════════════════════════════════════════════════════════════════

const ResourceCard = memo(function ResourceCard({ resource, t }) {
  return (
    <div className="glass-card rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group flex flex-col h-full">
      <div className="flex-1">
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

        {/* Tags de instrumentos */}
        {Array.isArray(resource.instrumentos) && resource.instrumentos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resource.instrumentos.map((inst) => (
              <span
                key={inst}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)]"
              >
                {t(`resources.instruments.${inst}`)}
              </span>
            ))}
          </div>
        )}
      </div>

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
          {t('resources.download')}
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

const CategorySection = memo(function CategorySection({ category, t }) {
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
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold">{category.name}</h2>
        </div>
        <span className="ml-auto text-sm text-[var(--text-subtle)] tabular-nums whitespace-nowrap flex-shrink-0 text-right">
          {category.items.length === 1 
            ? t('resources.resourceCount', { count: category.items.length })
            : t('resources.resourceCountPlural', { count: category.items.length })}
        </span>
      </div>

      {/* Grid de recursos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {category.items.map((resource) => (
          <ResourceCard key={resource.id || resource.name} resource={resource} t={t} />
        ))}
      </div>
    </section>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
//   🏠 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const ResourcesView = memo(function ResourcesView({ selectedCategory = null, onCategoryChange }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('');
  const [instrumentMenuOpen, setInstrumentMenuOpen] = useState(false);
  const instrumentMenuRef = useRef(null);
  const instrumentRows = useMemo(() => ([
    INSTRUMENT_FILTERS.slice(0, 4),
    INSTRUMENT_FILTERS.slice(4),
  ]), []);
  
  // Usar selectedCategory del prop directamente para mantener sincronía con el sidebar
  const activeFilter = selectedCategory || 'all';

  // Detectar si hay datos con instrumentos (para activar filtros reales en el futuro)
  const hasInstrumentData = useMemo(() => {
    return softwareCategories.some(cat =>
      cat.items?.some(item => Array.isArray(item.instrumentos) && item.instrumentos.length > 0)
    );
  }, []);
  
  // Handler para cambiar categoría (notifica al padre para sincronizar sidebar)
  const handleFilterChange = (categoryId) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId === 'all' ? null : categoryId);
    }
  };

  // Resetear filtros de instrumentos cuando no estamos en plugins
  useEffect(() => {
    if (activeFilter !== 'plugins' && instrumentFilter) {
      setInstrumentFilter('');
    }
    if (activeFilter !== 'plugins' && instrumentMenuOpen) {
      setInstrumentMenuOpen(false);
    }
  }, [activeFilter, instrumentFilter, instrumentMenuOpen]);

  useEffect(() => {
    if (!instrumentMenuOpen) return;
    const handleClickOutside = (event) => {
      if (instrumentMenuRef.current && !instrumentMenuRef.current.contains(event.target)) {
        setInstrumentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [instrumentMenuOpen]);

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

    // Filtro por instrumentos (solo aplica en plugins y cuando existan datos)
    if (activeFilter === 'plugins' && instrumentFilter && hasInstrumentData) {
      categories = categories.map(cat => {
        if (cat.id !== 'plugins') return cat;
        return {
          ...cat,
          items: cat.items.filter(item => {
            const instrumentos = Array.isArray(item.instrumentos) ? item.instrumentos : [];
            return instrumentos.includes(instrumentFilter);
          }),
        };
      }).filter(cat => cat.items.length > 0);
    }

    return categories;
  }, [activeFilter, searchQuery, instrumentFilter, hasInstrumentData]);

  // Contar total de recursos
  const totalResources = useMemo(() => {
    return softwareCategories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
  }, []);

  // Estado vacío
  const isEmpty = filteredData.length === 0 || filteredData.every(cat => cat.items.length === 0);

  return (
    <div className="min-h-full pb-8 px-4 sm:px-6 lg:px-8">
      {/* Contenedor con max-width para pantallas ultrawide */}
      <div className="max-w-7xl mx-auto">
      {/* Header - Centralizado */}
      <div className="mb-8 text-center">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <Package size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t('resources.title')}</h1>
            <p className="text-[var(--text-muted)]">
              {t('resources.subtitle', { count: totalResources })}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda - Centralizados */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 items-center justify-center px-3 sm:px-6">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md w-full">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            type="text"
            placeholder={t('resources.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Filtro por categoría */}
        <div className="flex items-center gap-2 pb-2 sm:pb-0 w-full sm:w-auto flex-nowrap sm:flex-wrap justify-center overflow-x-auto sm:overflow-visible px-2 sm:px-0">
          <Filter size={18} className="text-[var(--text-subtle)] flex-shrink-0 hidden sm:block" />
          <button
            onClick={() => handleFilterChange('all')}
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          >
            {t('resources.filterAll')}
          </button>
          {softwareCategories.map((cat) => {
            return (
              <button
                key={cat.id}
                onClick={() => handleFilterChange(cat.id)}
                className={`filter-btn ${activeFilter === cat.id ? 'active' : ''}`}
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

      {/* Filtros por instrumento */}
      {activeFilter === 'plugins' && (
        <div className="flex flex-col gap-2 sm:gap-3 mb-6 sm:mb-8 items-center justify-center px-3 sm:px-6">
          <div className="w-full max-w-6xl">
            {/* Mobile: dropdown compacto */}
            <div className="sm:hidden relative" ref={instrumentMenuRef}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-2">
                {t('resources.instrumentFilter')}
              </label>
              <button
                type="button"
                onClick={() => setInstrumentMenuOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--card-shadow)] hover:bg-[var(--hover)] transition-colors"
                aria-haspopup="menu"
                aria-expanded={instrumentMenuOpen}
              >
                <span className="text-sm truncate">
                  {instrumentFilter
                    ? t(INSTRUMENT_FILTERS.find((inst) => inst.id === instrumentFilter)?.labelKey || 'resources.instrumentAll')
                    : t('resources.instrumentAll')}
                </span>
                <ChevronDown size={16} className={`text-[var(--text-subtle)] transition-transform ${instrumentMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {instrumentMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 right-0 mt-2 rounded-xl border border-[var(--border)] glass-panel dropdown-panel shadow-[var(--card-shadow)] overflow-hidden z-40 max-h-64 overflow-auto"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setInstrumentFilter('');
                      setInstrumentMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      instrumentFilter === ''
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'text-[var(--text)] hover:bg-[var(--hover)]'
                    }`}
                  >
                    {t('resources.instrumentAll')}
                  </button>
                  {INSTRUMENT_FILTERS.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => {
                        setInstrumentFilter(inst.id);
                        setInstrumentMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        instrumentFilter === inst.id
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'text-[var(--text)] hover:bg-[var(--hover)]'
                      }`}
                    >
                      {t(inst.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop/tablet: botones */}
            <div className="hidden sm:block">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-2 text-center">
                {t('resources.instrumentFilter')}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <button
                  onClick={() => setInstrumentFilter('')}
                  className={`filter-btn ${instrumentFilter === '' ? 'active' : ''}`}
                >
                  {t('resources.instrumentAll')}
                </button>
                {instrumentRows[0].map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setInstrumentFilter(inst.id)}
                    className={`filter-btn ${instrumentFilter === inst.id ? 'active' : ''}`}
                  >
                    {t(inst.labelKey)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {instrumentRows[1].map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setInstrumentFilter(inst.id)}
                    className={`filter-btn ${instrumentFilter === inst.id ? 'active' : ''}`}
                  >
                    {t(inst.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      {isEmpty ? (
        <div className="text-center py-16">
          <Package size={64} className="mx-auto text-[var(--text-subtle)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {searchQuery ? t('resources.noResults') : t('resources.noResources')}
          </h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            {searchQuery
              ? t('resources.noResultsFor', { query: searchQuery })
              : t('resources.noResourcesSubtitle')
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] transition-colors"
            >
              {t('resources.clearSearch')}
            </button>
          )}
        </div>
      ) : (
        <div>
          {filteredData.map((category) => (
            <CategorySection key={category.id} category={category} t={t} />
          ))}
        </div>
      )}
      </div>{/* Cierre max-w-7xl */}
    </div>
  );
});

export default ResourcesView;
