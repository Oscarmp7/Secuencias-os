/**
 * MainContent.jsx
 *
 * Decide qué vista renderizar según el estado:
 * - Resultados de búsqueda
 * - Charts
 * - Home
 * - Artista seleccionado
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import SearchResultsView from './views/SearchResultsView';
import ChartsView from './views/ChartsView';
import HomeView from './views/HomeView';
import ArtistView from './views/ArtistView';

const MainContent = memo(function MainContent({
  searchResults,
  searchQuery,
  viewMode,
  selectedArtist,
  currentArtist,
  currentChart,
  expandedAlbums,
  onToggleAlbum,
  stats,
  homeArtists,
  hasRecentArtists,
  onSelectArtist,
}) {
  const { t } = useTranslation();

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grain-bg scroll-smooth overscroll-contain">
      {searchResults && searchResults.length > 0 ? (
        <SearchResultsView searchResults={searchResults} searchQuery={searchQuery} />
      ) : searchResults && searchResults.length === 0 ? (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-[var(--text-subtle)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('search.noResultsTitle')}</h2>
          <p className="text-[var(--text-muted)]">{t('search.noResultsSubtitle')}</p>
        </div>
      ) : viewMode === 'charts' ? (
        <ChartsView chartArtist={currentChart} />
      ) : viewMode === 'home' || !selectedArtist ? (
        <HomeView
          stats={stats}
          homeArtists={homeArtists}
          hasRecentArtists={hasRecentArtists}
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
