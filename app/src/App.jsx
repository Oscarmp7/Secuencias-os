/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║                    🎵 SECUENCIAS OS - APLICACIÓN PRINCIPAL 🎵             ║
 * ║                                                                           ║
 * ║                      Desarrollado con React + Tailwind CSS                ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * ¡Bienvenido al código fuente de Secuencias OS!
 * Este archivo es el CORAZÓN de toda la aplicación. Aquí encontrarás todo el
 * código necesario para mostrar la interfaz y manejar la interacción del usuario.
 * 
 * =============================================================================
 * 📚 CONCEPTOS FUNDAMENTALES DE REACT (Para principiantes)
 * =============================================================================
 * 
 * ¿QUÉ ES REACT?
 * React es una librería de JavaScript creada por Facebook (ahora Meta) que nos
 * permite construir interfaces de usuario de forma modular. En lugar de tener
 * un archivo HTML gigante (como teníamos antes con 260,000 líneas), dividimos
 * todo en "componentes" reutilizables.
 * 
 * ¿QUÉ ES UN COMPONENTE?
 * Un componente es como un bloque de LEGO. Cada componente tiene su propia
 * lógica y apariencia, y podemos combinarlos para crear interfaces complejas.
 * En este caso, "App" es nuestro componente PRINCIPAL que contiene toda la app.
 * Un componente en React es simplemente una FUNCIÓN que retorna código HTML
 * (bueno, en realidad es JSX, que es HTML con superpoderes).
 * 
 * ¿QUÉ ES EL "ESTADO" (STATE)?
 * El estado es información que PUEDE CAMBIAR mientras el usuario usa la app.
 * Por ejemplo: qué artista está seleccionado, qué texto hay en el buscador, etc.
 * Cuando el estado cambia, React AUTOMÁTICAMENTE actualiza la pantalla.
 * Es como magia: cambias una variable y la pantalla se actualiza sola.
 * 
 * ¿QUÉ ES JSX?
 * JSX es una forma de escribir HTML dentro de JavaScript. Parece HTML normal,
 * pero tiene superpoderes: puedes incluir variables de JavaScript usando
 * llaves { }. Por ejemplo: <h1>Hola, {nombreUsuario}</h1>
 * 
 * =============================================================================
 * 📖 AUTOR Y VERSIÓN
 * =============================================================================
 * @author    Oscar MP
 * @version   2.0.0
 * @date      2025-01-28
 * @license   MIT
 * =============================================================================
 */


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        📥 SECCIÓN DE IMPORTACIONES                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
// 
// Las "importaciones" son como ir a una tienda y traer las herramientas que
// necesitas para construir algo. Cada línea "import" trae código de otro lugar
// para usarlo en ESTE archivo.
//
// La sintaxis es: import { cosaQueQuiero } from 'lugar-donde-está';

/**
 * 🔧 IMPORTACIÓN DE REACT
 * 
 * "React" - Es el núcleo de la librería. Lo necesitamos para que todo funcione.
 * 
 * "useState" - Es un "hook" (gancho) que nos permite crear ESTADO.
 *              El estado son variables que cuando cambian, React actualiza la pantalla.
 *              
 *              EJEMPLO SIMPLE:
 *              const [contador, setContador] = useState(0);
 *              //     ^^^^^^^^  ^^^^^^^^^^^             ^
 *              //        |           |                  |
 *              //   La variable  Función para      Valor inicial
 *              //   actual       cambiarla         (empieza en 0)
 *              
 *              Si haces setContador(5), entonces "contador" ahora vale 5
 *              y React automáticamente actualiza TODO lo que muestre "contador".
 * 
 * "useMemo" - Es otro hook que MEMORIZA resultados de cálculos.
 *             ¿Por qué? Porque algunos cálculos son pesados (como buscar en
 *             6,000 canciones). useMemo guarda el resultado y solo recalcula
 *             si algo relevante cambió. Esto hace la app MÁS RÁPIDA.
 * 
 * "useEffect" - Es un hook que ejecuta código cuando algo cambia.
 *              Lo usamos para detectar el tamaño de la pantalla y hacer
 *              la app responsive (que se adapte a móviles y tablets).
 */
import React, { useState, useMemo, useEffect } from 'react';

/**
 * 🎨 IMPORTACIÓN DE ICONOS (Lucide React)
 * 
 * Lucide React es una librería con CIENTOS de iconos bonitos y modernos.
 * Cada icono se importa por su nombre y se usa como si fuera HTML.
 * 
 * USO:
 *   <Music size={20} className="text-white" />
 *   
 *   - size: tamaño en píxeles (16, 18, 20, 24, etc.)
 *   - className: clases de Tailwind CSS para color, etc.
 * 
 * ICONOS QUE USAMOS:
 *   🔍 Search      - Lupa para el buscador
 *   🎵 Music       - Nota musical para canciones y logo
 *   📄 FileText    - Documento para charts/PDFs
 *   🏠 Home        - Casita para el botón de inicio
 *   ☰  Menu        - Las 3 líneas horizontales (hamburger menu)
 *   🔔 Bell        - Campana (no se usa actualmente)
 *   🔄 RefreshCw   - Flechas de refrescar (no se usa actualmente)
 *   📂 Folder      - Carpeta para álbumes
 *   ▶  ChevronRight - Flechita hacia la derecha (menú cerrado)
 *   ▼  ChevronDown  - Flechita hacia abajo (menú abierto)
 *   ⬇  Download    - Flecha de descarga
 */
import { 
  Search,         // 🔍 Icono de lupa
  Music,          // 🎵 Icono de nota musical
  FileText,       // 📄 Icono de documento
  Home,           // 🏠 Icono de casa
  Menu,           // ☰  Icono de menú hamburguesa
  X,              // ✕  Icono de cerrar (para sidebar en móvil)
  Folder,         // 📂 Icono de carpeta
  ChevronRight,   // ▶  Flecha derecha
  ChevronDown,    // ▼  Flecha abajo
  Download        // ⬇  Icono de descarga
} from 'lucide-react';

