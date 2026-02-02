/**
 * Sidebar.jsx
 *
 * Menu lateral con secciones colapsables (artistas y charts).
 * Usa React.memo para evitar renders innecesarios.
 * Incluye una lista virtualizada para mantener el scroll fluido.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, ChevronRight, Folder, FileText } from 'lucide-react';
import brandLogo from '../assets/logo.svg';
import brandLogoDark from '../assets/logo-dark.svg';
import VirtualList from './VirtualList';

// Altura de cada fila para la lista virtualizada (px).
const ROW_HEIGHT = 44;

const Sidebar = memo(function Sidebar({
  // Props que llegan desde App.
  isMobile,
  sidebarOpen,
  artistsExpanded,
  chartsExpanded,
  selectedArtist,
  viewMode,
  artists,
  charts,
  theme,
  onToggleArtists,
  onToggleCharts,
  onSelectArtist,
  onCloseSidebar,
}) {
  const { t } = useTranslation();
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
          <img src={sidebarLogo} alt={t('brand')} className="brand-logo-full h-9 w-auto max-w-[210px]" />

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
              <span id="artistas-heading" className="flex-1 text-left">
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
                className="mt-1 max-h-[40vh]"
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

          {/* Seccion CHARTS */}
          <section className="mb-4" aria-labelledby="charts-heading">
            <button
              onClick={onToggleCharts}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--chart-accent)] text-sm font-medium hover:bg-[var(--hover)] rounded-lg transition-all duration-200"
            >
              {chartsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <FileText size={18} />
              <span id="charts-heading">{t('nav.charts')}</span>
              <span className="ml-auto text-[var(--text-subtle)] text-xs">{charts.length}</span>
            </button>

            {chartsExpanded && (
              <VirtualList
                items={charts}
                itemHeight={ROW_HEIGHT}
                overscan={6}
                className="mt-1 max-h-[40vh]"
                renderItem={(artist) => (
                  <button
                    type="button"
                    onClick={() => onSelectArtist(artist.id, 'charts')}
                    className={`w-full h-full flex items-center gap-2 px-3 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
                      selectedArtist === artist.id && viewMode === 'charts'
                        ? 'bg-[var(--chart-accent-soft)] text-[var(--chart-accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover)]'
                    }`}
                  >
                    <ChevronRight
                      size={14}
                      className={
                        selectedArtist === artist.id && viewMode === 'charts'
                          ? 'text-[var(--chart-accent)]'
                          : 'text-[var(--text-subtle)]'
                      }
                    />
                    <span className="truncate">{artist.name}</span>
                  </button>
                )}
              />
            )}
          </section>
        </nav>
      </aside>
    </>
  );
});

export default Sidebar;
