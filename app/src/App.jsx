/**
 * App.jsx
 *
 * Este componente es el "cerebro" de la app.
 * Aquí coordinamos estados globales (tema, búsqueda, navegación)
 * y enviamos props a los componentes hijos.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import data from './data.json';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import MainContent from './components/MainContent';

// Guardamos referencias a los datos para evitar re-crear arrays en cada render.
const artists = data.artists;
const charts = data.charts;
const stats = data.stats;

// Mapas por ID = búsquedas O(1) (más rápido que .find).
const artistById = new Map(artists.map((artist) => [artist.id, artist]));
const chartById = new Map(charts.map((artist) => [artist.id, artist]));

// Calculamos los artistas con más canciones una sola vez.
const topArtists = [...artists]
  .map((artist) => ({
    ...artist,
    totalSongs: artist.albums.reduce((sum, album) => sum + album.songs.length, 0),
  }))
  .sort((a, b) => b.totalSongs - a.totalSongs)
  .slice(0, 4);

const App = () => {
  // Estado del tema. "dark" ya existe, "light" se agrega con CSS variables.
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Búsqueda y navegación.
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [artistsExpanded, setArtistsExpanded] = useState(true);
  const [chartsExpanded, setChartsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('home');
  const [expandedAlbums, setExpandedAlbums] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [recentArtists, setRecentArtists] = useState([]);

  /**
   * Efecto para aplicar el tema al <html>.
   * Al usar data-theme, el CSS puede cambiar colores sin recargar la UI.
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('theme-smooth');
    localStorage.setItem('theme', theme);
  }, [theme]);

  /**
   * Detectamos si es móvil para ajustar el sidebar.
   * Esta lógica vive aquí para que todos los hijos reciban el estado correcto.
   */
  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateIsMobile();
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }

    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  /**
   * Cargamos el historial de artistas desde localStorage.
   * Si falla el JSON, mostramos el error y seguimos sin romper la UI.
   */
  useEffect(() => {
    const saved = localStorage.getItem('recentArtists');
    if (saved) {
      try {
        setRecentArtists(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing recentArtists:', error);
      }
    }
  }, []);

  // Callbacks estables (useCallback) = menos renders en hijos memoizados.
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleArtistsExpanded = useCallback(() => {
    setArtistsExpanded((prev) => !prev);
  }, []);

  const toggleChartsExpanded = useCallback(() => {
    setChartsExpanded((prev) => !prev);
  }, []);

  const toggleAlbum = useCallback((albumId) => {
    setExpandedAlbums((prev) => ({
      ...prev,
      [albumId]: !prev[albumId],
    }));
  }, []);

  /**
   * Selecciona artista y modo.
   * También guarda historial (máx. 4) y cierra sidebar en móvil.
   */
  const handleSelectArtist = useCallback(
    (artistId, mode = 'artists') => {
      setSelectedArtist(artistId);
      setViewMode(mode);
      setExpandedAlbums({});

      if (mode === 'artists') {
        const artist = artistById.get(artistId);
        if (artist) {
          setRecentArtists((prev) => {
            const filtered = prev.filter((item) => item.id !== artistId);
            const updated = [{ id: artist.id, name: artist.name }, ...filtered].slice(0, 4);
            localStorage.setItem('recentArtists', JSON.stringify(updated));
            return updated;
          });
        }
      }

      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    [isMobile]
  );

  // Volver al home limpia búsqueda y selección.
  const handleGoHome = useCallback(() => {
    setSelectedArtist(null);
    setViewMode('home');
    setSearchQuery('');
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Artista y charts actuales por ID.
  const currentArtist = selectedArtist ? artistById.get(selectedArtist) : null;
  const currentChart = selectedArtist ? chartById.get(selectedArtist) : null;

  // Convertimos el historial en objetos completos.
  const recentArtistObjects = useMemo(() => {
    return recentArtists.map((artist) => artistById.get(artist.id)).filter(Boolean);
  }, [recentArtists]);

  // Si hay historial usamos eso; si no, topArtists.
  const hasRecentArtists = recentArtistObjects.length > 0;
  const homeArtists = useMemo(() => {
    return hasRecentArtists ? recentArtistObjects : topArtists;
  }, [hasRecentArtists, recentArtistObjects, topArtists]);

  /**
   * Búsqueda global.
   * Usamos useMemo para recalcular solo cuando cambia el texto.
   */
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return null;

    const query = searchQuery.toLowerCase();
    const results = [];

    artists.forEach((artist) => {
      artist.albums.forEach((album) => {
        album.songs.forEach((song) => {
          if (
            song.name.toLowerCase().includes(query) ||
            artist.name.toLowerCase().includes(query)
          ) {
            results.push({
              ...song,
              artistName: artist.name,
              artistId: artist.id,
              albumName: album.name,
            });
          }
        });
      });
    });

    charts.forEach((artist) => {
      artist.charts.forEach((chart) => {
        if (chart.name.toLowerCase().includes(query) || artist.name.toLowerCase().includes(query)) {
          results.push({
            ...chart,
            artistName: artist.name,
            type: 'chart',
          });
        }
      });
    });

    return results.slice(0, 50);
  }, [searchQuery]);

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden theme-smooth">
      <Sidebar
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        artistsExpanded={artistsExpanded}
        chartsExpanded={chartsExpanded}
        selectedArtist={selectedArtist}
        viewMode={viewMode}
        artists={artists}
        charts={charts}
        onToggleArtists={toggleArtistsExpanded}
        onToggleCharts={toggleChartsExpanded}
        onSelectArtist={handleSelectArtist}
        onCloseSidebar={closeSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={clearSearch}
          onToggleSidebar={toggleSidebar}
          onGoHome={handleGoHome}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <MainContent
          searchResults={searchResults}
          searchQuery={searchQuery}
          viewMode={viewMode}
          selectedArtist={selectedArtist}
          currentArtist={currentArtist}
          currentChart={currentChart}
          expandedAlbums={expandedAlbums}
          onToggleAlbum={toggleAlbum}
          stats={stats}
          homeArtists={homeArtists}
          hasRecentArtists={hasRecentArtists}
          onSelectArtist={handleSelectArtist}
        />
      </div>
    </div>
  );
};

export default App;
