/**
 * Sidebar.jsx
 *
 * Menú lateral con secciones colapsables (artistas y charts).
 * Usa React.memo para evitar renders innecesarios.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, X, ChevronDown, ChevronRight, Folder, FileText } from 'lucide-react';

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
  onToggleArtists,
  onToggleCharts,
  onSelectArtist,
  onCloseSidebar,
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* Overlay en móvil: al hacer clic cerramos el sidebar */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-[var(--overlay)] z-40 transition-opacity duration-300 ease-out"
          onClick={onCloseSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          ${
            isMobile
              ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out
                 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : `${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-out`
          }
          bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col overflow-hidden
        `}
        aria-label={t('aria.navigation')}
      >
        {/* Header del sidebar */}
        <div className="px-4 h-[72px] flex items-center justify-center border-b border-[var(--border)] relative">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Music className="text-[var(--accent)] flex-shrink-0" size={28} />
            <h1 className="text-lg font-semibold">{t('brand')}</h1>
          </div>

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

        {/* Navegación principal */}
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Sección ARTISTAS */}
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
              <div className="mt-1 max-h-[40vh] overflow-y-auto">
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => onSelectArtist(artist.id, 'artists')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
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
                ))}
              </div>
            )}
          </section>

          {/* Sección CHARTS */}
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
              <div className="mt-1 max-h-[40vh] overflow-y-auto">
                {charts.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => onSelectArtist(artist.id, 'charts')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
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
                ))}
              </div>
            )}
          </section>
        </nav>
      </aside>
    </>
  );
});

export default Sidebar;
