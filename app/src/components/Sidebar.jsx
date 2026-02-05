/**
 * Sidebar.jsx
 *
 * Menu lateral con lista de artistas y recursos.
 * Usa React.memo para evitar renders innecesarios.
 * Incluye una lista virtualizada para mantener el scroll fluido.
 * 
 * Secciones:
 * - Artistas: Lista de artistas con sus secuencias
 * - Recursos: Software y herramientas (DAWs, Plugins, Utilidades)
 * - Botón de Aportar: Permite a usuarios contribuir recursos
 */

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  Package,
  Music2,
  Sliders,
  Wrench,
  Gift,
} from 'lucide-react';
import brandLogo from '../assets/logo.svg';
import brandLogoDark from '../assets/logo-dark.svg';
import VirtualList from './VirtualList';

// Altura de cada fila para la lista virtualizada (px).
const ROW_HEIGHT = 44;

// Subcategorías de recursos
const RESOURCE_CATEGORIES = [
  { id: 'daws', name: 'DAWs', icon: Music2 },
  { id: 'plugins', name: 'Plugins', icon: Sliders },
  { id: 'utilidades', name: 'Utilidades', icon: Wrench },
];

const Sidebar = memo(function Sidebar({
  // Props que llegan desde App.
  isMobile,
  sidebarOpen,
  artistsExpanded,
  selectedArtist,
  viewMode,
  artists,
  theme,
  onToggleArtists,
  onSelectArtist,
  onGoHome,
  onCloseSidebar,
  // Nuevas props para recursos y aportes
  resourcesExpanded = false,
  onToggleResources,
  onSelectResources,
  onShowContributeForm,
  selectedResourceCategory = null,
  resourceStats = null,
}) {
  const { t } = useTranslation();
  
  // Estado local para expandir recursos si no viene controlado
  const [localResourcesExpanded, setLocalResourcesExpanded] = useState(false);
  
  // Usar estado controlado o local
  const isResourcesExpanded = onToggleResources ? resourcesExpanded : localResourcesExpanded;
  const toggleResources = onToggleResources || (() => setLocalResourcesExpanded(prev => !prev));
  // Elegimos variante de logo segun tema para mantener contraste real.
  const sidebarLogo = theme === 'dark' ? brandLogoDark : brandLogo;

  return (
    <>
      {/* Overlay en movil: siempre montado para animar opacidad sin parpadeo */}
      {isMobile && (
        <div
          className={`fixed inset-0 bg-[var(--overlay)] z-40 transition-opacity duration-300 ease-out ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={sidebarOpen ? onCloseSidebar : undefined}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: en mobile usamos translate (GPU), en desktop usamos width */}
      <aside
        className={`
          ${
            isMobile
              ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
                 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : `${sidebarOpen ? 'w-64' : 'w-0'} transition-[width] duration-300 ease-in-out`
          }
          bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col overflow-hidden
        `}
        aria-label={t('aria.navigation')}
      >
        {/* Header del sidebar */}
        <div
          className={`h-[72px] flex items-center justify-center border-b border-[var(--border)] relative ${
            // En mobile damos espacio extra a la derecha para que la "X" no pegue al logo.
            isMobile ? 'pl-4 pr-12' : 'px-4'
          }`}
        >
          {/* Logo principal sin fondo para respetar el SVG transparente */}
          <button
            type="button"
            onClick={onGoHome}
            className="p-1 rounded-md hover:bg-[var(--hover)] transition-colors active:scale-[0.98]"
            aria-label={t('actions.home')}
          >
            <img src={sidebarLogo} alt={t('brand')} className="brand-logo-full h-9 w-auto max-w-[210px]" />
          </button>

          {isMobile && (
            <button
              onClick={onCloseSidebar}
              className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors duration-200 active:scale-95 absolute right-4"
              aria-label={t('aria.closeMenu')}
            >
              <X size={20} className="text-[var(--text-muted)]" />
            </button>
          )}
        </div>

        {/* Navegacion principal */}
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Seccion ARTISTAS */}
          <section className="mb-4" aria-labelledby="artistas-heading">
            <button
              onClick={onToggleArtists}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--accent)] text-sm font-medium hover:bg-[var(--hover)] rounded-md transition-colors"
            >
              {artistsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Folder size={18} />
              <span id="artistas-heading" className="flex-1 text-left uppercase tracking-wide">
                {t('nav.artists')}
              </span>
              <span className="text-[var(--text-subtle)] text-xs tabular-nums">
                {artists.length}
              </span>
            </button>

            {artistsExpanded && (
              <VirtualList
                items={artists}
                itemHeight={ROW_HEIGHT}
                overscan={6}
                className="mt-1 max-h-[50vh]"
                renderItem={(artist) => (
                  <button
                    type="button"
                    onClick={() => onSelectArtist(artist.id, 'artists')}
                    className={`w-full h-full flex items-center gap-2 px-3 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
                      selectedArtist === artist.id && viewMode === 'artists'
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover)]'
                    }`}
                  >
                    <ChevronRight
                      size={14}
                      className={
                        selectedArtist === artist.id && viewMode === 'artists'
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text-subtle)]'
                      }
                    />
                    <span className="truncate">{artist.name}</span>
                  </button>
                )}
              />
            )}
          </section>

          {/* Seccion RECURSOS */}
          <section className="mb-4" aria-labelledby="recursos-heading">
            <button
              onClick={toggleResources}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--accent)] text-sm font-medium hover:bg-[var(--hover)] rounded-md transition-colors"
            >
              {isResourcesExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Package size={18} />
              <span id="recursos-heading" className="flex-1 text-left uppercase tracking-wide">
                {t('nav.resources', 'Recursos')}
              </span>
              {resourceStats && resourceStats.totalItems > 0 && (
                <span className="text-[var(--text-subtle)] text-xs tabular-nums">
                  {resourceStats.totalItems}
                </span>
              )}
            </button>

            {isResourcesExpanded && (
              <div className="mt-1 space-y-1">
                {/* Ver todos los recursos */}
                <button
                  type="button"
                  onClick={() => onSelectResources && onSelectResources(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
                    viewMode === 'resources' && !selectedResourceCategory
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover)]'
                  }`}
                >
                  <Package size={16} className={viewMode === 'resources' && !selectedResourceCategory ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]'} />
                  <span>{t('resources.filterAll', 'Ver todos')}</span>
                </button>

                {/* Subcategorías */}
                {RESOURCE_CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = viewMode === 'resources' && selectedResourceCategory === cat.id;
                  const count = resourceStats ? resourceStats[cat.id] || 0 : 0;
                  
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onSelectResources && onSelectResources(cat.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
                        isSelected
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover)]'
                      }`}
                    >
                      <IconComponent size={16} className={isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]'} />
                      <span className="flex-1 text-left">{cat.name}</span>
                      {count > 0 && (
                        <span className="text-[var(--text-subtle)] text-xs tabular-nums">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </nav>

        {/* Botón de Aportar Recursos - Fijo en la parte inferior */}
        <div className="p-3 border-t border-[var(--border)]">
          <button
            onClick={() => {
              if (onShowContributeForm) {
                onShowContributeForm();
              }
              if (isMobile) {
                onCloseSidebar();
              }
            }}
            className="
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
              text-white font-medium text-sm
              transition-all duration-200 active:scale-[0.98]
              shadow-lg shadow-blue-600/20
            "
          >
            <Gift size={18} />
            <span>{t('contribute.title')}</span>
          </button>
        </div>
      </aside>
    </>
  );
});

export default Sidebar;