/**
 * 📊 IMPORTACIÓN DE DATOS
 * 
 * Aquí importamos el archivo "data.json" que contiene TODA la información
 * de artistas, álbumes, canciones y charts.
 * 
 * Este archivo fue generado automáticamente a partir del HTML original de
 * 260,000 líneas. Ahora todo está organizado en una estructura limpia.
 * 
 * ESTADÍSTICAS DEL ARCHIVO:
 *   • 772 artistas
 *   • 2,154 álbumes  
 *   • 6,289 secuencias (canciones)
 *   • 9,787 charts (PDFs musicales)
 * 
 * ESTRUCTURA DEL JSON:
 * {
 *   "stats": {
 *     "totalArtists": 772,
 *     "totalAlbums": 2154,
 *     "totalSongs": 6289,
 *     "totalCharts": 9787
 *   },
 *   "artists": [
 *     {
 *       "id": "1ABC2xyz...",        // ID único de Google Drive
 *       "name": "Hillsong Worship", // Nombre del artista
 *       "albums": [
 *         {
 *           "id": "9XYZ8abc...",
 *           "name": "Nombre del Álbum",
 *           "songs": [
 *             {
 *               "id": "...",
 *               "name": "Nombre de la Canción",
 *               "downloadUrl": "https://drive.google.com/uc?export=download&id=..."
 *             },
 *             // ... más canciones
 *           ]
 *         },
 *         // ... más álbumes
 *       ]
 *     },
 *     // ... más artistas
 *   ],
 *   "charts": [
 *     // Misma estructura pero para PDFs musicales
 *   ]
 * }
 * 
 * NOTA: La variable "data" es un OBJETO de JavaScript que contiene todo esto.
 *       Podemos acceder a cualquier parte usando la notación de punto:
 *       - data.stats.totalArtists → 772
 *       - data.artists[0].name → "1er Santo" (primer artista)
 *       - data.artists[0].albums[0].songs → [array de canciones]
 */
import data from './data.json';


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                      🏗️ COMPONENTE PRINCIPAL: App                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
// 
// Este es nuestro ÚNICO componente (por ahora). Contiene toda la lógica y
// la interfaz visual de la aplicación.
// 
// En React, un componente es una FUNCIÓN que:
//   1. Puede tener ESTADO (información que cambia)
//   2. Retorna JSX (código HTML con superpoderes)
// 
// La función se llama "App" por convención, y es la que se renderiza en
// el archivo main.jsx cuando la aplicación arranca.

