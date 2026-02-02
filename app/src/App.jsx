/**
 * App.jsx
 *
 * Este componente es el "cerebro" de la app.
 * Aqui coordinamos estados globales (tema, busqueda, navegacion)
 * y enviamos props a los componentes hijos.
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import data from './data.json';
import Sidebar from './components/Sidebar';
import HeaderBar from './components/HeaderBar';
import MainContent from './components/MainContent';
import useDebouncedValue from './hooks/useDebouncedValue';
import { buildSearchIndex, searchInIndex } from './utils/searchIndex';

// Guardamos referencias a los datos para evitar re-crear arrays en cada render.
const artists = data.artists;
const charts = data.charts;
// Calculamos estadisticas desde la data real para evitar desfasajes con data.stats.
const stats = {
  totalArtists: artists.length,
  totalSongs: artists.reduce(
    (sum, artist) =>
      sum + (artist.albums || []).reduce((albumSum, album) => albumSum + album.songs.length, 0),
    0
  ),
  totalCharts: charts.reduce((sum, artist) => sum + (artist.charts || []).length, 0),
};

// Mapas por ID = busquedas O(1) (mas rapido que .find).
const artistById = new Map(artists.map((artist) => [artist.id, artist]));
const chartById = new Map(charts.map((artist) => [artist.id, artist]));

// Calculamos los artistas con mas canciones una sola vez.
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

  // Detectamos mobile una sola vez al iniciar para evitar el "flash" del sidebar.
  // Si el ancho ya es pequeno, iniciamos con el menu cerrado.
  const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Busqueda y navegacion.
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 180);
  const [searchResults, setSearchResults] = useState(null);
  // Guarda la consulta que genero los resultados actuales (para evitar desfasajes).
  const [searchResultsQuery, setSearchResultsQuery] = useState('');

  const [selectedArtist, setSelectedArtist] = useState(null);
  // Sidebar inicia abierto solo si NO estamos en mobile.
  const [sidebarOpen, setSidebarOpen] = useState(!initialIsMobile);
  const [artistsExpanded, setArtistsExpanded] = useState(true);
  const [chartsExpanded, setChartsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('home');
  const [expandedAlbums, setExpandedAlbums] = useState({});
  // Estado de breakpoint, basado en el ancho actual.
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [recentArtists, setRecentArtists] = useState([]);

  // Referencias para el worker de busqueda (si el navegador lo soporta).
  const searchWorkerRef = useRef(null);
  const searchRequestId = useRef(0);
  const searchIndexRef = useRef(null);
  // Guardamos el ultimo estado mobile para detectar cambios reales.
  const wasMobileRef = useRef(initialIsMobile);

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
   * Detectamos si es movil para ajustar el sidebar.
   * Esta logica vive aqui para que todos los hijos reciban el estado correcto.
   */
  useEffect(() => {
    const updateIsMobile = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);

      // Solo reaccionamos si el breakpoint cambia (evita saltos innecesarios).
      if (nextIsMobile !== wasMobileRef.current) {
        wasMobileRef.current = nextIsMobile;
        setSidebarOpen(!nextIsMobile);
      }
    };

    updateIsMobile();

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

  /**
   * Inicializamos un Web Worker para busqueda si el navegador lo soporta.
   * Esto evita que una busqueda grande bloquee el hilo principal (UI).
   */
  useEffect(() => {
    if (typeof Worker === 'undefined') return undefined;

    const worker = new Worker(new URL('./workers/searchWorker.js', import.meta.url), {
      type: 'module',
    });

    searchWorkerRef.current = worker;

    // Enviamos la data una sola vez para construir el indice en el worker.
    worker.postMessage({ type: 'init', payload: { artists, charts } });

    const handleMessage = (event) => {
      const { type, payload, requestId, query } = event.data || {};
      if (type === 'results' && requestId === searchRequestId.current) {
        setSearchResults(payload);
        setSearchResultsQuery(query);
      }
    };

    worker.addEventListener('message', handleMessage);

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
    };
  }, []);

  /**
   * Busqueda global optimizada:
   * - Debounce: esperamos un poco antes de buscar.
   * - Indice precalculado: no recorremos toda la data en cada tecla.
   * - Worker: si existe, la busqueda corre fuera del hilo de la UI.
   */
  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (trimmedQuery.length < 2) {
      // Invalida busquedas pendientes del worker.
      searchRequestId.current += 1;
      setSearchResults(null);
      setSearchResultsQuery('');
      return;
    }

    const worker = searchWorkerRef.current;
    if (worker) {
      const nextRequestId = searchRequestId.current + 1;
      searchRequestId.current = nextRequestId;
      worker.postMessage({
        type: 'search',
        payload: { query: trimmedQuery, limit: 50, requestId: nextRequestId },
      });
      return;
    }

    // Fallback si no hay worker: usamos el indice en memoria.
    if (!searchIndexRef.current) {
      searchIndexRef.current = buildSearchIndex(artists, charts);
    }

    const results = searchInIndex(searchIndexRef.current, trimmedQuery, 50);
    setSearchResults(results);
    setSearchResultsQuery(trimmedQuery);
  }, [debouncedQuery]);

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
   * Tambien guarda historial (max. 4) y cierra sidebar en movil.
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

  // Volver al home limpia busqueda y seleccion.
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
        // El sidebar usa theme para elegir logo normal o logo dark.
        theme={theme}
        onToggleArtists={toggleArtistsExpanded}
        onToggleCharts={toggleChartsExpanded}
        onSelectArtist={handleSelectArtist}
        onCloseSidebar={closeSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar
          // Buscador controlado: usa el texto real que el usuario escribe.
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
          // Usa el query "debounced" que genero estos resultados.
          searchResultsQuery={searchResultsQuery}
          viewMode={viewMode}
          selectedArtist={selectedArtist}
          currentArtist={currentArtist}
          currentChart={currentChart}
          expandedAlbums={expandedAlbums}
          onToggleAlbum={toggleAlbum}
          stats={stats}
          homeArtists={homeArtists}
          hasRecentArtists={hasRecentArtists}
          // Home usa theme para cambiar el isotipo segun contraste.
          theme={theme}
          onSelectArtist={handleSelectArtist}
        />
      </div>
    </div>
  );
};

export default App;
