/**
 * MainContent.jsx
 *
 * Este componente decide que pantalla mostrar segun el estado global.
 * Prioridad de render:
 * 1) resultados de busqueda,
 * 2) home,
 * 3) artista seleccionado.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import SearchResultsView from './views/SearchResultsView';
import HomeView from './views/HomeView';
import ArtistView from './views/ArtistView';

const MainContent = memo(function MainContent({
  searchResults,
  searchResultsQuery,
  viewMode,
  selectedArtist,
  currentArtist,
  expandedAlbums,
  onToggleAlbum,
  stats,
  homeArtists,
  hasRecentArtists,
  theme,
  onSelectArtist,
}) {
  const { t } = useTranslation();

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grain-bg scroll-smooth overscroll-contain">
      {searchResults && searchResults.length > 0 ? (
        <SearchResultsView searchResults={searchResults} searchQuery={searchResultsQuery} />
      ) : searchResults && searchResults.length === 0 ? (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-[var(--text-subtle)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('search.noResultsTitle')}</h2>
          <p className="text-[var(--text-muted)]">{t('search.noResultsSubtitle')}</p>
        </div>
      ) : viewMode === 'home' || !selectedArtist ? (
        // En Home enviamos theme para usar la variante correcta del isotipo.
        <HomeView
          stats={stats}
          homeArtists={homeArtists}
          hasRecentArtists={hasRecentArtists}
          theme={theme}
          onSelectArtist={onSelectArtist}
        />
      ) : (
        currentArtist && (
          <ArtistView artist={currentArtist} expandedAlbums={expandedAlbums} onToggleAlbum={onToggleAlbum} />
        )
      )}
    </main>
  );
});

export default MainContent;