const App = () => {
  // ╔═════════════════════════════════════════════════════════════════════════╗
  // ║                    📦 DECLARACIÓN DE ESTADO (useState)                  ║
  // ╚═════════════════════════════════════════════════════════════════════════╝
  // 
  // El ESTADO son variables especiales que cuando cambian, React automáticamente
  // vuelve a "dibujar" la interfaz con los nuevos valores.
  // 
  // SINTAXIS DE useState:
  //   const [nombreVariable, funcionParaCambiarla] = useState(valorInicial);
  // 
  // Esto se llama "desestructuración de arrays" en JavaScript. useState()
  // retorna un array con 2 elementos, y los guardamos en 2 variables.

  /**
   * 🔍 searchQuery - El texto que el usuario escribe en el buscador
   * 
   * • Valor inicial: '' (string vacío, no hay nada escrito)
   * • Cambia cuando: El usuario escribe en el input de búsqueda
   * • Se actualiza con: setSearchQuery('nuevo texto')
   * 
   * EJEMPLO DE USO:
   *   <input onChange={(e) => setSearchQuery(e.target.value)} />
   *   // e.target.value es lo que el usuario escribió
   */
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * 👤 selectedArtist - El ID del artista actualmente seleccionado
   * 
   * • Valor inicial: null (ningún artista seleccionado = pantalla de inicio)
   * • Cambia cuando: El usuario hace clic en un artista del menú lateral
   * • Se actualiza con: setSelectedArtist('idDelArtista')
   * 
   * NOTA: Este es el ID de Google Drive del artista, no su nombre.
   *       Usamos IDs porque son únicos, los nombres podrían repetirse.
   * 
   * EJEMPLO:
   *   setSelectedArtist('1AbC2XyZ') // Selecciona artista con ese ID
   *   setSelectedArtist(null)       // Vuelve a la pantalla de inicio
   */
  const [selectedArtist, setSelectedArtist] = useState(null);

  /**
   * 📱 sidebarOpen - Controla si el menú lateral está visible o no
   * 
   * • Valor inicial: true (el sidebar está abierto por defecto)
   * • Cambia cuando: El usuario hace clic en el botón de menú (☰)
   * • Se actualiza con: setSidebarOpen(!sidebarOpen) // Alterna entre true/false
   * 
   * TRUE = El sidebar tiene ancho de 256px (w-64 en Tailwind)
   * FALSE = El sidebar tiene ancho de 0px (se oculta)
   */
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /**
   * 📂 artistsExpanded - Controla si la sección "ARTISTAS" está expandida
   * 
   * • Valor inicial: true (la lista de artistas está visible)
   * • Cambia cuando: El usuario hace clic en el título "ARTISTAS"
   * • Se actualiza con: setArtistsExpanded(!artistsExpanded)
   * 
   * TRUE = Se muestra la lista de artistas debajo del título
   * FALSE = Solo se ve el título "ARTISTAS", la lista está oculta
   */
  const [artistsExpanded, setArtistsExpanded] = useState(true);

  /**
   * 📄 chartsExpanded - Controla si la sección "CHARTS" está expandida
   * 
   * • Valor inicial: false (la sección de charts empieza colapsada)
   * • Cambia cuando: El usuario hace clic en el título "CHARTS"
   * • Se actualiza con: setChartsExpanded(!chartsExpanded)
   * 
   * Es lo mismo que artistsExpanded pero para la sección de charts.
   * Empezamos con false porque la mayoría de usuarios buscan secuencias,
   * no charts, así que la sección de artistas tiene prioridad visual.
   */
  const [chartsExpanded, setChartsExpanded] = useState(false);

  /**
   * 🎯 viewMode - Indica qué tipo de contenido estamos mostrando
   * 
   * • Valor inicial: 'home' (pantalla de bienvenida)
   * • Valores posibles:
   *     - 'home'    → Pantalla de inicio con estadísticas
   *     - 'artists' → Vista de un artista con sus álbumes y canciones
   *     - 'charts'  → Vista de charts de un artista
   * • Cambia cuando: El usuario selecciona algo del menú o presiona "Inicio"
   * 
   * Este estado trabaja JUNTO con selectedArtist:
   *   - viewMode='home' + selectedArtist=null → Pantalla de inicio
   *   - viewMode='artists' + selectedArtist='xyz' → Ver artista de secuencias
   *   - viewMode='charts' + selectedArtist='xyz' → Ver artista de charts
   */
  const [viewMode, setViewMode] = useState('home');

  /**
   * 📁 expandedAlbums - Controla qué álbumes están expandidos (abiertos)
   * 
   * • Valor inicial: {} (objeto vacío, ningún álbum está expandido)
   * • Estructura: { albumId1: true, albumId2: true, albumId3: false, ... }
   * • Cambia cuando: El usuario hace clic en un álbum para ver sus canciones
   * 
   * EJEMPLO:
   *   expandedAlbums = {
   *     'album123': true,   // Este álbum está abierto (muestra canciones)
   *     'album456': false,  // Este álbum está cerrado
   *   }
   * 
   * Si un albumId no existe en el objeto, se considera FALSE (cerrado).
   * Usamos la notación de corchetes para acceder: expandedAlbums['album123']
   */
  const [expandedAlbums, setExpandedAlbums] = useState({});

  /**
   * 📱 isMobile - Detecta si estamos en un dispositivo móvil
   * 
   * • Valor inicial: false (asumimos desktop por defecto)
   * • Cambia cuando: El tamaño de la ventana cambia (resize)
   * • Se considera móvil si el ancho es menor a 768px (md en Tailwind)
   * 
   * Usamos esto para:
   *   - Cerrar el sidebar automáticamente en móvil al seleccionar algo
   *   - Mostrar el sidebar como overlay en móvil
   *   - Adaptar el diseño para pantallas pequeñas
   */
  const [isMobile, setIsMobile] = useState(false);


  // ╔═════════════════════════════════════════════════════════════════════════╗
  // ║                    📐 EFECTOS (useEffect) - RESPONSIVE                  ║
  // ╚═════════════════════════════════════════════════════════════════════════╝
  // 
  // useEffect es un hook que ejecuta código DESPUÉS de que el componente
  // se renderiza. Es perfecto para:
  //   - Escuchar eventos del navegador (como resize)
  //   - Hacer peticiones a APIs
  //   - Configurar timers o intervalos
  // 
  // SINTAXIS:
  //   useEffect(() => {
  //     // Código a ejecutar
  //     return () => { /* Cleanup (limpieza) */ };
  //   }, [dependencias]);

  /**
   * 🖥️ Efecto para detectar si estamos en móvil o desktop
   * 
   * Este efecto:
   *   1. Comprueba el tamaño de la ventana al cargar
   *   2. Escucha cuando el usuario cambia el tamaño de la ventana
   *   3. Actualiza isMobile según corresponda
   *   4. En móvil, cierra el sidebar por defecto para dar más espacio
   * 
   * El array vacío [] significa que solo se ejecuta UNA vez al montar
   * el componente, pero el listener de resize sigue activo.
   */
  useEffect(() => {
    // Función que comprueba si es móvil (menos de 768px de ancho)
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // En móvil, cerramos el sidebar por defecto para dar más espacio
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    
    // Comprobar al cargar la página
    checkIfMobile();
    
    // Escuchar cambios de tamaño de ventana
    // "resize" se dispara cada vez que el usuario cambia el tamaño del navegador
    window.addEventListener('resize', checkIfMobile);
    
    // CLEANUP: Cuando el componente se desmonta, quitamos el listener
    // Esto previene memory leaks (fugas de memoria)
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []); // [] = solo ejecutar al montar el componente


  // ╔═════════════════════════════════════════════════════════════════════════╗
  // ║                         🔧 FUNCIONES AUXILIARES                         ║
  // ╚═════════════════════════════════════════════════════════════════════════╝
  // 
  // Las funciones auxiliares nos ayudan a organizar el código y reutilizar
  // lógica. En lugar de repetir código, lo ponemos en una función.

  /**
   * 🔄 toggleAlbum - Alterna el estado de expansión de un álbum
   * 
   * Cuando el usuario hace clic en un álbum, esta función cambia su estado:
   *   - Si estaba cerrado → Lo abre (muestra las canciones)
   *   - Si estaba abierto → Lo cierra (oculta las canciones)
   * 
   * @param {string} albumId - El ID único del álbum a alternar
   * 
   * EXPLICACIÓN DEL CÓDIGO:
   * 
   *   setExpandedAlbums(prev => ({    // "prev" es el estado ANTERIOR
   *     ...prev,                       // Copiamos TODO lo anterior
   *     [albumId]: !prev[albumId]      // Cambiamos solo ESTE álbum
   *   }));
   * 
   * DESGLOSE:
   *   - "prev => (...)" es una función que recibe el estado anterior
   *   - "...prev" es el "spread operator", copia todas las propiedades
   *   - "[albumId]" usa el valor de albumId como nombre de propiedad
   *   - "!prev[albumId]" invierte el valor (true→false, false→true)
   * 
   * EJEMPLO:
   *   Estado anterior: { album1: true, album2: false }
   *   toggleAlbum('album2')
   *   Estado nuevo:    { album1: true, album2: true }  ← album2 cambió
   */
  const toggleAlbum = (albumId) => {
    setExpandedAlbums(prev => ({
      ...prev,
      [albumId]: !prev[albumId]
    }));
  };

  /**
   * 🎵 handleSelectArtist - Selecciona un artista y cierra el sidebar en móvil
   * 
   * Esta función mejora la UX en dispositivos móviles:
   *   1. Selecciona el artista
   *   2. Establece el modo de vista (artists o charts)
   *   3. Cierra todos los álbumes expandidos
   *   4. EN MÓVIL: Cierra el sidebar automáticamente para mostrar el contenido
   * 
   * @param {string} artistId - El ID del artista a seleccionar
   * @param {string} mode - El modo de vista ('artists' o 'charts')
   */
  const handleSelectArtist = (artistId, mode = 'artists') => {
    setSelectedArtist(artistId);
    setViewMode(mode);
    setExpandedAlbums({});
    
    // En móvil, cerramos el sidebar automáticamente para mostrar el contenido
    // Esto mejora la UX porque el usuario no tiene que cerrar manualmente
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  /**
   * 🏠 handleGoHome - Vuelve a la pantalla de inicio
   * 
   * Similar a handleSelectArtist, pero para ir al home.
   * También cierra el sidebar en móvil.
   */
  const handleGoHome = () => {
    setSelectedArtist(null);
    setViewMode('home');
    setSearchQuery('');
    
    if (isMobile) {
      setSidebarOpen(false);
    }
  };


  // ╔═════════════════════════════════════════════════════════════════════════╗
  // ║                    📊 VALORES CALCULADOS (useMemo)                      ║
  // ╚═════════════════════════════════════════════════════════════════════════╝
  // 
  // useMemo es un hook que MEMORIZA el resultado de un cálculo costoso.
  // Solo recalcula cuando las "dependencias" cambian.
  // 
  // SINTAXIS:
  //   const resultado = useMemo(() => {
  //     // código costoso aquí
  //     return valorCalculado;
  //   }, [dependencia1, dependencia2]);  // ← Array de dependencias
  // 
  // El código SOLO se ejecuta si algo en el array de dependencias cambió.
  // Si nada cambió, useMemo retorna el resultado anterior (de caché).
  // 
  // ¿POR QUÉ ES IMPORTANTE?
  // Sin useMemo, cada vez que CUALQUIER estado cambie (incluso el del buscador
  // mientras escribes), React volvería a buscar en 6,000+ canciones.
  // Con useMemo, solo busca cuando searchQuery realmente cambia.

  /**
   * 👤 currentArtist - El objeto completo del artista seleccionado
   * 
   * Este valor calculado busca en el array de artistas y retorna el objeto
   * completo del artista que tiene el ID igual a selectedArtist.
   * 
   * @returns {Object|undefined} El artista encontrado, o undefined si no hay ninguno
   * 
   * EXPLICACIÓN:
   *   data.artists.find(a => a.id === selectedArtist)
   *   
   *   - data.artists es un array de 772 artistas
   *   - .find() busca UN elemento que cumpla la condición
   *   - "a => a.id === selectedArtist" es la condición:
   *     "busca el artista cuyo id sea igual a selectedArtist"
   *   - Si lo encuentra, retorna el objeto completo del artista
   *   - Si no lo encuentra, retorna undefined
   * 
   * DEPENDENCIAS: [selectedArtist]
   * Solo recalcula cuando selectedArtist cambia (el usuario selecciona otro)
   */
  const currentArtist = useMemo(() => {
    return data.artists.find(a => a.id === selectedArtist);
  }, [selectedArtist]);

  /**
   * 🔍 searchResults - Resultados de la búsqueda global
   * 
   * Esta es la función de búsqueda más importante de la app. Busca en:
   *   - Todos los nombres de canciones
   *   - Todos los nombres de artistas
   *   - Todos los charts
   * 
   * @returns {Array|null} Array de resultados, o null si no hay búsqueda activa
   * 
   * LÓGICA:
   *   1. Si el texto de búsqueda tiene menos de 2 caracteres, no buscar
   *   2. Convertir el texto a minúsculas (para búsqueda sin importar mayúsculas)
   *   3. Recorrer TODOS los artistas, álbumes y canciones
   *   4. Si el nombre de la canción O del artista contiene el texto, agregarlo
   *   5. Hacer lo mismo para los charts
   *   6. Limitar a 50 resultados (para no saturar la interfaz)
   * 
   * DEPENDENCIAS: [searchQuery]
   * Solo recalcula cuando el texto de búsqueda cambia.
   */
  const searchResults = useMemo(() => {
    // Si no hay búsqueda o es muy corta, retornar null (no mostrar resultados)
    if (!searchQuery || searchQuery.length < 2) return null;
    
    // Convertir a minúsculas para búsqueda case-insensitive
    // "Hillsong" === "hillsong" cuando ambos están en minúsculas
    const query = searchQuery.toLowerCase();
    
    // Array donde guardaremos todos los resultados encontrados
    const results = [];
    
    // ═══════════════════════════════════════════════════════════════════════
    // BÚSQUEDA EN ARTISTAS Y CANCIONES
    // ═══════════════════════════════════════════════════════════════════════
    // Usamos forEach para recorrer cada nivel de la jerarquía:
    //   data.artists → artist.albums → album.songs
    
    data.artists.forEach(artist => {           // Para cada artista...
      artist.albums.forEach(album => {          // Para cada álbum del artista...
        album.songs.forEach(song => {            // Para cada canción del álbum...
          
          // Verificar si el nombre de la canción o el artista coincide
          // .includes() retorna true si el string contiene el texto buscado
          if (song.name.toLowerCase().includes(query) || 
              artist.name.toLowerCase().includes(query)) {
            
            // Agregar al array de resultados con información adicional
            results.push({ 
              ...song,                    // Copiar todas las propiedades de la canción
              artistName: artist.name,    // Agregar el nombre del artista
              artistId: artist.id,        // Agregar el ID del artista
              albumName: album.name       // Agregar el nombre del álbum
            });
          }
        });
      });
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // BÚSQUEDA EN CHARTS
    // ═══════════════════════════════════════════════════════════════════════
    // Hacemos lo mismo pero con la estructura de charts
    
    data.charts.forEach(artist => {            // Para cada artista de charts...
      artist.charts.forEach(chart => {          // Para cada chart...
        
        if (chart.name.toLowerCase().includes(query) || 
            artist.name.toLowerCase().includes(query)) {
          
          results.push({
            ...chart,                     // Copiar propiedades del chart
            artistName: artist.name,      // Nombre del artista
            type: 'chart'                 // Marcar que es un chart (no una canción)
          });
        }
      });
    });
    
    // Retornar solo los primeros 50 resultados
    // .slice(0, 50) toma desde el índice 0 hasta el 49 (50 elementos)
    return results.slice(0, 50);
  }, [searchQuery]); // Solo recalcular cuando searchQuery cambie


  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║                                                                           ║
  // ║                         🎨 RENDER (Interfaz Visual)                       ║
  // ║                                                                           ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  // 
  // Aquí comienza el JSX - el código que define cómo se VE la aplicación.
  // 
  // JSX BÁSICO:
  //   - Parece HTML pero es JavaScript
  //   - Puedes usar variables: <h1>{nombreVariable}</h1>
  //   - Los atributos usan camelCase: onClick, className (no onclick, class)
  //   - "className" en lugar de "class" porque "class" es reservado en JS
  // 
  // TAILWIND CSS:
  //   - Las clases como "flex", "p-4", "text-white" son de Tailwind CSS
  //   - Es un framework CSS que usa clases utilitarias
  //   - "flex" = display: flex
  //   - "p-4" = padding de 1rem (16px)
  //   - "text-white" = color de texto blanco
  //   - "bg-[#121212]" = background color personalizado (notación de corchetes)
  // 
  // ESTRUCTURA DE LA INTERFAZ:
  //   ┌─────────────────────────────────────────────────────────────────┐
  //   │                      CONTENEDOR PRINCIPAL                       │
  //   │  ┌──────────────┐  ┌─────────────────────────────────────────┐ │
  //   │  │              │  │              HEADER                     │ │
  //   │  │              │  │    [☰] [=====Buscador=====] [Inicio]   │ │
  //   │  │   SIDEBAR    │  ├─────────────────────────────────────────┤ │
  //   │  │              │  │                                         │ │
  //   │  │  ARTISTAS    │  │           ÁREA DE CONTENIDO             │ │
  //   │  │  - Artista1  │  │                                         │ │
  //   │  │  - Artista2  │  │     (Inicio / Artista / Resultados)     │ │
  //   │  │  - ...       │  │                                         │ │
  //   │  │              │  │                                         │ │
  //   │  │  CHARTS      │  │                                         │ │
  //   │  │  - Chart1    │  │                                         │ │
  //   │  │  - ...       │  │                                         │ │
  //   │  │              │  │                                         │ │
  //   │  └──────────────┘  └─────────────────────────────────────────┘ │
  //   └─────────────────────────────────────────────────────────────────┘

  return (
    /**
     * 📦 CONTENEDOR PRINCIPAL
     * 
     * Clases Tailwind:
     *   - flex: Activa Flexbox para organizar los hijos
     *   - h-screen: Altura del 100% de la pantalla (height: 100vh)
     *   - bg-[#121212]: Fondo casi negro (el color principal de Spotify/Apple Music)
     *   - text-gray-200: Texto gris claro por defecto
     */
    <div className="flex h-screen bg-[#121212] text-gray-200 overflow-hidden">
      
      {/* ═══════════════════════════════════════════════════════════════════════
          🌑 OVERLAY/BACKDROP (Solo visible en móvil cuando el sidebar está abierto)
          ═══════════════════════════════════════════════════════════════════════
          
          Este overlay oscuro aparece DETRÁS del sidebar cuando está abierto en móvil.
          Sirve para:
          1. Oscurecer el contenido de fondo
          2. Permitir cerrar el sidebar al hacer clic fuera de él
          
          Clases importantes:
          - fixed inset-0: Cubre toda la pantalla
          - bg-black/60: Negro con 60% de opacidad (transparente)
          - z-40: Z-index alto para estar encima del contenido pero debajo del sidebar
          - md:hidden: Solo visible en móvil (oculto en pantallas >= 768px)
          - transition-opacity duration-300: Animación suave de aparición/desaparición
      */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ease-out"
          onClick={() => setSidebarOpen(false)} // Cerrar al hacer clic en el overlay
          aria-hidden="true" // Accesibilidad: ocultar de lectores de pantalla
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          📱 SIDEBAR (Barra lateral izquierda)
          ═══════════════════════════════════════════════════════════════════════
          
          El sidebar contiene:
          1. Logo y nombre de la app
          2. Sección colapsable de ARTISTAS
          3. Sección colapsable de CHARTS
          
          COMPORTAMIENTO RESPONSIVE:
          - En DESKTOP (md+): El sidebar empuja el contenido (position relative)
          - En MÓVIL: El sidebar es un overlay (position fixed) que aparece encima
          
          Clases importantes:
          - En MÓVIL: fixed, z-50, h-full, transform translate-x
          - En DESKTOP: relative, w-64 o w-0
          - transition-all duration-300 ease-out: Animación suave de deslizamiento
      */}
      <div className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out
             ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-out`
        }
        bg-[#1a1a1a] border-r border-gray-800 flex flex-col overflow-hidden
      `}>
        
        {/* ─────────────────────────────────────────────────────────────────────
            🏷️ HEADER DEL SIDEBAR (Logo, título y botón cerrar en móvil)
            ───────────────────────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {/* Logo y nombre */}
            <div className="flex items-center gap-3">
              {/* 
                El icono Music de Lucide React
                - className="text-blue-500": Color azul (#3B82F6)
                - size={28}: 28 píxeles de tamaño
              */}
              <Music className="text-blue-500" size={28} />
              <h1 className="text-lg font-semibold">Secuencias OS</h1>
            </div>
            
            {/* 
              ✕ BOTÓN CERRAR (Solo visible en móvil)
              
              Este botón permite cerrar el sidebar en dispositivos móviles.
              En desktop no se muestra porque el sidebar se cierra con el botón ☰ del header.
            */}
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 active:scale-95"
                aria-label="Cerrar menú"
              >
                <X size={20} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            📚 NAVEGACIÓN PRINCIPAL
            ───────────────────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto p-3">
          
          {/* ═══════════════════════════════════════════════════════════════════
              🎵 SECCIÓN: ARTISTAS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="mb-4">
            {/*
              BOTÓN DEL TÍTULO "ARTISTAS"
              
              onClick: Cuando se hace clic, alterna artistsExpanded
              El signo ! invierte el valor: true→false, false→true
              
              Contenido del botón:
              - Flecha (ChevronDown si está expandido, ChevronRight si no)
              - Icono de carpeta
              - Texto "ARTISTAS"
              - Contador de artistas (data.artists.length)
            */}
            <button 
              onClick={() => setArtistsExpanded(!artistsExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-blue-500 text-sm font-medium hover:bg-gray-800/50 rounded-md transition-colors"
            >
              {/* 
                RENDERIZADO CONDICIONAL con operador ternario:
                condición ? siEsTrue : siEsFalse
                
                Si artistsExpanded es true, muestra ChevronDown (▼)
                Si es false, muestra ChevronRight (▶)
              */}
              {artistsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Folder size={18} />
              <span>ARTISTAS</span>
              {/* 
                ml-auto: margin-left automático (empuja este elemento a la derecha)
                data.artists.length: número total de artistas (772)
              */}
              <span className="ml-auto text-gray-500 text-xs">{data.artists.length}</span>
            </button>
            
            {/* 
              LISTA DE ARTISTAS
              
              Solo se muestra si artistsExpanded es true.
              Esto es RENDERIZADO CONDICIONAL con && (AND lógico):
              Si artistsExpanded es true, renderiza lo que viene después del &&
              Si es false, no renderiza nada.
              
              NOTA: {artistsExpanded && <div>...</div>}
              es equivalente a: {artistsExpanded ? <div>...</div> : null}
            */}
            {artistsExpanded && (
              <div className="mt-1 max-h-[40vh] overflow-y-auto">
                {/*
                  .map() - Recorre el array y genera un elemento por cada item
                  
                  data.artists.map(artist => ...)
                  
                  Esto toma cada artista del array y genera un <button> para cada uno.
                  Es como un bucle FOR pero que retorna JSX.
                  
                  IMPORTANTE: Cada elemento en un .map() necesita una "key" única.
                  React usa el key para saber qué elementos cambiaron, se agregaron
                  o se eliminaron. Usamos artist.id porque es único.
                  
                  CLASES DINÁMICAS:
                  Usamos template literals para cambiar el estilo según el estado.
                  Si este artista está seleccionado Y estamos en modo 'artists',
                  usamos el estilo "seleccionado" (fondo azul, texto azul).
                  Si no, usamos el estilo normal (gris, hover).
                  
                  MEJORAS DE UX:
                  - transition-all duration-200: Transición suave de 200ms
                  - active:scale-[0.98]: Pequeño efecto al hacer clic
                */}
                {data.artists.map(artist => (
                  <button
                    key={artist.id}
                    onClick={() => handleSelectArtist(artist.id, 'artists')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
                      selectedArtist === artist.id && viewMode === 'artists'
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    {/* Flecha indicadora al lado del nombre */}
                    <ChevronRight 
                      size={14} 
                      className={selectedArtist === artist.id && viewMode === 'artists' 
                        ? 'text-blue-500'   // Azul si está seleccionado
                        : 'text-gray-600'   // Gris si no
                      } 
                    />
                    {/* 
                      Nombre del artista
                      truncate: Si el texto es muy largo, lo corta con "..."
                    */}
                    <span className="truncate">{artist.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              📄 SECCIÓN: CHARTS
              ═══════════════════════════════════════════════════════════════════
              
              Esta sección es IDÉNTICA a la de ARTISTAS, pero para charts.
              La única diferencia es que:
              - Usa chartsExpanded en lugar de artistsExpanded
              - Usa data.charts en lugar de data.artists
              - Al hacer clic, setViewMode('charts') en lugar de 'artists'
          */}
          <div className="mb-4">
            <button 
              onClick={() => setChartsExpanded(!chartsExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-blue-500 text-sm font-medium hover:bg-gray-800/50 rounded-lg transition-all duration-200"
            >
              {chartsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <FileText size={18} />
              <span>CHARTS</span>
              <span className="ml-auto text-gray-500 text-xs">{data.charts.length}</span>
            </button>
            
            {/* Lista de charts por artista */}
            {chartsExpanded && (
              <div className="mt-1 max-h-[40vh] overflow-y-auto">
                {data.charts.map(artist => (
                  <button
                    key={artist.id}
                    onClick={() => handleSelectArtist(artist.id, 'charts')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] ${
                      selectedArtist === artist.id && viewMode === 'charts'
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <ChevronRight 
                      size={14} 
                      className={selectedArtist === artist.id && viewMode === 'charts' 
                        ? 'text-blue-500' 
                        : 'text-gray-600'
                      } 
                    />
                    <span className="truncate">{artist.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          📺 CONTENIDO PRINCIPAL (Todo lo que no es el sidebar)
          ═══════════════════════════════════════════════════════════════════════
          
          Este contenedor ocupa todo el espacio restante y contiene:
          1. Header superior con buscador
          2. Área de contenido (cambia según lo que esté seleccionado)
          
          Clases:
          - flex-1: Ocupa todo el espacio disponible
          - flex flex-col: Los hijos (header y main) se apilan verticalmente
          - overflow-hidden: Previene scroll a nivel de este contenedor
      */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────────────
            🎯 HEADER SUPERIOR (Buscador y botones)
            ───────────────────────────────────────────────────────────────────── */}
        <header className="bg-[#1a1a1a] border-b border-gray-800 p-4">
          <div className="flex items-center justify-center gap-4">
            
            {/* 
              BOTÓN TOGGLE SIDEBAR
              Muestra/oculta el menú lateral
            */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* 
              🔍 BARRA DE BÚSQUEDA
              
              Es un contenedor relativo (relative) para poder posicionar
              absolutamente (absolute) el icono de la lupa dentro.
              
              - flex-1: Ocupa el espacio disponible
              - max-w-xl: Ancho máximo de 576px para que no sea muy ancha
            */}
            <div className="flex-1 max-w-xl relative">
              {/* 
                Icono de lupa posicionado absolutamente DENTRO del input
                
                - absolute: Posicionamiento absoluto respecto al padre (relative)
                - left-4: 16px desde la izquierda
                - top-1/2 -translate-y-1/2: Centrado vertical perfecto
              */}
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              
              {/*
                INPUT DE BÚSQUEDA
                
                - value={searchQuery}: El valor viene del estado
                - onChange={(e) => setSearchQuery(e.target.value)}:
                  Cada vez que el usuario escribe, actualizamos el estado.
                  "e" es el evento, "e.target" es el input, "e.target.value" es el texto.
                
                - pl-12: padding-left de 48px (para que el texto no tape la lupa)
                - focus:border-blue-500: Cuando está enfocado, borde azul
                - focus:outline-none: Quita el outline por defecto del navegador
              */}
              <input
                type="text"
                placeholder="Buscar canción, artista o álbum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white pl-12 pr-4 py-3 rounded-full border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
              />
              
              {/*
                BOTÓN PARA LIMPIAR BÚSQUEDA (X)
                
                Solo aparece si hay texto en searchQuery.
                Renderizado condicional: {searchQuery && <botón>}
              */}
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 
              🏠 BOTÓN DE INICIO
              
              Al hacer clic:
              1. setSelectedArtist(null) - Deselecciona cualquier artista
              2. setViewMode('home') - Muestra la pantalla de inicio
              3. setSearchQuery('') - Limpia la búsqueda
              
              RESPONSIVE:
              - En móvil: Solo muestra el icono (hidden para el texto)
              - En desktop (md:): Muestra icono + texto
              - active:scale-95: Feedback táctil al presionar
            */}
            <button 
              onClick={() => { 
                setSelectedArtist(null); 
                setViewMode('home'); 
                setSearchQuery(''); 
              }}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 active:scale-95"
            >
              <Home size={18} />
              <span className="hidden md:inline text-sm font-medium">Inicio</span>
            </button>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────────────
            📦 ÁREA DE CONTENIDO PRINCIPAL
            
            Esta es la parte más compleja. Aquí se muestra contenido diferente
            según el estado de la app. Usamos RENDERIZADO CONDICIONAL encadenado.
            
            ORDEN DE PRIORIDAD (se evalúa de arriba a abajo):
            1. Si hay resultados de búsqueda → Mostrar resultados
            2. Si hay búsqueda pero sin resultados → Mostrar "No encontrado"
            3. Si viewMode es 'charts' → Mostrar vista de charts
            4. Si viewMode es 'home' o no hay artista → Mostrar pantalla de inicio
            5. Si hay artista seleccionado → Mostrar álbumes y canciones
            
            RESPONSIVE:
            - Padding reducido en móvil (p-4 vs p-6)
            - scroll-smooth: Hace que el scroll automático sea suave
            - overscroll-contain: Evita que el scroll "rebote" al límite
            ───────────────────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0a0a0a] scroll-smooth overscroll-contain">
          
          {/* ═══════════════════════════════════════════════════════════════════
              🔍 CASO 1: HAY RESULTADOS DE BÚSQUEDA
              ═══════════════════════════════════════════════════════════════════
              
              Condición: searchResults existe Y tiene elementos
              searchResults && searchResults.length > 0
              
              NOTA SOBRE EL OPERADOR TERNARIO ENCADENADO:
              condición1 ? resultado1 : condición2 ? resultado2 : resultado3
              
              Es como un if-else-if-else:
              if (condición1) { resultado1 }
              else if (condición2) { resultado2 }
              else { resultado3 }
          */}
          {searchResults && searchResults.length > 0 ? (
            <>
              {/* 
                <> y </> son "Fragmentos" de React.
                Permiten agrupar varios elementos sin agregar un div extra al DOM.
              */}
              <h2 className="text-2xl font-bold mb-2">Resultados de búsqueda</h2>
              <p className="text-gray-400 mb-6">
                {searchResults.length} resultados para "{searchQuery}"
              </p>
              
              {/* Lista de resultados */}
              <div className="bg-black rounded-xl p-4 border border-gray-800/50">
                <div className="space-y-2">
                  {/*
                    Mapeamos los resultados de búsqueda.
                    Cada resultado tiene un diseño consistente con icono,
                    nombre, artista/álbum, y botón de descarga.
                    
                    key={`${item.id}-${index}`}: Combinamos ID e índice porque
                    podrían haber IDs duplicados entre canciones y charts.
                    
                    RESPONSIVE:
                    - El botón de descarga muestra solo icono en móvil
                    - En desktop (md:) muestra icono + texto "Descargar"
                  */}
                  {searchResults.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center gap-3 md:gap-4 p-3 rounded-lg hover:bg-gray-900 transition-all duration-200"
                    >
                      {/* Icono: diferente para charts vs canciones */}
                      <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                        {item.type === 'chart' 
                          ? <FileText size={18} className="text-white" /> 
                          : <Music size={18} className="text-white" />
                        }
                      </div>
                      
                      {/* Información del item */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                        </div>
                      </div>
                      
                      {/* 
                        Botón de descarga RESPONSIVE
                        
                        - <a> en lugar de <button> porque abre un enlace
                        - href={item.downloadUrl}: URL de descarga de Google Drive
                        - target="_blank": Abre en nueva pestaña
                        - rel="noopener noreferrer": Seguridad para target="_blank"
                        - En móvil: Solo muestra el icono (hidden md:inline para el texto)
                        - active:scale-95: Feedback táctil al presionar
                      */}
                      <a 
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 active:scale-95 text-sm text-white flex-shrink-0"
                      >
                        <Download size={16} />
                        <span className="hidden md:inline">Descargar</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : searchResults && searchResults.length === 0 ? (
            /* ═══════════════════════════════════════════════════════════════════
               ❌ CASO 2: BÚSQUEDA SIN RESULTADOS
               ═══════════════════════════════════════════════════════════════════
               
               Se muestra cuando el usuario busca algo pero no hay coincidencias.
            */
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-gray-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No se encontraron resultados</h2>
              <p className="text-gray-400">Intenta con otros términos de búsqueda</p>
            </div>
          ) : viewMode === 'charts' ? (
            /* CASO 3: VISTA DE CHARTS - Se muestra cuando el usuario selecciona
               un artista de CHARTS en el sidebar */
            <>
              {(() => {
                // Buscar el artista de charts seleccionado
                const currentChart = data.charts.find(a => a.id === selectedArtist);
                
                // Si no se encuentra, no renderizar nada
                if (!currentChart) return null;
                
                return (
                  <>
                    <h2 className="text-3xl font-bold mb-6">{currentChart.name}</h2>
                    <p className="text-gray-400 mb-4">
                      {currentChart.charts.length} charts disponibles
                    </p>
                    
                    {/* Lista de charts */}
                    <div className="bg-black rounded-xl p-4 border border-gray-800/50">
                      <div className="space-y-2">
                        {currentChart.charts.map((chart, index) => (
                          <div
                            key={chart.id}
                            className="flex items-center gap-3 md:gap-4 p-3 rounded-lg hover:bg-gray-900 transition-all duration-200"
                          >
                            {/* Número de orden */}
                            <div className="w-6 md:w-8 text-center text-gray-400 text-sm font-medium">
                              {index + 1}
                            </div>
                            
                            {/* Icono naranja para charts (diferente a canciones) */}
                            <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-orange-500 to-red-600 rounded flex items-center justify-center">
                              <FileText size={18} className="text-white" />
                            </div>
                            
                            {/* Info del chart */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{chart.name}</div>
                              <div className="text-xs text-gray-500">PDF Chart</div>
                            </div>
                            
                            {/* Botón de descarga RESPONSIVE */}
                            <a 
                              href={chart.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 active:scale-95 text-sm text-white flex-shrink-0"
                            >
                              <Download size={16} />
                              <span className="hidden md:inline">Descargar</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          ) : viewMode === 'home' || !selectedArtist ? (
            /* CASO 4: PANTALLA DE INICIO - Se muestra al abrir la app o al presionar "Inicio" */
            <div className="flex flex-col items-center justify-start md:justify-center min-h-full text-center px-4 py-20 md:py-8">
              {/* Logo grande con efecto de gradiente y sombra */}
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-blue-500/20">
                <Music size={40} className="md:hidden text-white" />
                <Music size={48} className="hidden md:block text-white" />
              </div>
              
              {/* Texto de bienvenida */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Bienvenido a Secuencias OS</h1>
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                Tu biblioteca de secuencias y charts musicales. 
                Selecciona un artista del menú lateral para comenzar.
              </p>
              
              {/* 
                📊 ESTADÍSTICAS
                
                Mostramos el número de artistas, secuencias y charts.
                Usamos grid con 3 columnas para organizarlas.
                
                .toLocaleString() formatea números grandes con separadores:
                6289 → "6,289" (o "6.289" en español)
                
                RESPONSIVE:
                - Móvil: grid-cols-1 (una columna, apilado vertical)
                - Tablets y desktop (sm:): grid-cols-3 (lado a lado)
              */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 w-full max-w-lg sm:max-w-none">
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 transition-all duration-200 hover:border-blue-500/30">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500">
                    {data.stats.totalArtists}
                  </div>
                  <div className="text-sm text-gray-400">Artistas</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 transition-all duration-200 hover:border-blue-500/30">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500">
                    {data.stats.totalSongs.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Secuencias</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 transition-all duration-200 hover:border-blue-500/30">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500">
                    {data.stats.totalCharts.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Charts</div>
                </div>
              </div>

              {/* 
                🌟 ARTISTAS POPULARES (Accesos Directos)
                
                Mostramos algunos artistas populares como botones.
                Al hacer clic, se selecciona ese artista directamente.
                
                NOTA: Hardcodeamos los nombres porque sabemos cuáles son populares.
                Si un nombre no existe en data.artists, no se muestra (return null).
                
                RESPONSIVE:
                - Móvil: grid-cols-1 (una columna)
                - Desktop (sm:): grid-cols-2 (dos columnas)
              */}
              <div className="text-left w-full max-w-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3">ARTISTAS POPULARES</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 
                    Mapeamos un array de nombres y buscamos cada uno en data.artists.
                    Si el artista existe, mostramos un botón para él.
                  */}
                  {['Hillsong Worship', 'Elevation Worship', 'Bethel Music', 'Maverick City Music'].map(name => {
                    const artist = data.artists.find(a => a.name === name);
                    // Si no encontramos el artista, no renderizar nada
                    if (!artist) return null;
                    
                    return (
                      <button
                        key={artist.id}
                        onClick={() => { 
                          setSelectedArtist(artist.id); 
                          setViewMode('artists'); 
                        }}
                        className="flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-[0.98] text-left"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music size={18} className="text-white" />
                        </div>
                        <span className="font-medium truncate">{artist.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : currentArtist && (
            /* CASO 5: VISTA DE ARTISTA - Muestra álbumes y canciones del artista seleccionado */
            <>
              {/* Título y estadísticas del artista */}
              {/* 
                🏷️ TÍTULO Y ESTADÍSTICAS DEL ARTISTA
                
                RESPONSIVE:
                - Título más pequeño en móvil (text-2xl vs text-3xl)
              */}
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{currentArtist.name}</h2>
              <p className="text-gray-400 mb-6 text-sm md:text-base">
                {/* 
                  Calculamos el total de canciones sumando las de todos los álbumes.
                  .reduce() acumula valores: empezamos en 0 (sum) y sumamos cada álbum.
                */}
                {currentArtist.albums.length} álbumes • {currentArtist.albums.reduce((sum, a) => sum + a.songs.length, 0)} canciones
              </p>

              {/* 
                📂 LISTA DE ÁLBUMES CON TOGGLE (COLAPSABLES)
                
                Cada álbum es un bloque que:
                1. Muestra el nombre del álbum (siempre visible)
                2. Al hacer clic, se expande/colapsa para mostrar las canciones
                
                RESPONSIVE:
                - Padding reducido en móvil (p-3 vs p-4)
                - Icono de carpeta más pequeño en móvil
              */}
              {currentArtist.albums.map(album => (
                <div key={album.id} className="mb-3 md:mb-4">
                  {/* 
                    HEADER DEL ÁLBUM (Clickeable para toggle)
                    
                    Al hacer clic, llamamos a toggleAlbum(album.id) que cambia
                    el estado expandedAlbums para este álbum específico.
                    
                    - transition-all duration-200: Transición suave al interactuar
                    - active:scale-[0.99]: Feedback sutil al presionar
                  */}
                  <button
                    onClick={() => toggleAlbum(album.id)}
                    className="w-full bg-[#1a1a1a] hover:bg-[#222] rounded-xl p-3 md:p-4 border border-gray-800/50 transition-all duration-200 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      {/* 
                        Icono de flecha (indica si está expandido o no)
                        transition-transform: Anima la rotación suavemente
                      */}
                      <div className={`text-gray-400 transition-transform duration-200 ${expandedAlbums[album.id] ? 'rotate-90' : ''}`}>
                        <ChevronRight size={20} />
                      </div>
                      
                      {/* Icono de carpeta - más pequeño en móvil */}
                      <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                        <Folder size={18} className="md:hidden text-white" />
                        <Folder size={22} className="hidden md:block text-white" />
                      </div>
                      
                      {/* Información del álbum */}
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="text-base md:text-lg font-semibold text-white truncate">{album.name}</h4>
                        <p className="text-xs md:text-sm text-gray-400">{album.songs.length} canciones</p>
                      </div>
                    </div>
                  </button>

                  {/* 
                    📋 LISTA DE CANCIONES (Solo visible si el álbum está expandido)
                    
                    Renderizado condicional: solo si expandedAlbums[album.id] es true
                    
                    ANIMACIÓN: La aparición usa transition-all para un efecto suave
                  */}
                  {expandedAlbums[album.id] && (
                    <div className="mt-2 bg-black rounded-xl p-3 md:p-4 border border-gray-800/50 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        {album.songs.map((song, index) => (
                          <div
                            key={song.id}
                            className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-gray-900 transition-all duration-200 group"
                          >
                            {/* Número de track */}
                            <div className="w-6 md:w-8 text-center text-gray-400 text-sm font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            
                            {/* Información de la canción */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm md:text-base truncate">{song.name}</div>
                              <div className="text-xs text-gray-500 hidden md:block">
                                {song.type === 'sequence' ? 'Secuencia' : 'Archivo'}
                              </div>
                            </div>
                            
                            {/* 
                              Botón de descarga RESPONSIVE
                              - En móvil: Solo icono con padding reducido
                              - En desktop (md:): Icono + texto "Descargar"
                              - active:scale-95: Feedback táctil
                            */}
                            <div className="flex gap-2 flex-shrink-0">
                              <a 
                                href={song.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 active:scale-95 text-sm text-white"
                              >
                                <Download size={16} />
                                <span className="hidden md:inline">Descargar</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </main>
      </div>
    </div>
  );
};


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                           📤 EXPORTACIÓN                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
// 
// "export default" hace que este componente esté disponible para importarse
// desde otros archivos. En main.jsx, importamos App y lo renderizamos.
// 
// EJEMPLO de cómo se usa en main.jsx:
//   import App from './App.jsx'
//   ReactDOM.render(<App />, document.getElementById('root'))

export default App;


/* ═══════════════════════════════════════════════════════════════════════════════
   ═══════════════════════════════════════════════════════════════════════════════
   
                            📖 GUÍA DE REFERENCIA RÁPIDA
   
   ═══════════════════════════════════════════════════════════════════════════════
   ═══════════════════════════════════════════════════════════════════════════════

   🎨 CAMBIAR COLORES:
   ─────────────────────────────────────────────────────────────────────────────
   • Fondo principal (casi negro): Busca "bg-[#121212]"
   • Sidebar: Busca "bg-[#1a1a1a]"
   • Color azul (botones, acentos): Busca "blue-500", "blue-600", "blue-700"
   • Para usar otro color, cambia "blue" por: red, green, purple, pink, orange, etc.
   • Ejemplo: "bg-blue-600" → "bg-purple-600"

   📊 MODIFICAR DATOS:
   ─────────────────────────────────────────────────────────────────────────────
   • Todos los datos vienen de: src/data.json
   • Para agregar un artista, edita el array "artists" en el JSON
   • Para agregar charts, edita el array "charts" en el JSON
   • Formato de un artista:
     {
       "id": "id-unico",
       "name": "Nombre del Artista",
       "albums": [
         {
           "id": "id-album",
           "name": "Nombre del Álbum",
           "songs": [
             { "id": "id-cancion", "name": "Nombre", "downloadUrl": "https://..." }
           ]
         }
       ]
     }

   🔧 MODIFICAR FUNCIONALIDAD:
   ─────────────────────────────────────────────────────────────────────────────
   • Para cambiar qué pasa al hacer clic, busca "onClick"
   • Para cambiar la búsqueda, modifica la función searchResults
   • Para agregar más secciones, copia la estructura de "ARTISTAS" o "CHARTS"

   📐 MODIFICAR LAYOUT:
   ─────────────────────────────────────────────────────────────────────────────
   • Ancho del sidebar: Busca "w-64" (256px) y cámbialo
   • Espaciado: Los números en "p-4" (padding) y "m-4" (margin) son:
     1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 6 = 24px, 8 = 32px
   • Para centrar algo: usa "flex items-center justify-center"

   🌙 CLASES DE TAILWIND MÁS USADAS:
   ─────────────────────────────────────────────────────────────────────────────
   • flex: Activa Flexbox
   • items-center: Centra verticalmente
   • justify-center: Centra horizontalmente
   • gap-4: Espacio entre elementos
   • rounded-lg: Bordes redondeados
   • hover:bg-gray-800: Color al pasar el mouse
   • transition-colors: Animación suave de colores
   • truncate: Corta texto largo con "..."
   • text-sm, text-lg, text-xl: Tamaños de texto
   • font-bold, font-medium: Grosor del texto

   ═══════════════════════════════════════════════════════════════════════════════
*/
