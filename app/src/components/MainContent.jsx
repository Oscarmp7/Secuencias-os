/**
 * MainContent.jsx
 *
 * Este componente decide que pantalla mostrar segun el estado global.
 * Prioridad de render:
 * 1) Formulario de contribución,
 * 2) Resultados de búsqueda,
 * 3) Vista de recursos,
 * 4) Home,
 * 5) Artista seleccionado.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import SearchResultsView from './views/SearchResultsView';
import HomeView from './views/HomeView';
import ArtistView from './views/ArtistView';
import ContributeFormView from './views/ContributeFormView';
import ResourcesView from './views/ResourcesView';

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
  // Nuevas props para formulario y recursos
  showContributeForm = false,
  onCloseContributeForm,
  selectedResourceCategory = null,
}) {
  const { t } = useTranslation();

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 grain-bg scroll-smooth overscroll-contain">
      {/* Prioridad 1: Formulario de contribución */}
      {showContributeForm ? (
        <ContributeFormView onClose={onCloseContributeForm} />
      ) : searchResults && searchResults.length > 0 ? (
        /* Prioridad 2: Resultados de búsqueda */
        <SearchResultsView searchResults={searchResults} searchQuery={searchResultsQuery} />
      ) : searchResults && searchResults.length === 0 ? (
        /* Sin resultados de búsqueda */
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-[var(--text-subtle)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('search.noResultsTitle')}</h2>
          <p className="text-[var(--text-muted)]">{t('search.noResultsSubtitle')}</p>
        </div>
      ) : viewMode === 'resources' ? (
        /* Prioridad 3: Vista de recursos */
        <ResourcesView selectedCategory={selectedResourceCategory} />
      ) : viewMode === 'home' || !selectedArtist ? (
        /* Prioridad 4: Home */
        <HomeView
          stats={stats}
          homeArtists={homeArtists}
          hasRecentArtists={hasRecentArtists}
          theme={theme}
          onSelectArtist={onSelectArtist}
        />
      ) : (
        /* Prioridad 5: Vista de artista */
        currentArtist && (
          <ArtistView artist={currentArtist} expandedAlbums={expandedAlbums} onToggleAlbum={onToggleAlbum} />
        )
      )}
    </main>
  );
});

export default MainContent;
