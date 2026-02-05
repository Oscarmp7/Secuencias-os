/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   📊 WORSHIP BOX - GESTOR DE DATOS                                            ║
 * ║                                                                               ║
 * ║   Herramienta para gestionar la biblioteca de secuencias y charts usando      ║
 * ║   un archivo Excel (XLSX) como interfaz de edición.                           ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * FUNCIONALIDADES:
 * ────────────────
 * 1. Exportar secuencias.json y software.json a Excel (XLSX)
 * 2. Importar cambios desde Excel a los JSONs
 * 3. Agregar nuevos campos a todas las canciones/charts
 * 4. Detectar y gestionar duplicados
 * 5. Backup automático antes de modificar
 * 
 * USO:
 * ────
 * node tools/data-manager.cjs                    → Menú interactivo
 * node tools/data-manager.cjs --export           → Exportar a Excel
 * node tools/data-manager.cjs --import           → Importar desde Excel
 * node tools/data-manager.cjs --add-fields       → Agregar campos nuevos al JSON
  ${c.cyan}7.${c.reset} 🔍 Buscar duplicados (solo ver)
 * 
 * REQUISITOS:
 * ───────────
 * npm install xlsx-js-style (o xlsx, ejecutar en la carpeta app)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════════════════════
//   ⚙️ CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Archivos de datos (estructura modular)
  DATA_DIR: path.join(__dirname, '..', 'src', 'data'),
  SECUENCIAS_FILE: path.join(__dirname, '..', 'src', 'data', 'secuencias.json'),
  SOFTWARE_FILE: path.join(__dirname, '..', 'src', 'data', 'software.json'),
  
  // Archivos Excel dedicados para cada JSON
  EXCEL_DIR: path.join(__dirname, '..', 'data'),
  EXCEL_SECUENCIAS: path.join(__dirname, '..', 'data', 'worship-box-secuencias.xlsx'),
  EXCEL_SOFTWARE: path.join(__dirname, '..', 'data', 'worship-box-software.xlsx'),
  
  BACKUP_DIR: path.join(__dirname, '..', 'backups'),
  
  // Carpetas de aportes de la comunidad
  APORTES_DIR: path.join(__dirname, '..', 'aportes'),
  APORTES_SECUENCIAS_DIR: path.join(__dirname, '..', 'aportes', 'secuencias'),
  APORTES_SOFTWARE_DIR: path.join(__dirname, '..', 'aportes', 'software'),
  
  // Límite máximo de backups a mantener
  MAX_BACKUPS: 3,
  
  // Campos nuevos para canciones (con valores por defecto)
  NEW_SONG_FIELDS: {
    compas: null,      // ej: "4/4", "3/4", "6/8"
    bpm: null,         // ej: 120
    tonalidad: null,   // ej: "C", "Dm", "F#"
    duracion: null,    // ej: "4:32"
    tipoSecuencia: null, // "Original", "Cover", "Usuario", "IA"
    comentarios: null
  },
  
  // Campos nuevos para charts
  NEW_CHART_FIELDS: {
    songId: null,        // ID de la canción enlazada (para vincular chart ↔ secuencia)
    songName: null,      // Nombre de la canción enlazada (referencia visual)
    tonalidad: null,
    compas: null,
    comentarios: null
  }
};

// Colores para la consola
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Iconos ASCII compatibles con Windows PowerShell
const icons = {
  chart: '[#]',
  export: '[>]',
  import: '[<]',
  add: '[+]',
  combine: '[=]',
  review: '[?]',
  approve: '[v]',
  clean: '[x]',
  sync: '[~]',
  validate: '[!]',
  search: '[*]',
  backup: '[S]',
  exit: '[0]',
  check: 'v',
  cross: 'x',
  warn: '!',
  info: 'i',
  arrow: '->',
  bullet: '*',
};

// ═══════════════════════════════════════════════════════════════════════════════
//   📚 UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════

function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function ask(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

function clearScreen() {
  console.clear();
}

function showBanner() {
  console.log(`
${c.cyan}${c.bold}+---------------------------------------------------------------+
|                                                               |
|   ${c.white}WORSHIP BOX - GESTOR DE DATOS${c.cyan}                              |
|                                                               |
+---------------------------------------------------------------+${c.reset}
`);
}

function formatDate(date) {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Normaliza texto para comparaciones (sin acentos, minúsculas, sin espacios extra)
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Obtiene la ruta del archivo de datos según el tipo
 * @param {string} type - 'secuencias' o 'software'
 */
function getDataFilePath(type = 'secuencias') {
  if (type === 'software') return CONFIG.SOFTWARE_FILE;
  if (type === 'secuencias') return CONFIG.SECUENCIAS_FILE;
  throw new Error(`Tipo de datos no válido: ${type}`);
}

/**
 * Lee el archivo secuencias.json (secuencias por defecto)
 */
function readDataJson(type = 'secuencias') {
  const filePath = getDataFilePath(type);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Guarda el archivo JSON correspondiente
 */
function saveDataJson(data, type = 'secuencias') {
  const filePath = getDataFilePath(type);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Crea un backup del JSON correspondiente y limpia backups antiguos
 */
function createBackup(type = 'secuencias') {
  if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
    fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
  }
  
  const filePath = getDataFilePath(type);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = type === 'software' ? 'software' : 'secuencias';
  const backupFile = path.join(CONFIG.BACKUP_DIR, `${fileName}-backup-${timestamp}.json`);
  
  fs.copyFileSync(filePath, backupFile);
  console.log(`${c.green}✓ Backup creado: ${backupFile}${c.reset}`);
  
  // Limpiar backups antiguos
  cleanupOldBackups(fileName);
  
  return backupFile;
}

/**
 * Elimina backups antiguos manteniendo solo los más recientes
 * @param {string} prefix - Prefijo del archivo (ej: 'secuencias' o 'software')
 */
function cleanupOldBackups(prefix = 'data') {
  try {
    const files = fs.readdirSync(CONFIG.BACKUP_DIR)
      .filter(file => file.startsWith(`${prefix}-backup-`) && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(CONFIG.BACKUP_DIR, file),
        time: fs.statSync(path.join(CONFIG.BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Más reciente primero

    // Eliminar backups que excedan el límite
    if (files.length > CONFIG.MAX_BACKUPS) {
      const toDelete = files.slice(CONFIG.MAX_BACKUPS);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`${c.yellow}🗑️ Backup antiguo eliminado: ${file.name}${c.reset}`);
      });
    }
  } catch (error) {
    console.error(`${c.red}Error limpiando backups: ${error.message}${c.reset}`);
  }
}

/**
 * Verifica si xlsx está instalado
 */
function checkXlsxInstalled() {
  try {
    require.resolve('xlsx-js-style');
    return true;
  } catch (e) {
    try {
      require.resolve('xlsx');
      return true;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🔧 AGREGAR CAMPOS NUEVOS AL SECUENCIAS.JSON
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Agrega los campos nuevos a todas las canciones y charts
 */
function addNewFieldsToData() {
  console.log(`\n${c.cyan}📝 Agregando campos nuevos al secuencias.json...${c.reset}\n`);
  
  const data = readDataJson();
  let songsUpdated = 0;
  let chartsUpdated = 0;
  
  // Agregar campos a canciones
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs) {
            album.songs.forEach(song => {
              // Solo agregar campos que no existen
              Object.keys(CONFIG.NEW_SONG_FIELDS).forEach(field => {
                if (!(field in song)) {
                  song[field] = CONFIG.NEW_SONG_FIELDS[field];
                  songsUpdated++;
                }
              });
            });
          }
        });
      }
    });
  }
  
  // Agregar campos a charts
  if (data.charts) {
    data.charts.forEach(artist => {
      if (artist.charts) {
        artist.charts.forEach(chart => {
          Object.keys(CONFIG.NEW_CHART_FIELDS).forEach(field => {
            if (!(field in chart)) {
              chart[field] = CONFIG.NEW_CHART_FIELDS[field];
              chartsUpdated++;
            }
          });
        });
      }
    });
  }
  
  // Actualizar fecha
  data.lastUpdated = new Date().toISOString();
  
  // Guardar
  createBackup();
  saveDataJson(data);
  
  console.log(`${c.green}✓ Campos agregados:${c.reset}`);
  console.log(`  • Canciones actualizadas: ${songsUpdated}`);
  console.log(`  • Charts actualizados: ${chartsUpdated}`);
  
  return { songsUpdated, chartsUpdated };
}

// ═══════════════════════════════════════════════════════════════════════════════
//   📤 EXPORTAR A EXCEL (CON ESTILOS)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Crea estilos para xlsx-js-style
 */
function createStyles() {
  return {
    // Header principal (azul Worship Box)
    headerMain: {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "1D4ED8" } },
        bottom: { style: "thin", color: { rgb: "1D4ED8" } },
        left: { style: "thin", color: { rgb: "1D4ED8" } },
        right: { style: "thin", color: { rgb: "1D4ED8" } }
      }
    },
    // Header secundario (gris)
    headerSecondary: {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "6B7280" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "4B5563" } },
        bottom: { style: "thin", color: { rgb: "4B5563" } },
        left: { style: "thin", color: { rgb: "4B5563" } },
        right: { style: "thin", color: { rgb: "4B5563" } }
      }
    },
    // Columna Acción header (amarillo)
    actionHeader: {
      font: { bold: true, color: { rgb: "000000" }, sz: 11 },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "FCD34D" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: "D97706" } },
        bottom: { style: "medium", color: { rgb: "D97706" } },
        left: { style: "medium", color: { rgb: "D97706" } },
        right: { style: "medium", color: { rgb: "D97706" } }
      }
    },
    // Fila par (blanco)
    rowEven: {
      font: { sz: 10 },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "FFFFFF" } },
      alignment: { vertical: "center" }
    },
    // Fila impar (gris muy claro)
    rowOdd: {
      font: { sz: 10 },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "F9FAFB" } },
      alignment: { vertical: "center" }
    },
    // Celda de Acción (amarillo claro)
    actionCell: {
      font: { sz: 10, bold: true },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "FEF3C7" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "F59E0B" } },
        right: { style: "thin", color: { rgb: "F59E0B" } }
      }
    },
    // Celda con enlace (verde claro)
    linkedCell: {
      font: { sz: 10, color: { rgb: "065F46" } },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "D1FAE5" } },
      alignment: { vertical: "center" }
    },
    // Celda sin enlace (rojo claro)
    unlinkedCell: {
      font: { sz: 10, color: { rgb: "991B1B" } },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "FEE2E2" } },
      alignment: { vertical: "center" }
    },
    // Título instrucciones
    instructionTitle: {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center", vertical: "center" }
    },
    // Subtítulo instrucciones
    instructionSubtitle: {
      font: { bold: true, color: { rgb: "1F2937" }, sz: 11 },
      fill: { type: "pattern", patternType: "solid", fgColor: { rgb: "E5E7EB" } },
      alignment: { vertical: "center" }
    },
    // Texto instrucciones
    instructionText: {
      font: { color: { rgb: "374151" }, sz: 10 },
      alignment: { vertical: "center" }
    }
  };
}

/**
 * Obtiene la referencia de celda (ej: "A1", "B2")
 */
function getCellRef(col, row) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let colStr = '';
  let c = col;
  while (c >= 0) {
    colStr = letters[c % 26] + colStr;
    c = Math.floor(c / 26) - 1;
  }
  return colStr + (row + 1);
}

/**
 * Exporta los JSONs a archivos Excel con estilos
 */
function exportToExcel() {
  let XLSX;
  let hasStyleSupport = false;
  
  try {
    XLSX = require('xlsx-js-style');
    hasStyleSupport = true;
  } catch (e) {
    try {
      XLSX = require('xlsx');
      console.log(`${c.yellow}⚠ Usando xlsx básico. Para estilos: npm install xlsx-js-style${c.reset}`);
    } catch (e2) {
      console.log(`\n${c.red}❌ Error: No hay paquete xlsx instalado.${c.reset}`);
      console.log(`${c.yellow}   Ejecuta: npm install xlsx-js-style${c.reset}\n`);
      return;
    }
  }
  
  console.log(`\n${c.cyan}📤 Exportando JSONs a Excel...${c.reset}\n`);
  
  const data = readDataJson();
  const styles = createStyles();
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CONSTRUIR ÍNDICE DE RELACIONES
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`${c.dim}  Analizando relaciones...${c.reset}`);
  
  // Set de songIds que tienen charts
  const songsWithCharts = new Set();
  if (data.charts) {
    data.charts.forEach(artist => {
      if (artist.charts) {
        artist.charts.forEach(chart => {
          if (chart.songId) {
            songsWithCharts.add(chart.songId);
          }
        });
      }
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // HOJA 1: SECUENCIAS (canciones) - TODAS LAS COLUMNAS DE SECUENCIAS.JSON
  // ─────────────────────────────────────────────────────────────────────────────
  const songHeaders = [
    'Accion',           // Acciones: Agregar, Eliminar, Principal
    'TieneChart',       // ✓ si tiene chart PDF
    'Artista',          // Nombre del artista
    'Album',            // Nombre del álbum
    'Cancion',          // Nombre de la canción (sin extensión)
    'NombreArchivo',    // fullName - nombre completo del archivo
    'Tipo',             // type - sequence, chart, etc.
    'CancionID',        // id único de la canción
    'DriveID',          // ID de Google Drive
    'LinkDescarga',     // downloadUrl
    'Compas',           // 4/4, 3/4, 6/8, etc.
    'BPM',              // Beats por minuto
    'Tonalidad',        // Do, Re, Mi, etc.
    'Duracion',         // Duración de la canción
    'TipoSecuencia',    // Original, Cover, Usuario, IA
    'Comentarios',      // Notas adicionales
    'ChartUrl',         // URL del chart PDF (si existe)
    'ChartName'         // Nombre del archivo chart
  ];
  
  const songsData = [];
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs) {
            album.songs.forEach(song => {
              const hasChart = song.chartUrl ? true : (songsWithCharts.has(song.id) || songsWithCharts.has(song.driveId));
              songsData.push([
                '',                                    // Accion
                hasChart ? '✓' : '',                  // TieneChart
                artist.name,                           // Artista
                album.name,                            // Album
                song.name,                             // Cancion
                song.fullName || '',                   // NombreArchivo
                song.type || 'sequence',               // Tipo
                song.id,                               // CancionID
                song.driveId || song.id,               // DriveID
                song.downloadUrl || '',                // LinkDescarga
                song.compas || '',                     // Compas
                song.bpm || '',                        // BPM
                song.tonalidad || '',                  // Tonalidad
                song.duracion || '',                   // Duracion
                song.tipoSecuencia || '',              // TipoSecuencia
                song.comentarios || '',                // Comentarios
                song.chartUrl || '',                   // ChartUrl
                song.chartName || ''                   // ChartName
              ]);
            });
          }
        });
      }
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // HOJA 2: CHARTS - CON INDICADOR VISUAL DE ENLACE
  // ─────────────────────────────────────────────────────────────────────────────
  const chartHeaders = [
    'Accion', 'Enlazado', 'Artista', 'Chart', 'ChartID', 'DriveID',
    'SongID', 'SongName', 'Tonalidad', 'Compas', 'Comentarios'
  ];
  
  const chartsData = [];
  if (data.charts) {
    data.charts.forEach(artist => {
      if (artist.charts) {
        artist.charts.forEach(chart => {
          const isLinked = chart.songId && chart.songId.trim() !== '';
          chartsData.push([
            '',                              // Accion
            isLinked ? '✓' : '✗',           // Enlazado
            artist.name,                     // Artista
            chart.name,                      // Chart
            chart.id,                        // ChartID
            chart.driveId || chart.id,       // DriveID
            chart.songId || '',              // SongID
            chart.songName || '',            // SongName
            chart.tonalidad || '',           // Tonalidad
            chart.compas || '',              // Compas
            chart.comentarios || ''          // Comentarios
          ]);
        });
      }
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // HOJA 3: INSTRUCCIONES - GUÍA COMPLETA
  // ─────────────────────────────────────────────────────────────────────────────
  const instructionsData = [
    ['🎵 WORSHIP BOX - GESTOR DE DATOS'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['📋 COLUMNA "ACCIÓN" - Opciones disponibles:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   (vacío)     →  No hacer cambios, mantener registro'],
    ['   Agregar     →  Agregar como nuevo registro'],
    ['   Eliminar    →  Eliminar este registro'],
    ['   Principal   →  Conservar esta versión, eliminar duplicados'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['🎼 COLUMNA "TIPO SECUENCIA" - Clasificación del contenido:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   Original    →  Secuencia oficial del artista/productor'],
    ['   Cover       →  Versión cover de otro artista'],
    ['   Usuario     →  Creada por usuario de la comunidad'],
    ['   IA          →  Generada por inteligencia artificial'],
    ['   (vacío)     →  Sin clasificar'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['📁 COLUMNAS DEL ARCHIVO - Datos del archivo:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   Cancion        →  Nombre limpio de la canción (para mostrar)'],
    ['   NombreArchivo  →  Nombre completo del archivo (con extensión)'],
    ['   Tipo           →  "sequence" para secuencias, "chart" para PDFs'],
    ['   DriveID        →  ID único del archivo en Google Drive (opcional)'],
    ['   LinkDescarga   →  URL de descarga (obligatoria si no hay DriveID)'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['🎵 COLUMNAS MUSICALES - Información de la canción:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   Compas      →  4/4, 3/4, 6/8, etc.'],
    ['   BPM         →  Número de beats por minuto'],
    ['   Tonalidad   →  Do, Re, Mi, Fa, Sol, La, Si (mayor o menor)'],
    ['   Duracion    →  Formato MM:SS o texto libre'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['📄 COLUMNAS DEL CHART PDF - Enlace a partitura:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   ChartUrl    →  URL de descarga del PDF del chart'],
    ['   ChartName   →  Nombre del archivo PDF del chart'],
    [''],
    ['   💡 Si añades un ChartUrl válido, aparecerá el botón naranja'],
    ['      de "Descargar Chart" junto a la secuencia en la app'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['📊 COLUMNAS DE ESTADO (solo lectura):'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   TieneChart  →  ✓ = tiene chart PDF asociado (calculado)'],
    ['   Enlazado    →  ✓ = tiene secuencia, ✗ = sin secuencia'],
    [''],
    ['🎨 COLORES:'],
    ['   🟢 Verde    →  Enlazado correctamente / Tiene chart'],
    ['   🔴 Rojo     →  Sin enlazar / Sin chart'],
    ['   🟡 Amarillo →  Columna de Acción'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['➕ PARA AGREGAR UNA NUEVA CANCIÓN:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   1. Añade una nueva fila al final de la hoja "Secuencias"'],
    ['   2. Pon "Agregar" en la columna Accion'],
    ['   3. CAMPOS REQUERIDOS:'],
    ['      • Artista     - Nombre del artista (usa exacto si ya existe)'],
    ['      • Album       - Nombre del álbum (usa exacto si ya existe)'],
    ['      • Cancion     - Nombre de la canción'],
    ['      • LinkDescarga - URL de descarga (o DriveID si es Google Drive)'],
    [''],
    ['   4. CAMPOS OPCIONALES (recomendados):'],
    ['      • NombreArchivo  - Nombre completo con extensión'],
    ['      • Tipo           - "sequence" (por defecto)'],
    ['      • DriveID        - ID de Google Drive (opcional)'],
    ['      • LinkDescarga   - Si usas DriveID, se puede generar automática'],
    ['      • Campos musicales: Compas, BPM, Tonalidad, Duracion'],
    ['      • TipoSecuencia  - Original, Cover, Usuario, IA'],
    ['      • ChartUrl/ChartName - Si tienes el PDF del chart'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['❌ PARA ELIMINAR UNA CANCIÓN:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   1. Busca la canción en la hoja "Secuencias"'],
    ['   2. Pon "Eliminar" en la columna Accion'],
    ['   3. Guarda e importa'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['✏️ PARA EDITAR UNA CANCIÓN:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   1. Busca la canción en la hoja "Secuencias"'],
    ['   2. Modifica los campos que desees (excepto IDs)'],
    ['   3. Pon "Agregar" en Accion (reemplazará la existente por ID/URL)'],
    ['   4. Guarda e importa'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['🔄 DESPUÉS DE EDITAR:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   1. Guarda este archivo Excel (Ctrl+S)'],
    ['   2. Abre terminal en /app'],
    ['   3. Ejecuta: node tools/data-manager.cjs --import'],
    ['   4. Revisa el reporte de cambios'],
    ['   5. Si todo está bien, haz commit y deploy'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['💡 TIPS Y TRUCOS:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   • Usa filtros de Excel para buscar por Artista o Album'],
    ['   • Ctrl+H para reemplazos masivos'],
    ['   • NO modifiques CancionID ni DriveID de registros existentes (si aplica)'],
    ['   • Para obtener DriveID: abre el archivo en Drive, el ID está en la URL'],
    ['   • Ejemplo URL: drive.google.com/file/d/ESTE_ES_EL_ID/view'],
    ['   • La columna TieneChart se actualiza automáticamente'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['⚠️ IMPORTANTE - NO HACER:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   ❌ No modifiques los IDs de registros existentes'],
    ['   ❌ No elimines las columnas de encabezado'],
    ['   ❌ No cambies el nombre de las hojas'],
    ['   ❌ No uses tildes diferentes (usa las del archivo original)']
  ];
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CREAR HOJAS CON ESTILOS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Crear hojas
  const songsSheet = XLSX.utils.aoa_to_sheet([songHeaders, ...songsData]);
  const chartsSheet = XLSX.utils.aoa_to_sheet([chartHeaders, ...chartsData]);
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  
  if (hasStyleSupport) {
    console.log(`${c.dim}  Aplicando estilos y colores...${c.reset}`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // ESTILOS PARA SECUENCIAS
    // ─────────────────────────────────────────────────────────────────────────
    // Headers
    for (let col = 0; col < songHeaders.length; col++) {
      const cellRef = getCellRef(col, 0);
      if (songsSheet[cellRef]) {
        if (col === 0) {
          songsSheet[cellRef].s = styles.actionHeader;
        } else if (col === 1) { // TieneChart
          songsSheet[cellRef].s = styles.headerMain;
        } else if (col === 2 || col === 4) { // Artista, Cancion
          songsSheet[cellRef].s = styles.headerMain;
        } else {
          songsSheet[cellRef].s = styles.headerSecondary;
        }
      }
    }
    
    // Filas de datos - colorear según si tiene chart
    for (let row = 0; row < songsData.length; row++) {
      const excelRow = row + 1;
      const hasChart = songsData[row][1] === '✓'; // Columna TieneChart
      
      for (let col = 0; col < songHeaders.length; col++) {
        const cellRef = getCellRef(col, excelRow);
        if (!songsSheet[cellRef]) {
          songsSheet[cellRef] = { v: '', t: 's' };
        }
        
        if (col === 0) { // Accion
          songsSheet[cellRef].s = styles.actionCell;
        } else if (col === 1) { // TieneChart - colorear verde/rojo
          songsSheet[cellRef].s = hasChart ? styles.linkedCell : styles.unlinkedCell;
        } else {
          // Filas alternadas pero con tinte según estado
          songsSheet[cellRef].s = row % 2 === 0 ? styles.rowEven : styles.rowOdd;
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // ESTILOS PARA CHARTS
    // ─────────────────────────────────────────────────────────────────────────
    // Headers
    for (let col = 0; col < chartHeaders.length; col++) {
      const cellRef = getCellRef(col, 0);
      if (chartsSheet[cellRef]) {
        if (col === 0) {
          chartsSheet[cellRef].s = styles.actionHeader;
        } else if (col === 1) { // Enlazado
          chartsSheet[cellRef].s = styles.headerMain;
        } else if (col === 2 || col === 3 || col === 6 || col === 7) { // Artista, Chart, SongID, SongName
          chartsSheet[cellRef].s = styles.headerMain;
        } else {
          chartsSheet[cellRef].s = styles.headerSecondary;
        }
      }
    }
    
    // Filas de datos - colorear según enlace
    for (let row = 0; row < chartsData.length; row++) {
      const excelRow = row + 1;
      const isLinked = chartsData[row][1] === '✓'; // Columna Enlazado
      
      for (let col = 0; col < chartHeaders.length; col++) {
        const cellRef = getCellRef(col, excelRow);
        if (!chartsSheet[cellRef]) {
          chartsSheet[cellRef] = { v: '', t: 's' };
        }
        
        if (col === 0) { // Accion
          chartsSheet[cellRef].s = styles.actionCell;
        } else if (col === 1 || col === 6 || col === 7) { // Enlazado, SongID, SongName
          chartsSheet[cellRef].s = isLinked ? styles.linkedCell : styles.unlinkedCell;
        } else {
          chartsSheet[cellRef].s = row % 2 === 0 ? styles.rowEven : styles.rowOdd;
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // ESTILOS PARA INSTRUCCIONES
    // ─────────────────────────────────────────────────────────────────────────
    for (let row = 0; row < instructionsData.length; row++) {
      const cellRef = getCellRef(0, row);
      if (instructionsSheet[cellRef]) {
        const text = instructionsData[row][0] || '';
        if (row === 0) {
          instructionsSheet[cellRef].s = styles.instructionTitle;
        } else if (text.match(/^[📋✅📝🎯💡🔄📊]/)) {
          instructionsSheet[cellRef].s = styles.instructionSubtitle;
        } else {
          instructionsSheet[cellRef].s = styles.instructionText;
        }
      }
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIGURAR ANCHOS DE COLUMNA
  // ─────────────────────────────────────────────────────────────────────────────
  songsSheet['!cols'] = [
    { wch: 12 },  // Accion
    { wch: 12 },  // TieneChart
    { wch: 22 },  // Artista
    { wch: 28 },  // Album
    { wch: 35 },  // Cancion
    { wch: 40 },  // NombreArchivo (fullName)
    { wch: 12 },  // Tipo
    { wch: 36 },  // CancionID
    { wch: 36 },  // DriveID
    { wch: 55 },  // LinkDescarga (URL)
    { wch: 8 },   // Compas
    { wch: 8 },   // BPM
    { wch: 10 },  // Tonalidad
    { wch: 10 },  // Duracion
    { wch: 12 },  // TipoSecuencia
    { wch: 25 },  // Comentarios
    { wch: 55 },  // ChartUrl
    { wch: 40 }   // ChartName
  ];
  
  chartsSheet['!cols'] = [
    { wch: 12 },  // Accion
    { wch: 12 },  // Enlazado
    { wch: 22 },  // Artista
    { wch: 40 },  // Chart
    { wch: 36 },  // ChartID
    { wch: 36 },  // DriveID
    { wch: 36 },  // SongID
    { wch: 40 },  // SongName
    { wch: 10 },  // Tonalidad
    { wch: 8 },   // Compas
    { wch: 25 }   // Comentarios
  ];
  
  instructionsSheet['!cols'] = [{ wch: 65 }];
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AGREGAR DROPDOWN DE VALIDACIÓN PARA COLUMNA ACCIÓN
  // ─────────────────────────────────────────────────────────────────────────────
  const actionOptions = ['', 'Agregar', 'Eliminar', 'Principal'];
  
  // Validación para Secuencias (columna A, filas 2 hasta el final)
  songsSheet['!dataValidation'] = [{
    type: 'list',
    sqref: `A2:A${songsData.length + 1}`,
    formula1: `"${actionOptions.join(',')}"`
  }];
  
  // Validación para Charts (columna A, filas 2 hasta el final)
  chartsSheet['!dataValidation'] = [{
    type: 'list',
    sqref: `A2:A${chartsData.length + 1}`,
    formula1: `"${actionOptions.join(',')}"`
  }];
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIGURAR AUTOFILTER
  // ─────────────────────────────────────────────────────────────────────────────
  songsSheet['!autofilter'] = { ref: `A1:R${songsData.length + 1}` };
  chartsSheet['!autofilter'] = { ref: `A1:K${chartsData.length + 1}` };
  
  // Altura de filas
  songsSheet['!rows'] = [{ hpt: 22 }];
  chartsSheet['!rows'] = [{ hpt: 22 }];
  instructionsSheet['!rows'] = [{ hpt: 28 }];
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CREAR Y GUARDAR LIBRO
  // ─────────────────────────────────────────────────────────────────────────────
  const workbook = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(workbook, songsSheet, 'Secuencias');
  XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Charts');
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
  
  // Crear directorio si no existe
  const excelDir = path.dirname(CONFIG.EXCEL_SECUENCIAS);
  if (!fs.existsSync(excelDir)) {
    fs.mkdirSync(excelDir, { recursive: true });
  }
  
  // Guardar archivo de secuencias
  XLSX.writeFile(workbook, CONFIG.EXCEL_SECUENCIAS);
  
  // Estadísticas
  const songsWithChartsCount = songsData.filter(r => r[1] === '✓').length;
  const songsWithoutCharts = songsData.length - songsWithChartsCount;
  const linkedCharts = chartsData.filter(r => r[1] === '✓').length;
  const unlinkedCharts = chartsData.length - linkedCharts;
  
  console.log(`${c.green}✓ Excel de secuencias exportado exitosamente!${c.reset}`);
  console.log(`  • Archivo: ${CONFIG.EXCEL_SECUENCIAS}`);
  console.log(`\n  📀 ${c.bold}SECUENCIAS:${c.reset} ${songsData.length} total`);
  console.log(`    └─ ${c.green}Con chart: ${songsWithChartsCount}${c.reset}`);
  console.log(`    └─ ${c.red}Sin chart: ${songsWithoutCharts}${c.reset}`);
  console.log(`\n  📄 ${c.bold}CHARTS:${c.reset} ${chartsData.length} total`);
  console.log(`    └─ ${c.green}Enlazados: ${linkedCharts}${c.reset}`);
  console.log(`    └─ ${c.red}Sin enlazar: ${unlinkedCharts}${c.reset}`);
  
  if (hasStyleSupport) {
    console.log(`\n  ${c.cyan}✓ Estilos y colores aplicados${c.reset}`);
    console.log(`  ${c.cyan}✓ Dropdown en columna Acción${c.reset}`);
    console.log(`  ${c.cyan}✓ Filtros habilitados en headers${c.reset}`);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORTAR SOFTWARE.JSON A SU PROPIO ARCHIVO XLSX
  // ─────────────────────────────────────────────────────────────────────────────
  exportSoftwareToExcel(XLSX, hasStyleSupport, styles);
  
  console.log(`\n${c.yellow}📝 Abre los archivos en Excel para editarlos${c.reset}\n`);
}

/**
 * Exporta software.json a su propio archivo Excel
 */
function exportSoftwareToExcel(XLSX, hasStyleSupport, styles) {
  console.log(`\n${c.cyan}📤 Exportando software.json a Excel...${c.reset}`);
  
  let softwareData;
  try {
    softwareData = readDataJson('software');
  } catch (e) {
    console.log(`${c.yellow}⚠ No se encontró software.json, creando estructura vacía${c.reset}`);
    softwareData = {
      lastUpdated: new Date().toISOString(),
      stats: { totalCategories: 3, totalItems: 0 },
      categories: [
        { id: 'daws', name: 'DAWs', description: 'Digital Audio Workstations', icon: 'Music2', items: [] },
        { id: 'plugins', name: 'Plugins', description: 'VSTs y efectos', icon: 'Sliders', items: [] },
        { id: 'utilidades', name: 'Utilidades', description: 'Herramientas auxiliares', icon: 'Wrench', items: [] }
      ]
    };
    saveDataJson(softwareData, 'software');
  }
  
  // Headers para software
  const softwareHeaders = [
    'Accion',       // Agregar, Eliminar
    'Categoria',    // daws, plugins, utilidades
    'Nombre',       // Nombre del software
    'Descripcion',  // Descripción
    'Tipo',         // Tipo específico (ej: "DAW", "Reverb", "Compresor")
    'URL',          // URL de descarga
    'Version',      // Versión del software
    'Plataforma',   // Windows, Mac, Linux, All
    'Comentarios'   // Notas adicionales
  ];
  
  // Datos del software
  const softwareRows = [];
  if (softwareData.categories) {
    softwareData.categories.forEach(category => {
      if (category.items && category.items.length > 0) {
        category.items.forEach(item => {
          softwareRows.push([
            '',                             // Accion
            category.id,                    // Categoria
            item.name || '',                // Nombre
            item.description || '',         // Descripcion
            item.type || '',                // Tipo
            item.url || '',                 // URL
            item.version || '',             // Version
            item.platform || '',            // Plataforma
            item.comments || ''             // Comentarios
          ]);
        });
      }
    });
  }
  
  // Si no hay datos, agregar filas de ejemplo
  if (softwareRows.length === 0) {
    softwareRows.push(
      ['', 'daws', 'Ejemplo DAW', 'Descripción del DAW', 'DAW', 'https://ejemplo.com', '1.0', 'Windows', ''],
      ['', 'plugins', 'Ejemplo Plugin', 'Descripción del plugin', 'Reverb', 'https://ejemplo.com', '2.0', 'All', ''],
      ['', 'utilidades', 'Ejemplo Utilidad', 'Descripción de la utilidad', 'Audio Tool', 'https://ejemplo.com', '1.5', 'All', '']
    );
  }
  
  // Instrucciones para software
  const softwareInstructions = [
    ['🛠️ WORSHIP BOX - GESTOR DE SOFTWARE'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['📋 COLUMNA "ACCIÓN":'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   (vacío)     →  No hacer cambios'],
    ['   Agregar     →  Agregar nuevo software'],
    ['   Eliminar    →  Eliminar este software'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['📂 CATEGORÍAS DISPONIBLES:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   daws        →  Digital Audio Workstations (Ableton, FL Studio, etc.)'],
    ['   plugins     →  VSTs, efectos, instrumentos virtuales'],
    ['   utilidades  →  Herramientas auxiliares de audio'],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['📝 CAMPOS:'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['   Nombre      →  Nombre del software (OBLIGATORIO)'],
    ['   Descripcion →  Descripción breve del software'],
    ['   Tipo        →  Tipo específico (DAW, Reverb, Compresor, etc.)'],
    ['   URL         →  Enlace de descarga (Google Drive, MEGA, TeraBox, etc.)'],
    ['   Version     →  Versión del software'],
    ['   Plataforma  →  Windows, Mac, Linux, All'],
    ['   Comentarios →  Notas adicionales'],
  ];
  
  // Crear hojas
  const softwareSheet = XLSX.utils.aoa_to_sheet([softwareHeaders, ...softwareRows]);
  const instructionsSheet = XLSX.utils.aoa_to_sheet(softwareInstructions);
  
  // Aplicar estilos si están disponibles
  if (hasStyleSupport) {
    // Headers
    for (let col = 0; col < softwareHeaders.length; col++) {
      const cellRef = getCellRef(col, 0);
      if (softwareSheet[cellRef]) {
        softwareSheet[cellRef].s = col === 0 ? styles.actionHeader : styles.headerMain;
      }
    }
    
    // Filas de datos
    for (let row = 0; row < softwareRows.length; row++) {
      const excelRow = row + 1;
      for (let col = 0; col < softwareHeaders.length; col++) {
        const cellRef = getCellRef(col, excelRow);
        if (!softwareSheet[cellRef]) {
          softwareSheet[cellRef] = { v: '', t: 's' };
        }
        softwareSheet[cellRef].s = col === 0 ? styles.actionCell : (row % 2 === 0 ? styles.rowEven : styles.rowOdd);
      }
    }
  }
  
  // Configurar anchos
  softwareSheet['!cols'] = [
    { wch: 12 },  // Accion
    { wch: 15 },  // Categoria
    { wch: 30 },  // Nombre
    { wch: 50 },  // Descripcion
    { wch: 15 },  // Tipo
    { wch: 50 },  // URL
    { wch: 12 },  // Version
    { wch: 15 },  // Plataforma
    { wch: 30 }   // Comentarios
  ];
  
  instructionsSheet['!cols'] = [{ wch: 65 }];
  
  // Crear libro
  const softwareWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(softwareWorkbook, softwareSheet, 'Software');
  XLSX.utils.book_append_sheet(softwareWorkbook, instructionsSheet, 'Instrucciones');
  
  // Guardar
  XLSX.writeFile(softwareWorkbook, CONFIG.EXCEL_SOFTWARE);
  
  console.log(`${c.green}✓ Excel de software exportado!${c.reset}`);
  console.log(`  • Archivo: ${CONFIG.EXCEL_SOFTWARE}`);
  console.log(`  • Items: ${softwareRows.length}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//   📥 IMPORTAR DESDE EXCEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Importa cambios desde el Excel al JSON correspondiente
 */
function importFromExcel() {
  if (!checkXlsxInstalled()) {
    console.log(`\n${c.red}❌ Error: No hay paquete xlsx instalado.${c.reset}`);
    console.log(`${c.yellow}   Ejecuta: npm install xlsx-js-style${c.reset}\n`);
    return;
  }
  
  // Verificar que existe al menos uno de los archivos Excel
  const hasSecuencias = fs.existsSync(CONFIG.EXCEL_SECUENCIAS);
  const hasSoftware = fs.existsSync(CONFIG.EXCEL_SOFTWARE);
  
  if (!hasSecuencias && !hasSoftware) {
    console.log(`\n${c.red}❌ Error: No se encontraron archivos Excel.${c.reset}`);
    console.log(`${c.yellow}   Primero ejecuta --export para generar los archivos.${c.reset}\n`);
    return;
  }
  
  let XLSX;
  try {
    XLSX = require('xlsx-js-style');
  } catch (e) {
    XLSX = require('xlsx');
  }
  
  console.log(`\n${c.cyan}📥 Importando cambios desde Excel...${c.reset}\n`);
  
  // Crear backups antes de modificar
  if (hasSecuencias) {
    createBackup('secuencias');
  }
  if (hasSoftware) {
    createBackup('software');
  }
  
  // Importar secuencias
  if (hasSecuencias) {
    console.log(`${c.dim}  Procesando: ${path.basename(CONFIG.EXCEL_SECUENCIAS)}${c.reset}`);
    importSecuenciasFromExcel(XLSX, CONFIG.EXCEL_SECUENCIAS);
  }
  
  // Importar software
  if (hasSoftware) {
    console.log(`${c.dim}  Procesando: ${path.basename(CONFIG.EXCEL_SOFTWARE)}${c.reset}`);
    importSoftwareFromExcel(XLSX, CONFIG.EXCEL_SOFTWARE);
  }
}

/**
 * Importa secuencias desde Excel
 */
function importSecuenciasFromExcel(XLSX, filePath) {
  const workbook = XLSX.readFile(filePath);
  const data = readDataJson();
  
  // Contadores para el reporte
  const report = {
    added: [],
    deleted: [],
    markedPrincipal: [],
    duplicatesRemoved: [],
    errors: [],
    ignored: 0
  };
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PROCESAR HOJA DE SECUENCIAS
  // ─────────────────────────────────────────────────────────────────────────────
  if (workbook.SheetNames.includes('Secuencias')) {
    const songsSheet = workbook.Sheets['Secuencias'];
    const songsData = XLSX.utils.sheet_to_json(songsSheet);
    
    songsData.forEach((row, index) => {
      const action = (row['Accion'] || '').toString().toLowerCase().trim();
      
      if (!action) {
        report.ignored++;
        return;
      }
      
      try {
        if (action === 'agregar') {
          addSong(data, row, report);
        } else if (action === 'eliminar') {
          deleteSong(data, row, report);
        } else if (action === 'principal') {
          markAsPrincipal(data, row, report);
        } else {
          report.errors.push(`Fila ${index + 2}: Acción desconocida "${action}"`);
        }
      } catch (error) {
        report.errors.push(`Fila ${index + 2}: ${error.message}`);
      }
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PROCESAR HOJA DE CHARTS
  // ─────────────────────────────────────────────────────────────────────────────
  if (workbook.SheetNames.includes('Charts')) {
    const chartsSheet = workbook.Sheets['Charts'];
    const chartsData = XLSX.utils.sheet_to_json(chartsSheet);
    
    chartsData.forEach((row, index) => {
      const action = (row['Accion'] || '').toString().toLowerCase().trim();
      
      if (!action) {
        report.ignored++;
        return;
      }
      
      try {
        if (action === 'agregar') {
          addChart(data, row, report);
        } else if (action === 'eliminar') {
          deleteChart(data, row, report);
        } else if (action === 'principal') {
          markChartAsPrincipal(data, row, report);
        } else {
          report.errors.push(`Charts fila ${index + 2}: Acción desconocida "${action}"`);
        }
      } catch (error) {
        report.errors.push(`Charts fila ${index + 2}: ${error.message}`);
      }
    });
  }
  
  // Actualizar estadísticas
  updateStats(data);
  
  // Guardar
  saveDataJson(data);
  
  // Mostrar reporte
  showImportReport(report, 'Secuencias');
}

/**
 * Importa software desde Excel
 */
function importSoftwareFromExcel(XLSX, filePath) {
  const workbook = XLSX.readFile(filePath);
  let data;
  
  try {
    data = readDataJson('software');
  } catch (e) {
    data = {
      lastUpdated: new Date().toISOString(),
      stats: { totalCategories: 3, totalItems: 0 },
      categories: [
        { id: 'daws', name: 'DAWs', description: 'Digital Audio Workstations', icon: 'Music2', items: [] },
        { id: 'plugins', name: 'Plugins', description: 'VSTs y efectos', icon: 'Sliders', items: [] },
        { id: 'utilidades', name: 'Utilidades', description: 'Herramientas auxiliares', icon: 'Wrench', items: [] }
      ]
    };
  }
  
  const report = {
    added: [],
    deleted: [],
    errors: [],
    ignored: 0
  };
  
  if (workbook.SheetNames.includes('Software')) {
    const softwareSheet = workbook.Sheets['Software'];
    const softwareRows = XLSX.utils.sheet_to_json(softwareSheet);
    
    softwareRows.forEach((row, index) => {
      const action = (row['Accion'] || '').toString().toLowerCase().trim();
      
      if (!action) {
        report.ignored++;
        return;
      }
      
      try {
        const categoryId = (row['Categoria'] || '').toString().toLowerCase().trim();
        const name = (row['Nombre'] || '').trim();
        
        if (!categoryId || !name) {
          throw new Error('Faltan campos obligatorios (Categoria, Nombre)');
        }
        
        // Buscar categoría
        let category = data.categories.find(c => c.id === categoryId);
        if (!category) {
          throw new Error(`Categoría "${categoryId}" no válida. Usa: daws, plugins, utilidades`);
        }
        
        if (action === 'agregar') {
          // Verificar si ya existe
          const exists = category.items.find(i => normalizeText(i.name) === normalizeText(name));
          if (exists) {
            throw new Error(`El software "${name}" ya existe en ${categoryId}`);
          }
          
          const newItem = {
            id: generateId(),
            name: name,
            description: row['Descripcion'] || '',
            type: row['Tipo'] || '',
            url: row['URL'] || '',
            version: row['Version'] || '',
            platform: row['Plataforma'] || 'All',
            comments: row['Comentarios'] || ''
          };
          
          category.items.push(newItem);
          report.added.push(`${categoryId}: ${name}`);
          
        } else if (action === 'eliminar') {
          const itemIndex = category.items.findIndex(i => normalizeText(i.name) === normalizeText(name));
          if (itemIndex === -1) {
            throw new Error(`Software "${name}" no encontrado en ${categoryId}`);
          }
          category.items.splice(itemIndex, 1);
          report.deleted.push(`${categoryId}: ${name}`);
          
        } else {
          report.errors.push(`Fila ${index + 2}: Acción desconocida "${action}"`);
        }
      } catch (error) {
        report.errors.push(`Fila ${index + 2}: ${error.message}`);
      }
    });
  }
  
  // Actualizar estadísticas de software
  data.stats.totalItems = data.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  data.lastUpdated = new Date().toISOString();
  
  // Guardar
  saveDataJson(data, 'software');
  
  // Mostrar reporte
  showImportReport(report, 'Software');
}

/**
 * Agrega una canción al secuencias.json
 */
function addSong(data, row, report) {
  const artistName = (row['Artista'] || '').trim();
  const albumName = (row['Album'] || '').trim();
  const songName = (row['Cancion'] || '').trim();
  const driveId = (row['DriveID'] || '').trim();
  const downloadUrl = (row['LinkDescarga'] || row['DownloadUrl'] || '').trim();
  
  if (!artistName || !albumName || !songName) {
    throw new Error('Faltan campos obligatorios (Artista, Album, Cancion)');
  }
  if (!driveId && !downloadUrl) {
    throw new Error('Falta LinkDescarga o DriveID para la canción');
  }
  
  // Resolver DriveID si viene desde una URL de Google Drive
  const resolvedDriveId = driveId || (downloadUrl ? extractDriveId(downloadUrl) : null);
  
  // Buscar o crear artista
  let artist = data.artists.find(a => normalizeText(a.name) === normalizeText(artistName));
  if (!artist) {
    artist = {
      id: row['ArtistaID'] || generateId(),
      name: artistName,
      albums: []
    };
    data.artists.push(artist);
  }
  
  // Buscar o crear álbum
  let album = artist.albums.find(a => normalizeText(a.name) === normalizeText(albumName));
  if (!album) {
    album = {
      id: row['AlbumID'] || generateId(),
      name: albumName,
      image: null,
      songs: []
    };
    artist.albums.push(album);
  }
  
  // Verificar si ya existe la canción (por DriveID o por nombre similar)
  const existingSong = album.songs.find(s => 
    (resolvedDriveId && s.driveId === resolvedDriveId) || normalizeText(s.name) === normalizeText(songName)
  );
  
  if (existingSong) {
    throw new Error(`La canción "${songName}" ya existe en este álbum`);
  }
  
  // Crear la canción
  const songId = row['CancionID'] || resolvedDriveId || generateId();
  const finalDownloadUrl = downloadUrl || (resolvedDriveId
    ? `https://drive.google.com/uc?export=download&id=${resolvedDriveId}`
    : null);

  const newSong = {
    id: songId,
    name: songName,
    fullName: row['NombreArchivo'] || `${songName}.zip`,
    type: row['Tipo'] || 'sequence',
    driveId: resolvedDriveId || null,
    downloadUrl: finalDownloadUrl,
    compas: row['Compas'] || null,
    bpm: row['BPM'] ? parseInt(row['BPM']) : null,
    tonalidad: row['Tonalidad'] || null,
    duracion: row['Duracion'] || null,
    tipoSecuencia: row['TipoSecuencia'] || null,
    comentarios: row['Comentarios'] || null,
    chartUrl: row['ChartUrl'] || null,
    chartName: row['ChartName'] || null
  };
  
  album.songs.push(newSong);
  report.added.push(`${artistName} - ${albumName} - ${songName}`);
}

/**
 * Elimina una canción del secuencias.json
 */
function deleteSong(data, row, report) {
  const driveId = (row['DriveID'] || '').trim();
  const songName = (row['Cancion'] || '').trim();
  const artistName = (row['Artista'] || '').trim();
  
  let deleted = false;
  
  for (const artist of data.artists) {
    if (artistName && normalizeText(artist.name) !== normalizeText(artistName)) continue;
    
    for (const album of artist.albums) {
      const index = album.songs.findIndex(s => 
        s.driveId === driveId || (songName && normalizeText(s.name) === normalizeText(songName))
      );
      
      if (index !== -1) {
        const deletedSong = album.songs.splice(index, 1)[0];
        report.deleted.push(`${artist.name} - ${album.name} - ${deletedSong.name}`);
        deleted = true;
        break;
      }
    }
    if (deleted) break;
  }
  
  if (!deleted) {
    throw new Error(`No se encontró la canción para eliminar`);
  }
}

/**
 * Marca una canción como principal y elimina variantes (otras tonalidades)
 */
function markAsPrincipal(data, row, report) {
  const driveId = (row['DriveID'] || '').trim();
  const artistName = (row['Artista'] || '').trim();
  const albumName = (row['Album'] || '').trim();
  const songName = (row['Cancion'] || '').trim();
  
  // Normalizar el nombre base de la canción (sin tonalidad ni BPM)
  const baseName = normalizeText(songName)
    .replace(/[-_]\s*[a-g](#|b)?\s*[-_]?/gi, '')  // Quitar tonalidades
    .replace(/\d+\s*(bpm|bpp)/gi, '')              // Quitar BPM
    .replace(/\s+/g, ' ')
    .trim();
  
  let artist = data.artists.find(a => normalizeText(a.name) === normalizeText(artistName));
  if (!artist) {
    throw new Error(`Artista "${artistName}" no encontrado`);
  }
  
  let album = artist.albums.find(a => normalizeText(a.name) === normalizeText(albumName));
  if (!album) {
    throw new Error(`Álbum "${albumName}" no encontrado`);
  }
  
  // Encontrar todas las variantes de la canción
  const variants = album.songs.filter(s => {
    const sBaseName = normalizeText(s.name)
      .replace(/[-_]\s*[a-g](#|b)?\s*[-_]?/gi, '')
      .replace(/\d+\s*(bpm|bpp)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return sBaseName === baseName || s.driveId === driveId;
  });
  
  if (variants.length <= 1) {
    report.markedPrincipal.push(`${artistName} - ${albumName} - ${songName} (sin variantes)`);
    return;
  }
  
  // Encontrar la principal (la que tiene el driveId especificado)
  const principal = variants.find(v => v.driveId === driveId) || variants[0];
  
  // Eliminar las demás variantes
  variants.forEach(v => {
    if (v.driveId !== principal.driveId) {
      const index = album.songs.indexOf(v);
      if (index !== -1) {
        album.songs.splice(index, 1);
        report.duplicatesRemoved.push(`${artistName} - ${albumName} - ${v.name}`);
      }
    }
  });
  
  report.markedPrincipal.push(`${artistName} - ${albumName} - ${principal.name}`);
}

/**
 * Agrega un chart al secuencias.json
 */
function addChart(data, row, report) {
  const artistName = (row['Artista'] || '').trim();
  const chartName = (row['Chart'] || '').trim();
  const driveId = (row['DriveID'] || '').trim();
  
  if (!artistName || !chartName || !driveId) {
    throw new Error('Faltan campos obligatorios (Artista, Chart, DriveID)');
  }
  
  // Buscar o crear artista en charts
  let artist = data.charts.find(a => normalizeText(a.name) === normalizeText(artistName));
  if (!artist) {
    artist = {
      id: row['ArtistaID'] || generateId(),
      name: artistName,
      charts: []
    };
    data.charts.push(artist);
  }
  
  // Verificar si ya existe
  const existingChart = artist.charts.find(c => 
    c.driveId === driveId || normalizeText(c.name) === normalizeText(chartName)
  );
  
  if (existingChart) {
    throw new Error(`El chart "${chartName}" ya existe para este artista`);
  }
  
  // Crear el chart
  const newChart = {
    id: row['ChartID'] || driveId,
    name: chartName,
    fullName: row['NombreArchivo'] || `${chartName}.pdf`,
    driveId: driveId,
    downloadUrl: row['LinkDescarga'] || `https://drive.google.com/uc?export=download&id=${driveId}`,
    tonalidad: row['Tonalidad'] || null,
    compas: row['Compas'] || null,
    comentarios: row['Comentarios'] || null
  };
  
  artist.charts.push(newChart);
  report.added.push(`[Chart] ${artistName} - ${chartName}`);
}

/**
 * Elimina un chart del secuencias.json
 */
function deleteChart(data, row, report) {
  const driveId = (row['DriveID'] || '').trim();
  const chartName = (row['Chart'] || '').trim();
  const artistName = (row['Artista'] || '').trim();
  
  let deleted = false;
  
  for (const artist of data.charts) {
    if (artistName && normalizeText(artist.name) !== normalizeText(artistName)) continue;
    
    const index = artist.charts.findIndex(c => 
      c.driveId === driveId || (chartName && normalizeText(c.name) === normalizeText(chartName))
    );
    
    if (index !== -1) {
      const deletedChart = artist.charts.splice(index, 1)[0];
      report.deleted.push(`[Chart] ${artist.name} - ${deletedChart.name}`);
      deleted = true;
      break;
    }
  }
  
  if (!deleted) {
    throw new Error(`No se encontró el chart para eliminar`);
  }
}

/**
 * Marca un chart como principal
 */
function markChartAsPrincipal(data, row, report) {
  // Similar a canciones, pero para charts
  report.markedPrincipal.push(`[Chart] ${row['Artista']} - ${row['Chart']}`);
}

/**
 * Genera un ID único
 */
function generateId() {
  return 'new_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Actualiza las estadísticas del secuencias.json
 */
function updateStats(data) {
  let totalArtists = 0;
  let totalAlbums = 0;
  let totalSongs = 0;
  let totalCharts = 0;
  
  if (data.artists) {
    totalArtists = data.artists.length;
    data.artists.forEach(artist => {
      if (artist.albums) {
        totalAlbums += artist.albums.length;
        artist.albums.forEach(album => {
          if (album.songs) {
            totalSongs += album.songs.length;
          }
        });
      }
    });
  }
  
  if (data.charts) {
    data.charts.forEach(artist => {
      if (artist.charts) {
        totalCharts += artist.charts.length;
      }
    });
  }
  
  data.stats = {
    totalArtists,
    totalAlbums,
    totalSongs,
    totalCharts
  };
  
  data.lastUpdated = new Date().toISOString();
}

/**
 * Muestra el reporte de importación
 * @param {Object} report - Objeto con los contadores del reporte
 * @param {string} type - Tipo de importación ('Secuencias' o 'Software')
 */
function showImportReport(report, type = 'Datos') {
  console.log(`\n${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.cyan}${c.bold}              📊 REPORTE DE IMPORTACIÓN - ${type.toUpperCase()}              ${c.reset}`);
  console.log(`${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}\n`);
  
  if (report.added.length > 0) {
    console.log(`${c.green}✓ AGREGADOS (${report.added.length}):${c.reset}`);
    report.added.forEach(item => console.log(`  + ${item}`));
    console.log('');
  }
  
  if (report.deleted.length > 0) {
    console.log(`${c.red}✗ ELIMINADOS (${report.deleted.length}):${c.reset}`);
    report.deleted.forEach(item => console.log(`  - ${item}`));
    console.log('');
  }
  
  if (report.markedPrincipal.length > 0) {
    console.log(`${c.blue}★ MARCADOS COMO PRINCIPAL (${report.markedPrincipal.length}):${c.reset}`);
    report.markedPrincipal.forEach(item => console.log(`  ★ ${item}`));
    console.log('');
  }
  
  if (report.duplicatesRemoved.length > 0) {
    console.log(`${c.yellow}⚠ DUPLICADOS ELIMINADOS (${report.duplicatesRemoved.length}):${c.reset}`);
    report.duplicatesRemoved.forEach(item => console.log(`  ~ ${item}`));
    console.log('');
  }
  
  if (report.errors.length > 0) {
    console.log(`${c.red}❌ ERRORES (${report.errors.length}):${c.reset}`);
    report.errors.forEach(item => console.log(`  ! ${item}`));
    console.log('');
  }
  
  console.log(`${c.dim}Filas ignoradas (sin acción): ${report.ignored}${c.reset}`);
  console.log(`\n${c.green}✓ Importación completada!${c.reset}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🔍 BUSCAR DUPLICADOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Busca y muestra posibles duplicados
 */
function findDuplicates() {
  console.log(`\n${c.cyan}🔍 Buscando posibles duplicados...${c.reset}\n`);
  
  const data = readDataJson();
  const duplicates = [];
  const songMap = new Map();
  
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs) {
            album.songs.forEach(song => {
              // Normalizar nombre base
              const baseName = normalizeText(song.name)
                .replace(/[-_]\s*[a-g](#|b)?\s*[-_]?/gi, '')
                .replace(/\d+\s*(bpm|bpp)/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
              
              const key = `${normalizeText(artist.name)}|${baseName}`;
              
              if (!songMap.has(key)) {
                songMap.set(key, []);
              }
              
              songMap.get(key).push({
                artist: artist.name,
                album: album.name,
                song: song.name,
                driveId: song.driveId
              });
            });
          }
        });
      }
    });
  }
  
  // Filtrar solo los que tienen múltiples versiones
  songMap.forEach((songs, key) => {
    if (songs.length > 1) {
      duplicates.push({ key, songs });
    }
  });
  
  // Mostrar resultados
  if (duplicates.length === 0) {
    console.log(`${c.green}✓ No se encontraron duplicados!${c.reset}\n`);
  } else {
    console.log(`${c.yellow}⚠ Se encontraron ${duplicates.length} grupos de posibles duplicados:${c.reset}\n`);
    
    duplicates.slice(0, 20).forEach((dup, index) => {
      console.log(`${c.bold}${index + 1}. ${dup.songs[0].artist}${c.reset}`);
      dup.songs.forEach(s => {
        console.log(`   • ${s.album} → ${s.song}`);
      });
      console.log('');
    });
    
    if (duplicates.length > 20) {
      console.log(`${c.dim}... y ${duplicates.length - 20} grupos más.${c.reset}\n`);
    }
    
    console.log(`${c.cyan}Tip: Exporta a Excel, marca con "Principal" la versión que quieras conservar, y ejecuta --import${c.reset}\n`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🔗 ENLAZAR CHARTS CON CANCIONES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Construye un índice de todas las canciones para búsqueda rápida
 */
function buildSongIndex(data) {
  const index = {
    byId: new Map(),           // songId → song info
    byDriveId: new Map(),      // driveId → song info
    byNormalizedName: new Map() // "artista|nombre" → [song info, ...]
  };
  
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs) {
            album.songs.forEach(song => {
              const songInfo = {
                id: song.id,
                driveId: song.driveId,
                name: song.name,
                artistName: artist.name,
                albumName: album.name,
                fullName: song.fullName,
                tonalidad: song.tonalidad
              };
              
              // Por ID
              index.byId.set(song.id, songInfo);
              
              // Por DriveID
              if (song.driveId) {
                index.byDriveId.set(song.driveId, songInfo);
              }
              
              // Por nombre normalizado (artista|canción)
              const normalizedKey = `${normalizeText(artist.name)}|${normalizeText(song.name)}`;
              if (!index.byNormalizedName.has(normalizedKey)) {
                index.byNormalizedName.set(normalizedKey, []);
              }
              index.byNormalizedName.get(normalizedKey).push(songInfo);
              
              // También indexar por nombre base (sin tonalidad/bpm)
              const baseName = normalizeText(song.name)
                .replace(/[-_\s]*[a-g](#|b)?[-_\s]*(mayor|menor|m)?$/gi, '')
                .replace(/\d+\s*(bpm|bpp)/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
              
              if (baseName !== normalizeText(song.name)) {
                const baseKey = `${normalizeText(artist.name)}|${baseName}`;
                if (!index.byNormalizedName.has(baseKey)) {
                  index.byNormalizedName.set(baseKey, []);
                }
                index.byNormalizedName.get(baseKey).push(songInfo);
              }
            });
          }
        });
      }
    });
  }
  
  return index;
}

/**
 * Limpia agresivamente el nombre de un chart para extraer el nombre de la canción
 */
function cleanChartName(chartName, artistName) {
  let name = chartName;
  
  // Reemplazar underscores por espacios
  name = name.replace(/_/g, ' ');
  
  // Quitar números al inicio (1.-, 2.-, 01-, etc.)
  name = name.replace(/^\d+[\.\-\s]+/, '');
  
  // Quitar tonalidad al final (.C, .Bb, -E, _C#m, (D), etc.)
  name = name.replace(/[\.\-_\s]*\(?[A-Ga-g](#|b)?(m|M|maj|min|mayor|menor)?\)?[\.\s]*$/g, '');
  
  // Quitar extensiones de archivo
  name = name.replace(/\.(pdf|zip|mp3|wav|mid|midi)$/gi, '');
  
  // Quitar "feat" y todo lo que sigue hasta un separador
  name = name.replace(/[\s\-_]*\(?feat\.?[^)\-]*/gi, '');
  name = name.replace(/\)/g, ''); // Quitar paréntesis sueltos
  
  // Quitar el nombre del artista si aparece en el nombre
  const artistNorm = normalizeText(artistName);
  const artistWords = artistNorm.split(' ');
  
  // Quitar variaciones del nombre del artista
  name = name.replace(new RegExp(artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
  name = name.replace(new RegExp(artistNorm.replace(/\s+/g, '[\\s_-]*'), 'gi'), ' ');
  
  // Quitar patrones comunes de álbum (Vol. 1, Vol 2, etc.)
  name = name.replace(/[\s\-_]*vol\.?\s*\d+/gi, '');
  
  // Quitar años entre paréntesis
  name = name.replace(/\(\d{4}\)/g, '');
  
  // Quitar guiones repetidos con texto entre ellos que parece metadata
  // Ej: "Song - Artist - Album.Key" → "Song"
  const parts = name.split(/\s*[\-]\s*/);
  if (parts.length > 1) {
    // Tomar la primera parte significativa (más de 3 caracteres)
    const significantPart = parts.find(p => p.trim().length > 3);
    if (significantPart) {
      name = significantPart;
    }
  }
  
  // Normalizar espacios
  name = name.replace(/\s+/g, ' ').trim();
  
  return name;
}

/**
 * Genera múltiples variaciones de un nombre para búsqueda
 */
function generateNameVariations(name) {
  const variations = new Set();
  const normalized = normalizeText(name);
  
  variations.add(normalized);
  
  // Sin artículos
  variations.add(normalized.replace(/^(el|la|los|las|the|a|an)\s+/gi, ''));
  
  // Sin palabras comunes al final
  variations.add(normalized.replace(/\s+(live|en vivo|acustico|acoustic|remix|version|medley)$/gi, ''));
  
  // Primeras 3+ palabras
  const words = normalized.split(' ');
  if (words.length > 2) {
    variations.add(words.slice(0, 3).join(' '));
    variations.add(words.slice(0, 2).join(' '));
  }
  
  // Sin paréntesis y su contenido
  variations.add(normalized.replace(/\([^)]*\)/g, '').trim());
  
  // Sin corchetes y su contenido
  variations.add(normalized.replace(/\[[^\]]*\]/g, '').trim());
  
  return Array.from(variations).filter(v => v.length > 2);
}

/**
 * Calcula similitud entre dos strings (0-1)
 */
function stringSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Verificar si uno contiene al otro
  if (s1.includes(s2)) return s2.length / s1.length;
  if (s2.includes(s1)) return s1.length / s2.length;
  
  // Contar palabras en común
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  let common = 0;
  words1.forEach(w => { if (words2.has(w)) common++; });
  
  const totalWords = Math.max(words1.size, words2.size);
  return common / totalWords;
}

/**
 * Intenta encontrar la canción que corresponde a un chart
 */
function findMatchingSong(chart, artistName, songIndex) {
  const artistNormalized = normalizeText(artistName);
  
  // 1. Buscar por nombre exacto normalizado
  const exactKey = `${artistNormalized}|${normalizeText(chart.name)}`;
  const exactMatches = songIndex.byNormalizedName.get(exactKey);
  if (exactMatches && exactMatches.length > 0) {
    if (chart.tonalidad && exactMatches.length > 1) {
      const withTonalidad = exactMatches.find(s => 
        normalizeText(s.tonalidad || '') === normalizeText(chart.tonalidad)
      );
      if (withTonalidad) return withTonalidad;
    }
    return exactMatches[0];
  }
  
  // 2. Limpiar el nombre del chart agresivamente
  const cleanedName = cleanChartName(chart.name, artistName);
  const cleanedNormalized = normalizeText(cleanedName);
  
  if (cleanedNormalized.length > 2) {
    const cleanKey = `${artistNormalized}|${cleanedNormalized}`;
    const cleanMatches = songIndex.byNormalizedName.get(cleanKey);
    if (cleanMatches && cleanMatches.length > 0) {
      return cleanMatches[0];
    }
  }
  
  // 3. Generar variaciones del nombre limpio y buscar cada una
  const variations = generateNameVariations(cleanedName);
  for (const variation of variations) {
    const varKey = `${artistNormalized}|${variation}`;
    const varMatches = songIndex.byNormalizedName.get(varKey);
    if (varMatches && varMatches.length > 0) {
      return varMatches[0];
    }
  }
  
  // 4. Buscar coincidencias parciales en canciones del mismo artista
  const candidateSongs = [];
  for (const [key, songs] of songIndex.byNormalizedName) {
    if (key.startsWith(artistNormalized + '|')) {
      const songNamePart = key.split('|')[1];
      
      // Calcular similitud
      const similarity = stringSimilarity(cleanedNormalized, songNamePart);
      if (similarity > 0.6) {
        candidateSongs.push({ song: songs[0], similarity });
      }
      
      // Si el nombre limpio contiene el nombre de la canción
      if (cleanedNormalized.includes(songNamePart) && songNamePart.length > 3) {
        candidateSongs.push({ song: songs[0], similarity: 0.8 });
      }
      
      // Si el nombre de la canción contiene el nombre limpio
      if (songNamePart.includes(cleanedNormalized) && cleanedNormalized.length > 3) {
        candidateSongs.push({ song: songs[0], similarity: 0.8 });
      }
    }
  }
  
  // Retornar el mejor candidato
  if (candidateSongs.length > 0) {
    candidateSongs.sort((a, b) => b.similarity - a.similarity);
    if (candidateSongs[0].similarity >= 0.6) {
      return candidateSongs[0].song;
    }
  }
  
  // 5. Búsqueda más agresiva: buscar por palabras clave principales
  const mainWords = cleanedNormalized.split(' ')
    .filter(w => w.length > 3)
    .slice(0, 3);
  
  if (mainWords.length >= 2) {
    for (const [key, songs] of songIndex.byNormalizedName) {
      if (key.startsWith(artistNormalized + '|')) {
        const songNamePart = key.split('|')[1];
        const matchedWords = mainWords.filter(w => songNamePart.includes(w));
        if (matchedWords.length >= 2) {
          return songs[0];
        }
      }
    }
  }
  
  return null;
}

/**
 * Enlaza automáticamente los charts con sus canciones correspondientes
 */
function linkChartsToSongs() {
  console.log(`\n${c.cyan}🔗 Enlazando charts con canciones...${c.reset}\n`);
  
  const data = readDataJson();
  
  // Construir índice de canciones
  console.log(`${c.dim}  Construyendo índice de canciones...${c.reset}`);
  const songIndex = buildSongIndex(data);
  console.log(`${c.dim}  Canciones indexadas: ${songIndex.byId.size}${c.reset}\n`);
  
  let linked = 0;
  let alreadyLinked = 0;
  let notFound = 0;
  const unlinkedCharts = [];
  
  if (data.charts) {
    data.charts.forEach(artist => {
      if (artist.charts) {
        artist.charts.forEach(chart => {
          // Si ya tiene songId válido, saltar
          if (chart.songId && songIndex.byId.has(chart.songId)) {
            alreadyLinked++;
            return;
          }
          
          // Intentar encontrar la canción
          const matchedSong = findMatchingSong(chart, artist.name, songIndex);
          
          if (matchedSong) {
            chart.songId = matchedSong.id;
            chart.songName = `${matchedSong.artistName} - ${matchedSong.name}`;
            linked++;
          } else {
            notFound++;
            unlinkedCharts.push({
              artist: artist.name,
              chart: chart.name
            });
          }
        });
      }
    });
  }
  
  // Guardar cambios
  if (linked > 0) {
    createBackup();
    data.lastUpdated = new Date().toISOString();
    saveDataJson(data);
  }
  
  // Mostrar resultados
  console.log(`${c.green}✓ Resultado del enlace:${c.reset}`);
  console.log(`  • Nuevos enlaces creados: ${c.green}${linked}${c.reset}`);
  console.log(`  • Ya estaban enlazados: ${c.blue}${alreadyLinked}${c.reset}`);
  console.log(`  • No se encontró canción: ${c.yellow}${notFound}${c.reset}`);
  
  if (unlinkedCharts.length > 0 && unlinkedCharts.length <= 30) {
    console.log(`\n${c.yellow}Charts sin enlazar:${c.reset}`);
    unlinkedCharts.forEach(uc => {
      console.log(`  • ${uc.artist} - ${uc.chart}`);
    });
  } else if (unlinkedCharts.length > 30) {
    console.log(`\n${c.yellow}Primeros 30 charts sin enlazar:${c.reset}`);
    unlinkedCharts.slice(0, 30).forEach(uc => {
      console.log(`  • ${uc.artist} - ${uc.chart}`);
    });
    console.log(`${c.dim}  ... y ${unlinkedCharts.length - 30} más${c.reset}`);
  }
  
  console.log(`\n${c.cyan}Tip: Exporta a Excel para revisar y enlazar manualmente los charts pendientes${c.reset}\n`);
  
  return { linked, alreadyLinked, notFound };
}

/**
 * Limpia y simplifica los charts:
 * - Mantiene solo 1 chart por secuencia (preferir .zip o tonalidad original)
 * - Elimina charts sin secuencia enlazada
 * - Agrega chartUrl directamente a las canciones
 */
function cleanupCharts() {
  console.log(`\n${c.cyan}🧹 Limpiando y simplificando charts...${c.reset}\n`);
  
  const data = readDataJson();
  
  // 1. Agrupar charts por songId
  const chartsBySongId = {};
  let totalCharts = 0;
  let chartsWithoutSong = 0;
  
  if (data.charts) {
    data.charts.forEach(artist => {
      if (artist.charts) {
        artist.charts.forEach(chart => {
          totalCharts++;
          if (chart.songId) {
            if (!chartsBySongId[chart.songId]) {
              chartsBySongId[chart.songId] = [];
            }
            chartsBySongId[chart.songId].push(chart);
          } else {
            chartsWithoutSong++;
          }
        });
      }
    });
  }
  
  console.log(`${c.dim}  Total charts actuales: ${totalCharts}${c.reset}`);
  console.log(`${c.dim}  Charts sin secuencia: ${chartsWithoutSong}${c.reset}`);
  console.log(`${c.dim}  Secuencias con chart: ${Object.keys(chartsBySongId).length}${c.reset}\n`);
  
  // 2. Seleccionar el mejor chart por cada secuencia
  const bestCharts = {};
  
  for (const [songId, charts] of Object.entries(chartsBySongId)) {
    if (charts.length === 1) {
      bestCharts[songId] = charts[0];
    } else {
      // Prioridad: .zip > tonalidad original > menor longitud de nombre (más simple)
      const sorted = charts.sort((a, b) => {
        // Primero los .zip
        const aIsZip = a.fullName?.endsWith('.zip') || a.name?.endsWith('.zip');
        const bIsZip = b.fullName?.endsWith('.zip') || b.name?.endsWith('.zip');
        if (aIsZip && !bIsZip) return -1;
        if (!aIsZip && bIsZip) return 1;
        
        // Luego los que no tienen "Capo" o "chords-only"
        const aHasVariant = /capo|chords-only|lyrics|song-map|numbers/i.test(a.name);
        const bHasVariant = /capo|chords-only|lyrics|song-map|numbers/i.test(b.name);
        if (!aHasVariant && bHasVariant) return -1;
        if (aHasVariant && !bHasVariant) return 1;
        
        // Finalmente por longitud de nombre (más corto = más simple)
        return (a.name?.length || 0) - (b.name?.length || 0);
      });
      
      bestCharts[songId] = sorted[0];
    }
  }
  
  console.log(`${c.green}✓ Charts seleccionados: ${Object.keys(bestCharts).length}${c.reset}\n`);
  
  // 3. Agregar chartUrl a las canciones
  let songsUpdated = 0;
  
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs) {
            album.songs.forEach(song => {
              const chart = bestCharts[song.id] || bestCharts[song.driveId];
              if (chart) {
                song.chartUrl = chart.downloadUrl;
                song.chartName = chart.name;
                songsUpdated++;
              } else {
                // Limpiar chartUrl si no tiene chart
                delete song.chartUrl;
                delete song.chartName;
              }
            });
          }
        });
      }
    });
  }
  
  // 4. Reconstruir la estructura de charts simplificada
  const newCharts = [];
  const artistChartMap = {};
  
  for (const chart of Object.values(bestCharts)) {
    // Buscar el artista original
    let artistName = null;
    for (const artist of data.charts) {
      if (artist.charts?.some(c => c.id === chart.id)) {
        artistName = artist.name;
        break;
      }
    }
    
    if (artistName) {
      if (!artistChartMap[artistName]) {
        artistChartMap[artistName] = {
          id: data.charts.find(a => a.name === artistName)?.id || artistName,
          name: artistName,
          charts: []
        };
      }
      artistChartMap[artistName].charts.push(chart);
    }
  }
  
  // Convertir a array
  for (const artist of Object.values(artistChartMap)) {
    newCharts.push(artist);
  }
  
  // 5. Actualizar data
  const chartsRemoved = totalCharts - Object.keys(bestCharts).length;
  data.charts = newCharts;
  data.stats.totalCharts = Object.keys(bestCharts).length;
  data.lastUpdated = new Date().toISOString();
  
  // 6. Guardar
  createBackup();
  saveDataJson(data);
  
  // Resumen
  console.log(`${c.green}✓ Limpieza completada:${c.reset}`);
  console.log(`  • Secuencias actualizadas con chartUrl: ${c.green}${songsUpdated}${c.reset}`);
  console.log(`  • Charts conservados: ${c.green}${Object.keys(bestCharts).length}${c.reset}`);
  console.log(`  • Charts eliminados: ${c.yellow}${chartsRemoved}${c.reset}`);
  console.log(`  • Artistas de charts: ${c.blue}${newCharts.length}${c.reset}`);
  
  console.log(`\n${c.cyan}Tip: Ahora cada secuencia con chart tiene la URL del PDF directamente.${c.reset}`);
  console.log(`${c.cyan}     Puedes eliminar la sección Charts del sidebar de la app.${c.reset}\n`);
  
  return { songsUpdated, chartsKept: Object.keys(bestCharts).length, chartsRemoved };
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🧹 LIMPIAR SECUENCIAS DUPLICADAS Y COVERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Limpia secuencias duplicadas (misma canción en diferentes tonalidades) y covers
 * Criterios:
 * - Elimina covers (canciones con "cover" en el nombre)
 * - Elimina duplicados exactos (mismo nombre exacto)
 * - Para canciones con diferentes tonalidades, mantiene solo 1 (preferir sin sufijo de tonalidad)
 */
function cleanupDuplicates() {
  console.log(`\n${c.cyan}🧹 Limpiando secuencias duplicadas y covers...${c.reset}\n`);
  
  const data = readDataJson();
  
  // Patrones para detectar tonalidad en el nombre
  const tonalityPatterns = [
    /\s*[-_]\s*(Do|Re|Mi|Fa|Sol|La|Si|C|D|E|F|G|A|B)(#|b)?\s*$/i,
    /\s*\((Do|Re|Mi|Fa|Sol|La|Si|C|D|E|F|G|A|B)(#|b)?\)\s*$/i,
    /\s*[-_]\s*(Do|Re|Mi|Fa|Sol|La|Si|C|D|E|F|G|A|B)(#|b)?(m|M|Mayor|Menor|Major|Minor)?\s*$/i,
    /\s*[-_]\s*(Ab|Bb|Db|Eb|Gb|A#|C#|D#|F#|G#)\s*$/i,
    /\s*[-_]\s*(Cm|Dm|Em|Fm|Gm|Am|Bm)\s*$/i
  ];
  
  // Patrones para detectar covers
  const coverPatterns = [
    /\bcover\s*\d*\b/i,
    /\bcov\s*\d*\b/i,
    /_cover_?\d*/i,
    /\bcover$/i
  ];
  
  // Patrones para detectar versiones numeradas
  const versionPatterns = [
    /\s+\d+\s*$/,        // "Cancion 1", "Cancion 2"
    /\s+v\d+\s*$/i,      // "Cancion v1", "Cancion v2"
    /\s+ver\.?\s*\d+$/i  // "Cancion ver 1"
  ];
  
  // Función para normalizar nombre (quitar tonalidad, versión, etc.)
  function normalizeName(name) {
    let normalized = name;
    
    // Quitar tonalidades del final
    for (const pattern of tonalityPatterns) {
      normalized = normalized.replace(pattern, '');
    }
    
    // Quitar versiones numeradas
    for (const pattern of versionPatterns) {
      normalized = normalized.replace(pattern, '');
    }
    
    // Normalizar espacios y convertir a minúsculas
    return normalized.trim().toLowerCase().replace(/\s+/g, ' ');
  }
  
  // Función para verificar si es un cover
  function isCover(name) {
    return coverPatterns.some(pattern => pattern.test(name));
  }
  
  // Función para calcular "calidad" de una canción (para elegir la mejor)
  function getSongScore(song) {
    let score = 100;
    
    // Penalizar si tiene sufijo de tonalidad
    for (const pattern of tonalityPatterns) {
      if (pattern.test(song.name)) {
        score -= 10;
        break;
      }
    }
    
    // Penalizar si tiene versión numerada
    for (const pattern of versionPatterns) {
      if (pattern.test(song.name)) {
        score -= 5;
        break;
      }
    }
    
    // Preferir nombres más cortos (más limpios)
    score -= song.name.length * 0.1;
    
    // Preferir los que tienen chartUrl
    if (song.chartUrl) score += 20;
    
    // Preferir los que tienen más metadatos
    if (song.tonalidad) score += 5;
    if (song.bpm) score += 5;
    if (song.compas) score += 5;
    
    return score;
  }
  
  let totalSongs = 0;
  let coversRemoved = 0;
  let duplicatesRemoved = 0;
  const removedDetails = {
    covers: [],
    duplicates: []
  };
  
  // Procesar cada artista
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs && album.songs.length > 0) {
            const originalCount = album.songs.length;
            totalSongs += originalCount;
            
            // Paso 1: Eliminar covers
            const nonCovers = album.songs.filter(song => {
              if (isCover(song.name)) {
                coversRemoved++;
                removedDetails.covers.push(`${artist.name} - ${album.name} - ${song.name}`);
                return false;
              }
              return true;
            });
            
            // Paso 2: Agrupar por nombre normalizado para detectar duplicados
            const groups = new Map();
            
            nonCovers.forEach(song => {
              const key = normalizeName(song.name);
              if (!groups.has(key)) {
                groups.set(key, []);
              }
              groups.get(key).push(song);
            });
            
            // Paso 3: De cada grupo, elegir la mejor versión
            const cleanedSongs = [];
            
            groups.forEach((songs, normalizedName) => {
              if (songs.length === 1) {
                // Solo hay una versión
                cleanedSongs.push(songs[0]);
              } else {
                // Hay múltiples versiones - elegir la mejor
                songs.sort((a, b) => getSongScore(b) - getSongScore(a));
                const best = songs[0];
                cleanedSongs.push(best);
                
                // Registrar los eliminados
                for (let i = 1; i < songs.length; i++) {
                  duplicatesRemoved++;
                  removedDetails.duplicates.push(
                    `${artist.name} - ${album.name} - ${songs[i].name} (conservado: ${best.name})`
                  );
                }
              }
            });
            
            // Actualizar el álbum
            album.songs = cleanedSongs;
          }
        });
      }
    });
  }
  
  // Actualizar estadísticas
  const newTotalSongs = data.artists.reduce((sum, artist) => {
    return sum + (artist.albums?.reduce((aSum, album) => aSum + (album.songs?.length || 0), 0) || 0);
  }, 0);
  
  data.stats.totalSongs = newTotalSongs;
  data.lastUpdated = new Date().toISOString();
  
  // Mostrar resumen
  console.log(`${c.bold}📊 ANÁLISIS:${c.reset}`);
  console.log(`  • Secuencias analizadas: ${totalSongs}`);
  console.log(`  • Covers encontrados: ${c.yellow}${coversRemoved}${c.reset}`);
  console.log(`  • Duplicados encontrados: ${c.yellow}${duplicatesRemoved}${c.reset}`);
  console.log(`  • Total a eliminar: ${c.red}${coversRemoved + duplicatesRemoved}${c.reset}`);
  console.log(`  • Secuencias restantes: ${c.green}${newTotalSongs}${c.reset}\n`);
  
  // Mostrar detalles
  if (removedDetails.covers.length > 0) {
    console.log(`${c.yellow}📋 COVERS ELIMINADOS (${removedDetails.covers.length}):${c.reset}`);
    removedDetails.covers.slice(0, 20).forEach(item => {
      console.log(`  ${c.dim}• ${item}${c.reset}`);
    });
    if (removedDetails.covers.length > 20) {
      console.log(`  ${c.dim}... y ${removedDetails.covers.length - 20} más${c.reset}`);
    }
    console.log('');
  }
  
  if (removedDetails.duplicates.length > 0) {
    console.log(`${c.yellow}📋 DUPLICADOS ELIMINADOS (${removedDetails.duplicates.length}):${c.reset}`);
    removedDetails.duplicates.slice(0, 30).forEach(item => {
      console.log(`  ${c.dim}• ${item}${c.reset}`);
    });
    if (removedDetails.duplicates.length > 30) {
      console.log(`  ${c.dim}... y ${removedDetails.duplicates.length - 30} más${c.reset}`);
    }
    console.log('');
  }
  
  // Guardar
  createBackup();
  saveDataJson(data);
  
  console.log(`${c.green}✓ Limpieza completada!${c.reset}`);
  console.log(`  • Secuencias antes: ${c.dim}${totalSongs}${c.reset}`);
  console.log(`  • Secuencias ahora: ${c.green}${newTotalSongs}${c.reset}`);
  console.log(`  • Reducción: ${c.yellow}${totalSongs - newTotalSongs}${c.reset} (${((totalSongs - newTotalSongs) / totalSongs * 100).toFixed(1)}%)\n`);
  
  return { 
    coversRemoved, 
    duplicatesRemoved, 
    totalRemoved: coversRemoved + duplicatesRemoved,
    finalCount: newTotalSongs 
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//   � EXTRAER METADATOS DE NOMBRES DE ARCHIVO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extrae metadatos (BPM, tonalidad, compás) de los nombres de archivo
 * Patrones comunes:
 * - "Song Name-Album-Key-BPM.00bpm"
 * - "Song Name 120BPM 4/4 C"
 * - "Artist - Song (Key)"
 */
function extractMetadata() {
  console.log(`\n${c.cyan}🎵 Extrayendo metadatos de nombres de archivo...${c.reset}\n`);
  
  const data = readDataJson();
  
  // Patrones para extraer BPM
  const bpmPatterns = [
    /[-_\s](\d{2,3})\.?\d*\s*bpm/i,           // "135.00bpm" o "135bpm"
    /[-_\s](\d{2,3})\s*BPM/i,                  // "120 BPM"
    /BPM\s*[-_:]?\s*(\d{2,3})/i,               // "BPM: 120" o "BPM-120"
    /(\d{2,3})BPM/i,                            // "120BPM" junto
    /[-_](\d{2,3})[-_]/,                        // "-120-" entre guiones (si está con tonalidad)
  ];
  
  // Patrones para extraer tonalidad
  const keyPatterns = [
    // Notación americana con accidentales
    /[-_\s]((?:A|B|C|D|E|F|G)(?:#|b)?(?:m|M|maj|min|Major|Minor)?)\s*[-_\.\d]/i,
    /[-_\s]((?:A|B|C|D|E|F|G)(?:#|b)?(?:m|M|maj|min|Major|Minor)?)\s*$/i,
    /\(((?:A|B|C|D|E|F|G)(?:#|b)?(?:m|M)?)\)/i,  // "(C)" o "(Am)"
    // Bemoles específicos
    /[-_\s](Ab|Bb|Cb|Db|Eb|Fb|Gb)(?:m|M)?\s*[-_\.\d]/i,
    /[-_\s](Ab|Bb|Cb|Db|Eb|Fb|Gb)(?:m|M)?\s*$/i,
    // Notación latina
    /[-_\s](Do|Re|Mi|Fa|Sol|La|Si)(?:#|b)?(?:\s*(?:Mayor|Menor|m|M))?\s*[-_\.\d]/i,
    /[-_\s](Do|Re|Mi|Fa|Sol|La|Si)(?:#|b)?(?:\s*(?:Mayor|Menor|m|M))?\s*$/i,
  ];
  
  // Patrones para extraer compás
  const timeSignaturePatterns = [
    /(\d\/\d)/,                    // "4/4", "3/4", "6/8"
    /[-_\s](\d)[-_](\d)[-_\s]/,   // "-4-4-" como separador
  ];
  
  // Mapeo de tonalidades latinas a americanas
  const latinToAmerican = {
    'do': 'C', 'dom': 'Cm',
    're': 'D', 'rem': 'Dm',
    'mi': 'E', 'mim': 'Em',
    'fa': 'F', 'fam': 'Fm',
    'sol': 'G', 'solm': 'Gm',
    'la': 'A', 'lam': 'Am',
    'si': 'B', 'sim': 'Bm',
  };
  
  // Normalizar tonalidad
  function normalizeKey(key) {
    if (!key) return null;
    
    let normalized = key.trim();
    
    // Convertir notación latina a americana
    const lowerKey = normalized.toLowerCase();
    for (const [latin, american] of Object.entries(latinToAmerican)) {
      if (lowerKey.startsWith(latin)) {
        normalized = american + normalized.slice(latin.length);
        break;
      }
    }
    
    // Normalizar formato: Mayúscula + accidental + m/M
    normalized = normalized.replace(/major|Mayor|maj/gi, '');
    normalized = normalized.replace(/minor|Menor|min/gi, 'm');
    
    // Asegurar que la nota base esté en mayúscula
    if (normalized.length > 0) {
      normalized = normalized[0].toUpperCase() + normalized.slice(1).toLowerCase();
    }
    
    // Limpiar
    normalized = normalized.replace(/\s+/g, '');
    
    return normalized || null;
  }
  
  // Estadísticas
  let stats = {
    bpmExtracted: 0,
    keyExtracted: 0,
    timeExtracted: 0,
    alreadyHadBpm: 0,
    alreadyHadKey: 0,
    alreadyHadTime: 0,
    totalSongs: 0,
    songsUpdated: 0
  };
  
  const examples = {
    bpm: [],
    key: [],
    time: []
  };
  
  // Procesar cada canción
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs) {
            album.songs.forEach(song => {
              stats.totalSongs++;
              let updated = false;
              
              // Usar fullName si existe, sino name
              const nameToAnalyze = song.fullName || song.name || '';
              
              // Extraer BPM
              if (song.bpm) {
                stats.alreadyHadBpm++;
              } else {
                for (const pattern of bpmPatterns) {
                  const match = nameToAnalyze.match(pattern);
                  if (match && match[1]) {
                    const bpm = parseInt(match[1]);
                    // Validar rango razonable de BPM (40-220)
                    if (bpm >= 40 && bpm <= 220) {
                      song.bpm = bpm;
                      stats.bpmExtracted++;
                      updated = true;
                      if (examples.bpm.length < 5) {
                        examples.bpm.push({ name: song.name, bpm, source: nameToAnalyze.substring(0, 60) });
                      }
                      break;
                    }
                  }
                }
              }
              
              // Extraer tonalidad
              if (song.tonalidad) {
                stats.alreadyHadKey++;
              } else {
                for (const pattern of keyPatterns) {
                  const match = nameToAnalyze.match(pattern);
                  if (match && match[1]) {
                    const key = normalizeKey(match[1]);
                    if (key && key.length >= 1 && key.length <= 4) {
                      song.tonalidad = key;
                      stats.keyExtracted++;
                      updated = true;
                      if (examples.key.length < 5) {
                        examples.key.push({ name: song.name, key, source: nameToAnalyze.substring(0, 60) });
                      }
                      break;
                    }
                  }
                }
              }
              
              // Extraer compás
              if (song.compas) {
                stats.alreadyHadTime++;
              } else {
                for (const pattern of timeSignaturePatterns) {
                  const match = nameToAnalyze.match(pattern);
                  if (match) {
                    let timeSignature;
                    if (match[1] && match[1].includes('/')) {
                      timeSignature = match[1];
                    } else if (match[1] && match[2]) {
                      timeSignature = `${match[1]}/${match[2]}`;
                    }
                    
                    // Validar compases comunes
                    const validTimes = ['2/4', '3/4', '4/4', '5/4', '6/4', '6/8', '7/8', '12/8'];
                    if (timeSignature && validTimes.includes(timeSignature)) {
                      song.compas = timeSignature;
                      stats.timeExtracted++;
                      updated = true;
                      if (examples.time.length < 5) {
                        examples.time.push({ name: song.name, time: timeSignature, source: nameToAnalyze.substring(0, 60) });
                      }
                      break;
                    }
                  }
                }
              }
              
              if (updated) {
                stats.songsUpdated++;
              }
            });
          }
        });
      }
    });
  }
  
  // Mostrar resultados
  console.log(`${c.bold}📊 RESULTADOS DE EXTRACCIÓN:${c.reset}\n`);
  
  console.log(`${c.bold}BPM:${c.reset}`);
  console.log(`  • Ya tenían BPM: ${c.dim}${stats.alreadyHadBpm}${c.reset}`);
  console.log(`  • Extraídos ahora: ${c.green}${stats.bpmExtracted}${c.reset}`);
  if (examples.bpm.length > 0) {
    console.log(`  ${c.dim}Ejemplos:${c.reset}`);
    examples.bpm.forEach(ex => {
      console.log(`    ${c.cyan}${ex.name}${c.reset} → ${c.yellow}${ex.bpm} BPM${c.reset}`);
    });
  }
  
  console.log(`\n${c.bold}TONALIDAD:${c.reset}`);
  console.log(`  • Ya tenían tonalidad: ${c.dim}${stats.alreadyHadKey}${c.reset}`);
  console.log(`  • Extraídas ahora: ${c.green}${stats.keyExtracted}${c.reset}`);
  if (examples.key.length > 0) {
    console.log(`  ${c.dim}Ejemplos:${c.reset}`);
    examples.key.forEach(ex => {
      console.log(`    ${c.cyan}${ex.name}${c.reset} → ${c.yellow}${ex.key}${c.reset}`);
    });
  }
  
  console.log(`\n${c.bold}COMPÁS:${c.reset}`);
  console.log(`  • Ya tenían compás: ${c.dim}${stats.alreadyHadTime}${c.reset}`);
  console.log(`  • Extraídos ahora: ${c.green}${stats.timeExtracted}${c.reset}`);
  if (examples.time.length > 0) {
    console.log(`  ${c.dim}Ejemplos:${c.reset}`);
    examples.time.forEach(ex => {
      console.log(`    ${c.cyan}${ex.name}${c.reset} → ${c.yellow}${ex.time}${c.reset}`);
    });
  }
  
  console.log(`\n${c.bold}RESUMEN:${c.reset}`);
  console.log(`  • Total canciones: ${stats.totalSongs}`);
  console.log(`  • Canciones actualizadas: ${c.green}${stats.songsUpdated}${c.reset}`);
  console.log(`  • Datos extraídos: ${c.green}${stats.bpmExtracted + stats.keyExtracted + stats.timeExtracted}${c.reset}`);
  
  // Guardar si hubo cambios
  if (stats.songsUpdated > 0) {
    data.lastUpdated = new Date().toISOString();
    createBackup();
    saveDataJson(data);
    console.log(`\n${c.green}✓ Datos guardados exitosamente!${c.reset}\n`);
  } else {
    console.log(`\n${c.yellow}ℹ No se encontraron nuevos metadatos para extraer.${c.reset}\n`);
  }
  
  return stats;
}

// ═══════════════════════════════════════════════════════════════════════════════
//   📥 GESTIÓN DE APORTES DE LA COMUNIDAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Asegura que las carpetas de aportes existan
 */
function ensureAportesDirectories() {
  if (!fs.existsSync(CONFIG.APORTES_DIR)) {
    fs.mkdirSync(CONFIG.APORTES_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG.APORTES_SECUENCIAS_DIR)) {
    fs.mkdirSync(CONFIG.APORTES_SECUENCIAS_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG.APORTES_SOFTWARE_DIR)) {
    fs.mkdirSync(CONFIG.APORTES_SOFTWARE_DIR, { recursive: true });
  }
}

/**
 * Agrega aportes de secuencias manualmente (desde los correos)
 */
async function agregarAporteSecuencia(rl) {
  ensureAportesDirectories();
  
  let continuar = true;
  let aportesAgregados = 0;
  
  while (continuar) {
    console.log(`\n${c.cyan}${c.bold}➕ AGREGAR APORTE DE SECUENCIA${c.reset}`);
    console.log(`${c.dim}   Ingresa los datos del correo recibido${c.reset}\n`);
    
    // Solicitar datos
    const artista = await ask(rl, `${c.yellow}Artista: ${c.reset}`);
    if (!artista.trim()) {
      console.log(`${c.red}❌ El artista es obligatorio${c.reset}`);
      continue;
    }
    
    const album = await ask(rl, `${c.yellow}Álbum: ${c.reset}`);
    if (!album.trim()) {
      console.log(`${c.red}❌ El álbum es obligatorio${c.reset}`);
      continue;
    }
    
    const cancion = await ask(rl, `${c.yellow}Nombre de la canción: ${c.reset}`);
    if (!cancion.trim()) {
      console.log(`${c.red}❌ El nombre es obligatorio${c.reset}`);
      continue;
    }
    
    const tonalidad = await ask(rl, `${c.yellow}Tonalidad (ej: C, Dm, F#): ${c.reset}`);
    const bpm = await ask(rl, `${c.yellow}BPM: ${c.reset}`);
    const compas = await ask(rl, `${c.yellow}Compás (ej: 4/4, 3/4): ${c.reset}`);
    const urlDescarga = await ask(rl, `${c.yellow}URL de descarga: ${c.reset}`);
    const donante = await ask(rl, `${c.yellow}Nombre del donante: ${c.reset}`);
    const emailDonante = await ask(rl, `${c.yellow}Email del donante: ${c.reset}`);
    
    // Crear objeto de aporte
    const aporte = {
      id: `aporte_${Date.now()}`,
      fechaAporte: new Date().toISOString(),
      artista: artista.trim(),
      album: album.trim(),
      cancion: cancion.trim(),
      tonalidad: tonalidad.trim() || null,
      bpm: bpm.trim() ? parseInt(bpm) : null,
      compas: compas.trim() || null,
      urlDescarga: urlDescarga.trim() || null,
      donante: donante.trim() || 'Anónimo',
      emailDonante: emailDonante.trim() || null,
      estado: 'pendiente'
    };
    
    // Guardar como XLSX individual
    try {
      let XLSX;
      try {
        XLSX = require('xlsx-js-style');
      } catch (e) {
        XLSX = require('xlsx');
      }
      
      const fileName = `aporte_${aporte.id}.xlsx`;
      const filePath = path.join(CONFIG.APORTES_SECUENCIAS_DIR, fileName);
      
      // Crear hoja con los datos
      const headers = ['ID', 'Fecha', 'Artista', 'Album', 'Cancion', 'Tonalidad', 'BPM', 'Compas', 'URL', 'Donante', 'Email', 'Estado'];
      const row = [
        aporte.id,
        aporte.fechaAporte,
        aporte.artista,
        aporte.album,
        aporte.cancion,
        aporte.tonalidad || '',
        aporte.bpm || '',
        aporte.compas || '',
        aporte.urlDescarga || '',
        aporte.donante,
        aporte.emailDonante || '',
        aporte.estado
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers, row]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aporte');
      XLSX.writeFile(wb, filePath);
      
      aportesAgregados++;
      console.log(`\n${c.green}✓ Aporte guardado: ${fileName}${c.reset}`);
      console.log(`${c.dim}  Ubicación: ${filePath}${c.reset}`);
      
    } catch (error) {
      console.log(`${c.red}❌ Error guardando aporte: ${error.message}${c.reset}`);
    }
    
    // Preguntar si agregar otro
    const otro = await ask(rl, `\n${c.cyan}¿Deseas agregar otro aporte de secuencia? (s/n): ${c.reset}`);
    continuar = otro.toLowerCase() === 's' || otro.toLowerCase() === 'si';
  }
  
  console.log(`\n${c.green}✓ Total aportes agregados: ${aportesAgregados}${c.reset}`);
  return aportesAgregados;
}

/**
 * Agrega aportes de software manualmente (desde los correos)
 */
async function agregarAporteSoftware(rl) {
  ensureAportesDirectories();
  
  let continuar = true;
  let aportesAgregados = 0;
  
  while (continuar) {
    console.log(`\n${c.cyan}${c.bold}➕ AGREGAR APORTE DE SOFTWARE${c.reset}`);
    console.log(`${c.dim}   Ingresa los datos del correo recibido${c.reset}\n`);
    
    // Solicitar datos
    const nombre = await ask(rl, `${c.yellow}Nombre del software: ${c.reset}`);
    if (!nombre.trim()) {
      console.log(`${c.red}❌ El nombre es obligatorio${c.reset}`);
      continue;
    }
    
    console.log(`${c.dim}   Subcategorías: daws, plugins, utilidades${c.reset}`);
    const subcategoria = await ask(rl, `${c.yellow}Subcategoría: ${c.reset}`);
    if (!subcategoria.trim()) {
      console.log(`${c.red}❌ La subcategoría es obligatoria${c.reset}`);
      continue;
    }
    
    const descripcion = await ask(rl, `${c.yellow}Descripción: ${c.reset}`);
    const urlDescarga = await ask(rl, `${c.yellow}URL de descarga: ${c.reset}`);
    const donante = await ask(rl, `${c.yellow}Nombre del donante: ${c.reset}`);
    const emailDonante = await ask(rl, `${c.yellow}Email del donante: ${c.reset}`);
    
    // Crear objeto de aporte
    const aporte = {
      id: `aporte_sw_${Date.now()}`,
      fechaAporte: new Date().toISOString(),
      nombre: nombre.trim(),
      subcategoria: subcategoria.trim().toLowerCase(),
      descripcion: descripcion.trim() || null,
      urlDescarga: urlDescarga.trim() || null,
      donante: donante.trim() || 'Anónimo',
      emailDonante: emailDonante.trim() || null,
      estado: 'pendiente'
    };
    
    // Guardar como XLSX individual
    try {
      let XLSX;
      try {
        XLSX = require('xlsx-js-style');
      } catch (e) {
        XLSX = require('xlsx');
      }
      
      const fileName = `aporte_${aporte.id}.xlsx`;
      const filePath = path.join(CONFIG.APORTES_SOFTWARE_DIR, fileName);
      
      // Crear hoja con los datos
      const headers = ['ID', 'Fecha', 'Nombre', 'Subcategoria', 'Descripcion', 'URL', 'Donante', 'Email', 'Estado'];
      const row = [
        aporte.id,
        aporte.fechaAporte,
        aporte.nombre,
        aporte.subcategoria,
        aporte.descripcion || '',
        aporte.urlDescarga || '',
        aporte.donante,
        aporte.emailDonante || '',
        aporte.estado
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers, row]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aporte');
      XLSX.writeFile(wb, filePath);
      
      aportesAgregados++;
      console.log(`\n${c.green}✓ Aporte guardado: ${fileName}${c.reset}`);
      console.log(`${c.dim}  Ubicación: ${filePath}${c.reset}`);
      
    } catch (error) {
      console.log(`${c.red}❌ Error guardando aporte: ${error.message}${c.reset}`);
    }
    
    // Preguntar si agregar otro
    const otro = await ask(rl, `\n${c.cyan}¿Deseas agregar otro aporte de software? (s/n): ${c.reset}`);
    continuar = otro.toLowerCase() === 's' || otro.toLowerCase() === 'si';
  }
  
  console.log(`\n${c.green}✓ Total aportes agregados: ${aportesAgregados}${c.reset}`);
  return aportesAgregados;
}

/**
 * Combina todos los XLSX de aportes en un archivo madre
 */
function combinarAportes(tipo = 'secuencias') {
  ensureAportesDirectories();
  
  const dir = tipo === 'secuencias' ? CONFIG.APORTES_SECUENCIAS_DIR : CONFIG.APORTES_SOFTWARE_DIR;
  const nombreMadre = tipo === 'secuencias' ? 'aportes-secuencias-madre.xlsx' : 'aportes-software-madre.xlsx';
  const pathMadre = path.join(dir, nombreMadre);
  
  console.log(`\n${c.cyan}📦 Combinando aportes de ${tipo}...${c.reset}\n`);
  
  let XLSX;
  try {
    XLSX = require('xlsx-js-style');
  } catch (e) {
    try {
      XLSX = require('xlsx');
    } catch (e2) {
      console.log(`${c.red}❌ Error: xlsx no está instalado${c.reset}`);
      return null;
    }
  }
  
  // Listar archivos XLSX individuales (excluyendo el madre)
  const archivos = fs.readdirSync(dir)
    .filter(f => f.endsWith('.xlsx') && f.startsWith('aporte_') && !f.includes('madre'));
  
  if (archivos.length === 0) {
    console.log(`${c.yellow}⚠ No hay aportes pendientes de ${tipo}${c.reset}`);
    return null;
  }
  
  console.log(`${c.dim}  Encontrados ${archivos.length} aportes individuales${c.reset}`);
  
  // Leer todos los aportes
  const todosLosAportes = [];
  let headers = null;
  
  archivos.forEach(archivo => {
    const filePath = path.join(dir, archivo);
    try {
      const wb = XLSX.readFile(filePath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (data.length > 0) {
        if (!headers) {
          headers = data[0];
        }
        // Agregar filas de datos (sin headers)
        for (let i = 1; i < data.length; i++) {
          if (data[i] && data[i].length > 0) {
            todosLosAportes.push(data[i]);
          }
        }
      }
    } catch (error) {
      console.log(`${c.yellow}⚠ Error leyendo ${archivo}: ${error.message}${c.reset}`);
    }
  });
  
  if (todosLosAportes.length === 0) {
    console.log(`${c.yellow}⚠ No se encontraron datos en los aportes${c.reset}`);
    return null;
  }
  
  // Crear archivo madre
  const ws = XLSX.utils.aoa_to_sheet([headers, ...todosLosAportes]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Aportes');
  XLSX.writeFile(wb, pathMadre);
  
  console.log(`${c.green}✓ Archivo madre creado: ${nombreMadre}${c.reset}`);
  console.log(`${c.dim}  Total aportes combinados: ${todosLosAportes.length}${c.reset}`);
  console.log(`${c.dim}  Ubicación: ${pathMadre}${c.reset}`);
  
  return { path: pathMadre, count: todosLosAportes.length };
}

/**
 * Revisa aportes y verifica duplicados contra el JSON
 */
function revisarAportes(tipo = 'secuencias') {
  ensureAportesDirectories();
  
  const dir = tipo === 'secuencias' ? CONFIG.APORTES_SECUENCIAS_DIR : CONFIG.APORTES_SOFTWARE_DIR;
  const nombreMadre = tipo === 'secuencias' ? 'aportes-secuencias-madre.xlsx' : 'aportes-software-madre.xlsx';
  const pathMadre = path.join(dir, nombreMadre);
  
  console.log(`\n${c.cyan}👁️ Revisando aportes de ${tipo}...${c.reset}\n`);
  
  // Verificar si existe el archivo madre
  if (!fs.existsSync(pathMadre)) {
    console.log(`${c.yellow}⚠ No existe archivo madre. Ejecuta primero "Combinar aportes"${c.reset}`);
    return null;
  }
  
  let XLSX;
  try {
    XLSX = require('xlsx-js-style');
  } catch (e) {
    XLSX = require('xlsx');
  }
  
  // Leer archivo madre
  const wb = XLSX.readFile(pathMadre);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aportes = XLSX.utils.sheet_to_json(ws);
  
  if (aportes.length === 0) {
    console.log(`${c.yellow}⚠ El archivo madre está vacío${c.reset}`);
    return null;
  }
  
  // Leer JSON correspondiente
  const jsonData = tipo === 'secuencias' ? readDataJson('secuencias') : readDataJson('software');
  
  // Verificar duplicados
  const resultados = [];
  
  if (tipo === 'secuencias') {
    // Crear índice de canciones existentes
    const cancionesExistentes = new Map();
    if (jsonData.artists) {
      jsonData.artists.forEach(artist => {
        if (artist.albums) {
          artist.albums.forEach(album => {
            if (album.songs) {
              album.songs.forEach(song => {
                const key = normalizeText(`${artist.name}-${album.name}-${song.name}`);
                cancionesExistentes.set(key, { artist: artist.name, album: album.name, song: song.name });
              });
            }
          });
        }
      });
    }
    
    // Verificar cada aporte
    aportes.forEach((aporte, idx) => {
      const key = normalizeText(`${aporte.Artista}-${aporte.Album}-${aporte.Cancion}`);
      const existe = cancionesExistentes.get(key);
      
      resultados.push({
        index: idx + 1,
        aporte,
        duplicado: !!existe,
        existente: existe
      });
    });
  } else {
    // Para software
    const softwareExistente = new Map();
    if (jsonData.categories) {
      jsonData.categories.forEach(cat => {
        if (cat.items) {
          cat.items.forEach(item => {
            const key = normalizeText(item.name);
            softwareExistente.set(key, { category: cat.id, name: item.name });
          });
        }
      });
    }
    
    aportes.forEach((aporte, idx) => {
      const key = normalizeText(aporte.Nombre);
      const existe = softwareExistente.get(key);
      
      resultados.push({
        index: idx + 1,
        aporte,
        duplicado: !!existe,
        existente: existe
      });
    });
  }
  
  // Mostrar resultados
  console.log(`${c.bold}📋 RESUMEN DE APORTES:${c.reset}\n`);
  
  let nuevos = 0;
  let duplicados = 0;
  
  resultados.forEach(r => {
    if (r.duplicado) {
      duplicados++;
      console.log(`  ${c.red}✗ [${r.index}] DUPLICADO${c.reset}`);
      if (tipo === 'secuencias') {
        console.log(`    ${c.dim}Aporte: ${r.aporte.Artista} - ${r.aporte.Album} - ${r.aporte.Cancion}${c.reset}`);
        console.log(`    ${c.yellow}Ya existe: ${r.existente.artist} - ${r.existente.album} - ${r.existente.song}${c.reset}`);
      } else {
        console.log(`    ${c.dim}Aporte: ${r.aporte.Nombre}${c.reset}`);
        console.log(`    ${c.yellow}Ya existe: ${r.existente.name} (${r.existente.category})${c.reset}`);
      }
    } else {
      nuevos++;
      console.log(`  ${c.green}✓ [${r.index}] NUEVO${c.reset}`);
      if (tipo === 'secuencias') {
        console.log(`    ${c.dim}${r.aporte.Artista} - ${r.aporte.Album} - ${r.aporte.Cancion}${c.reset}`);
      } else {
        console.log(`    ${c.dim}${r.aporte.Nombre} (${r.aporte.Subcategoria})${c.reset}`);
      }
    }
    console.log('');
  });
  
  console.log(`${c.bold}TOTALES:${c.reset}`);
  console.log(`  • Nuevos (listos para aprobar): ${c.green}${nuevos}${c.reset}`);
  console.log(`  • Duplicados (revisar): ${c.red}${duplicados}${c.reset}`);
  
  return { resultados, nuevos, duplicados };
}

/**
 * Aprueba y transfiere aportes al JSON correspondiente
 */
async function aprobarAportes(rl, tipo = 'secuencias') {
  ensureAportesDirectories();
  
  const dir = tipo === 'secuencias' ? CONFIG.APORTES_SECUENCIAS_DIR : CONFIG.APORTES_SOFTWARE_DIR;
  const nombreMadre = tipo === 'secuencias' ? 'aportes-secuencias-madre.xlsx' : 'aportes-software-madre.xlsx';
  const pathMadre = path.join(dir, nombreMadre);
  
  console.log(`\n${c.cyan}✅ Aprobar y transferir aportes de ${tipo}...${c.reset}\n`);
  
  if (!fs.existsSync(pathMadre)) {
    console.log(`${c.yellow}⚠ No existe archivo madre. Ejecuta primero "Combinar aportes"${c.reset}`);
    return null;
  }
  
  let XLSX;
  try {
    XLSX = require('xlsx-js-style');
  } catch (e) {
    XLSX = require('xlsx');
  }
  
  // Leer archivo madre
  const wb = XLSX.readFile(pathMadre);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aportes = XLSX.utils.sheet_to_json(ws);
  
  if (aportes.length === 0) {
    console.log(`${c.yellow}⚠ No hay aportes para aprobar${c.reset}`);
    return null;
  }
  
  // Confirmar
  console.log(`${c.yellow}Se van a transferir ${aportes.length} aportes al ${tipo}.json${c.reset}`);
  const confirmar = await ask(rl, `${c.cyan}¿Continuar? (s/n): ${c.reset}`);
  
  if (confirmar.toLowerCase() !== 's' && confirmar.toLowerCase() !== 'si') {
    console.log(`${c.dim}Operación cancelada${c.reset}`);
    return null;
  }
  
  // Crear backup
  createBackup(tipo);
  
  // Leer JSON actual
  const jsonData = readDataJson(tipo);
  let agregados = 0;
  
  if (tipo === 'secuencias') {
    aportes.forEach(aporte => {
      // Buscar o crear artista
      let artist = jsonData.artists.find(a => normalizeText(a.name) === normalizeText(aporte.Artista));
      if (!artist) {
        artist = {
          id: `artist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: aporte.Artista,
          albums: []
        };
        jsonData.artists.push(artist);
      }
      
      // Buscar o crear álbum
      let album = artist.albums.find(a => normalizeText(a.name) === normalizeText(aporte.Album));
      if (!album) {
        album = {
          id: `album_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: aporte.Album,
          songs: []
        };
        artist.albums.push(album);
      }
      
      // Crear canción
      const song = {
        id: aporte.ID || `song_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: aporte.Cancion,
        fullName: `${aporte.Cancion}.zip`,
        type: 'sequence',
        driveId: aporte.URL ? extractDriveId(aporte.URL) : null,
        downloadUrl: aporte.URL || null,
        tonalidad: aporte.Tonalidad || null,
        bpm: aporte.BPM ? parseInt(aporte.BPM) : null,
        compas: aporte.Compas || null,
        tipoSecuencia: 'Usuario',
        comentarios: `Aportado por ${aporte.Donante || 'Anónimo'}`
      };
      
      album.songs.push(song);
      agregados++;
    });
    
    // Actualizar stats
    jsonData.stats = {
      totalArtists: jsonData.artists.length,
      totalSongs: jsonData.artists.reduce((sum, a) => sum + a.albums.reduce((s, al) => s + al.songs.length, 0), 0),
      totalCharts: jsonData.stats?.totalCharts || 0
    };
  } else {
    // Para software
    aportes.forEach(aporte => {
      // Buscar o crear categoría
      let category = jsonData.categories.find(c => c.id === aporte.Subcategoria);
      if (!category) {
        category = {
          id: aporte.Subcategoria,
          name: aporte.Subcategoria.charAt(0).toUpperCase() + aporte.Subcategoria.slice(1),
          items: []
        };
        jsonData.categories.push(category);
      }
      
      // Crear item
      const item = {
        id: aporte.ID || `sw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: aporte.Nombre,
        description: aporte.Descripcion || null,
        url: aporte.URL || null,
        addedBy: aporte.Donante || 'Anónimo'
      };
      
      category.items.push(item);
      agregados++;
    });
  }
  
  // Guardar
  jsonData.lastUpdated = new Date().toISOString();
  saveDataJson(jsonData, tipo);
  
  console.log(`\n${c.green}✓ ${agregados} aportes transferidos al ${tipo}.json${c.reset}`);
  
  return agregados;
}

/**
 * Extrae el ID de Google Drive de una URL
 */
function extractDriveId(url) {
  if (!url) return null;
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Limpia aportes procesados (elimina XLSX individuales y madre)
 */
function limpiarAportes(tipo = 'secuencias') {
  ensureAportesDirectories();
  
  const dir = tipo === 'secuencias' ? CONFIG.APORTES_SECUENCIAS_DIR : CONFIG.APORTES_SOFTWARE_DIR;
  
  console.log(`\n${c.cyan}🗑️ Limpiando aportes procesados de ${tipo}...${c.reset}\n`);
  
  const archivos = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  
  if (archivos.length === 0) {
    console.log(`${c.dim}No hay archivos para limpiar${c.reset}`);
    return 0;
  }
  
  let eliminados = 0;
  archivos.forEach(archivo => {
    try {
      fs.unlinkSync(path.join(dir, archivo));
      eliminados++;
      console.log(`${c.dim}  ✗ ${archivo}${c.reset}`);
    } catch (error) {
      console.log(`${c.red}  Error eliminando ${archivo}: ${error.message}${c.reset}`);
    }
  });
  
  console.log(`\n${c.green}✓ ${eliminados} archivos eliminados${c.reset}`);
  return eliminados;
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🧹 UTILIDADES ADICIONALES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Limpia numeración del inicio de nombres de canciones
 */
function limpiarNumeracionNombres() {
  console.log(`\n${c.cyan}🧹 Limpiando numeración de nombres de archivos...${c.reset}\n`);
  
  const data = readDataJson('secuencias');
  let modificados = 0;
  const ejemplos = [];
  
  // Patrones de numeración a eliminar
  const patterns = [
    /^\d{1,2}\.\s*/,           // "01. " o "1. "
    /^\d{1,2}\s*-\s*/,         // "01 - " o "1 - "
    /^\d{1,2}_/,               // "01_"
    /^\[\d{1,2}\]\s*/,         // "[01] "
    /^\(\d{1,2}\)\s*/,         // "(01) "
  ];
  
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs) {
            album.songs.forEach(song => {
              const originalName = song.name;
              let newName = originalName;
              
              // Aplicar patrones
              for (const pattern of patterns) {
                if (pattern.test(newName)) {
                  newName = newName.replace(pattern, '');
                  break;
                }
              }
              
              // Si cambió el nombre
              if (newName !== originalName) {
                song.name = newName.trim();
                modificados++;
                if (ejemplos.length < 5) {
                  ejemplos.push({ original: originalName, nuevo: song.name });
                }
              }
            });
          }
        });
      }
    });
  }
  
  if (modificados > 0) {
    console.log(`${c.bold}Ejemplos de cambios:${c.reset}`);
    ejemplos.forEach(e => {
      console.log(`  ${c.red}"${e.original}"${c.reset} → ${c.green}"${e.nuevo}"${c.reset}`);
    });
    
    data.lastUpdated = new Date().toISOString();
    createBackup('secuencias');
    saveDataJson(data, 'secuencias');
    console.log(`\n${c.green}✓ ${modificados} nombres limpiados${c.reset}`);
  } else {
    console.log(`${c.dim}No se encontraron nombres con numeración para limpiar${c.reset}`);
  }
  
  return modificados;
}

/**
 * Sincroniza las estadísticas del JSON
 */
function sincronizarStats() {
  console.log(`\n${c.cyan}🔄 Sincronizando estadísticas...${c.reset}\n`);
  
  const data = readDataJson('secuencias');
  
  const totalArtists = data.artists ? data.artists.length : 0;
  const totalSongs = data.artists ? data.artists.reduce(
    (sum, a) => sum + (a.albums ? a.albums.reduce((s, al) => s + (al.songs ? al.songs.length : 0), 0) : 0), 0
  ) : 0;
  const totalCharts = data.artists ? data.artists.reduce(
    (sum, a) => sum + (a.albums ? a.albums.reduce(
      (s, al) => s + (al.songs ? al.songs.filter(song => song.chartUrl).length : 0), 0
    ) : 0), 0
  ) : 0;
  
  console.log(`${c.bold}Estadísticas calculadas:${c.reset}`);
  console.log(`  • Artistas: ${totalArtists}`);
  console.log(`  • Secuencias: ${totalSongs}`);
  console.log(`  • Charts: ${totalCharts}`);
  
  const statsAnterior = data.stats || {};
  
  data.stats = {
    totalArtists,
    totalSongs,
    totalCharts
  };
  
  const cambio = statsAnterior.totalArtists !== totalArtists ||
                 statsAnterior.totalSongs !== totalSongs ||
                 statsAnterior.totalCharts !== totalCharts;
  
  if (cambio) {
    data.lastUpdated = new Date().toISOString();
    saveDataJson(data, 'secuencias');
    console.log(`\n${c.green}✓ Estadísticas actualizadas${c.reset}`);
  } else {
    console.log(`\n${c.dim}Las estadísticas ya estaban correctas${c.reset}`);
  }
  
  return data.stats;
}

/**
 * Valida la integridad de los datos
 */
function validarIntegridad() {
  console.log(`\n${c.cyan}📋 Validando integridad de datos...${c.reset}\n`);
  
  const problemas = [];
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAR SECUENCIAS.JSON
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${c.bold}Validando secuencias.json...${c.reset}`);
  
  const secuenciasData = readDataJson('secuencias');
  
  if (secuenciasData.artists) {
    secuenciasData.artists.forEach((artist, aIdx) => {
      // Artista sin nombre
      if (!artist.name || !artist.name.trim()) {
        problemas.push({ tipo: 'error', origen: 'secuencias', msg: `Artista #${aIdx + 1} sin nombre` });
      }
      
      // Artista sin álbumes
      if (!artist.albums || artist.albums.length === 0) {
        problemas.push({ tipo: 'warn', origen: 'secuencias', msg: `"${artist.name}" no tiene álbumes` });
      } else {
        artist.albums.forEach((album, alIdx) => {
          // Álbum sin nombre
          if (!album.name || !album.name.trim()) {
            problemas.push({ tipo: 'error', origen: 'secuencias', msg: `"${artist.name}" tiene álbum #${alIdx + 1} sin nombre` });
          }
          
          // Álbum sin canciones
          if (!album.songs || album.songs.length === 0) {
            problemas.push({ tipo: 'warn', origen: 'secuencias', msg: `"${artist.name} - ${album.name}" no tiene canciones` });
          } else {
            album.songs.forEach((song, sIdx) => {
              // Canción sin nombre
              if (!song.name || !song.name.trim()) {
                problemas.push({ tipo: 'error', origen: 'secuencias', msg: `"${artist.name} - ${album.name}" tiene canción #${sIdx + 1} sin nombre` });
              }
              
              // Canción sin URL de descarga
              if (!song.downloadUrl && !song.driveId) {
                problemas.push({ tipo: 'warn', origen: 'secuencias', msg: `"${song.name}" sin URL de descarga` });
              }
            });
          }
        });
      }
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAR SOFTWARE.JSON
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${c.bold}Validando software.json...${c.reset}`);
  
  const softwareData = readDataJson('software');
  
  if (softwareData.categories) {
    softwareData.categories.forEach((category, cIdx) => {
      // Categoría sin nombre
      if (!category.name || !category.name.trim()) {
        problemas.push({ tipo: 'error', origen: 'software', msg: `Categoría #${cIdx + 1} sin nombre` });
      }
      
      // Categoría sin ID
      if (!category.id) {
        problemas.push({ tipo: 'error', origen: 'software', msg: `Categoría "${category.name || cIdx + 1}" sin ID` });
      }
      
      // Validar items de la categoría
      if (category.items && category.items.length > 0) {
        category.items.forEach((item, iIdx) => {
          // Item sin nombre
          if (!item.name || !item.name.trim()) {
            problemas.push({ tipo: 'error', origen: 'software', msg: `"${category.name}" tiene item #${iIdx + 1} sin nombre` });
          }
          
          // Item sin URL
          if (!item.url) {
            problemas.push({ tipo: 'warn', origen: 'software', msg: `"${item.name || 'Item ' + (iIdx + 1)}" en "${category.name}" sin URL` });
          }
          
          // Item sin descripción
          if (!item.description || !item.description.trim()) {
            problemas.push({ tipo: 'warn', origen: 'software', msg: `"${item.name}" en "${category.name}" sin descripción` });
          }
          
          // Item sin ID
          if (!item.id) {
            problemas.push({ tipo: 'warn', origen: 'software', msg: `"${item.name}" en "${category.name}" sin ID único` });
          }
        });
      }
    });
  } else {
    problemas.push({ tipo: 'warn', origen: 'software', msg: 'software.json no tiene categorías definidas' });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOSTRAR RESULTADOS
  // ═══════════════════════════════════════════════════════════════════════════
  const erroresSecuencias = problemas.filter(p => p.tipo === 'error' && p.origen === 'secuencias');
  const erroresSoftware = problemas.filter(p => p.tipo === 'error' && p.origen === 'software');
  const advertenciasSecuencias = problemas.filter(p => p.tipo === 'warn' && p.origen === 'secuencias');
  const advertenciasSoftware = problemas.filter(p => p.tipo === 'warn' && p.origen === 'software');
  
  console.log(`\n${c.cyan}═══ SECUENCIAS.JSON ═══${c.reset}`);
  if (erroresSecuencias.length > 0) {
    console.log(`${c.red}${c.bold}❌ ERRORES (${erroresSecuencias.length}):${c.reset}`);
    erroresSecuencias.forEach(e => console.log(`  ${c.red}• ${e.msg}${c.reset}`));
  }
  if (advertenciasSecuencias.length > 0) {
    console.log(`${c.yellow}${c.bold}⚠ ADVERTENCIAS (${advertenciasSecuencias.length}):${c.reset}`);
    advertenciasSecuencias.slice(0, 10).forEach(w => console.log(`  ${c.yellow}• ${w.msg}${c.reset}`));
    if (advertenciasSecuencias.length > 10) {
      console.log(`  ${c.dim}... y ${advertenciasSecuencias.length - 10} más${c.reset}`);
    }
  }
  if (erroresSecuencias.length === 0 && advertenciasSecuencias.length === 0) {
    console.log(`${c.green}✓ Sin problemas${c.reset}`);
  }
  
  console.log(`\n${c.cyan}═══ SOFTWARE.JSON ═══${c.reset}`);
  if (erroresSoftware.length > 0) {
    console.log(`${c.red}${c.bold}❌ ERRORES (${erroresSoftware.length}):${c.reset}`);
    erroresSoftware.forEach(e => console.log(`  ${c.red}• ${e.msg}${c.reset}`));
  }
  if (advertenciasSoftware.length > 0) {
    console.log(`${c.yellow}${c.bold}⚠ ADVERTENCIAS (${advertenciasSoftware.length}):${c.reset}`);
    advertenciasSoftware.slice(0, 10).forEach(w => console.log(`  ${c.yellow}• ${w.msg}${c.reset}`));
    if (advertenciasSoftware.length > 10) {
      console.log(`  ${c.dim}... y ${advertenciasSoftware.length - 10} más${c.reset}`);
    }
  }
  if (erroresSoftware.length === 0 && advertenciasSoftware.length === 0) {
    console.log(`${c.green}✓ Sin problemas${c.reset}`);
  }
  
  // Resumen final
  const totalErrores = erroresSecuencias.length + erroresSoftware.length;
  const totalAdvertencias = advertenciasSecuencias.length + advertenciasSoftware.length;
  
  console.log(`\n${c.bold}═══ RESUMEN TOTAL ═══${c.reset}`);
  console.log(`  * Errores secuencias: ${erroresSecuencias.length}`);
  console.log(`  * Errores software: ${erroresSoftware.length}`);
  console.log(`  * Advertencias secuencias: ${advertenciasSecuencias.length}`);
  console.log(`  * Advertencias software: ${advertenciasSoftware.length}`);
  console.log(`  ${c.bold}Total: ${totalErrores} errores, ${totalAdvertencias} advertencias${c.reset}`);
  
  return { 
    errores: totalErrores, 
    advertencias: totalAdvertencias,
    secuencias: { errores: erroresSecuencias.length, advertencias: advertenciasSecuencias.length },
    software: { errores: erroresSoftware.length, advertencias: advertenciasSoftware.length }
  };
}

/**
 * Elimina albumes vacios (sin canciones)
 */
function eliminarAlbumesVacios() {
  console.log(`\n${c.cyan}[X] Eliminando albumes vacios...${c.reset}\n`);
  
  const data = readDataJson('secuencias');
  let albumesEliminados = 0;
  let artistasEliminados = 0;
  const detalles = [];
  
  if (data.artists) {
    // Filtrar albumes vacios de cada artista
    data.artists.forEach(artist => {
      if (artist.albums) {
        const albumesOriginales = artist.albums.length;
        artist.albums = artist.albums.filter(album => {
          const tieneCanciones = album.songs && album.songs.length > 0;
          if (!tieneCanciones) {
            detalles.push(`  ${c.dim}x ${artist.name} - ${album.name}${c.reset}`);
          }
          return tieneCanciones;
        });
        albumesEliminados += albumesOriginales - artist.albums.length;
      }
    });
    
    // Filtrar artistas sin albumes
    const artistasOriginales = data.artists.length;
    data.artists = data.artists.filter(artist => artist.albums && artist.albums.length > 0);
    artistasEliminados = artistasOriginales - data.artists.length;
  }
  
  if (albumesEliminados > 0 || artistasEliminados > 0) {
    // Mostrar primeros 20 detalles
    if (detalles.length > 0) {
      console.log(`${c.bold}Albumes eliminados:${c.reset}`);
      detalles.slice(0, 20).forEach(d => console.log(d));
      if (detalles.length > 20) {
        console.log(`  ${c.dim}... y ${detalles.length - 20} mas${c.reset}`);
      }
    }
    
    // Actualizar stats
    data.stats = {
      totalArtists: data.artists.length,
      totalSongs: data.artists.reduce((sum, a) => sum + a.albums.reduce((s, al) => s + al.songs.length, 0), 0),
      totalCharts: data.stats?.totalCharts || 0
    };
    
    data.lastUpdated = new Date().toISOString();
    createBackup('secuencias');
    saveDataJson(data, 'secuencias');
    
    console.log(`\n${c.green}[v] Eliminados: ${albumesEliminados} albumes vacios, ${artistasEliminados} artistas sin albumes${c.reset}`);
  } else {
    console.log(`${c.dim}No se encontraron albumes vacios${c.reset}`);
  }
  
  return { albumesEliminados, artistasEliminados };
}

/**
 * Elimina duplicados de tonos (mantiene solo el tono original/primero encontrado)
 */
function eliminarDuplicadosTonos() {
  console.log(`\n${c.cyan}[D] Eliminando duplicados de tonos...${c.reset}\n`);
  
  const data = readDataJson('secuencias');
  let cancionesEliminadas = 0;
  const detalles = [];
  
  // Patrones para extraer tonalidad del nombre
  // Ejemplos: "-A-120bpm", "-Bb-", "(C)", "- G -", etc.
  const tonalityPatterns = [
    /-([A-G][b#]?)-\d+\.?\d*bpm$/i,     // -A-120bpm, -Bb-72.00bpm
    /-([A-G][b#]?)$/i,                   // -A, -Bb
    /\s*-\s*([A-G][b#]?)\s*-?\s*$/i,    // - A -, - Bb
    /\(([A-G][b#]?)\)$/i,               // (C), (Dm)
    /-([A-G][b#]?m?)-/i,                // -Cm- (con menor)
  ];
  
  /**
   * Extrae el nombre base de la cancion (sin tonalidad ni BPM)
   */
  function getBaseName(songName) {
    let base = songName;
    
    // Remover tonalidad y BPM del final
    base = base.replace(/-[A-G][b#]?m?-?\d*\.?\d*bpm$/i, '');
    base = base.replace(/-[A-G][b#]?m?$/i, '');
    base = base.replace(/\s*-\s*[A-G][b#]?m?\s*-?\s*$/i, '');
    base = base.replace(/\([A-G][b#]?m?\)$/i, '');
    base = base.replace(/-[A-G][b#]?m?-/gi, '-');
    
    // Limpiar guiones y espacios extra
    base = base.replace(/[-_]+$/, '').trim();
    
    return normalizeText(base);
  }
  
  /**
   * Extrae la tonalidad de un nombre de cancion
   */
  function getTonality(songName) {
    for (const pattern of tonalityPatterns) {
      const match = songName.match(pattern);
      if (match) {
        return match[1].toUpperCase();
      }
    }
    return null;
  }
  
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs && album.songs.length > 1) {
            // Agrupar canciones por nombre base
            const songsByBase = new Map();
            
            album.songs.forEach(song => {
              const baseName = getBaseName(song.name);
              const tonality = getTonality(song.name);
              
              if (!songsByBase.has(baseName)) {
                songsByBase.set(baseName, []);
              }
              songsByBase.get(baseName).push({ song, tonality });
            });
            
            // Filtrar: mantener solo la primera version de cada cancion
            const cancionesAMantener = [];
            const cancionesEliminadasDelAlbum = [];
            
            songsByBase.forEach((versions, baseName) => {
              if (versions.length > 1) {
                // Hay duplicados - mantener la primera
                const [primera, ...duplicadas] = versions;
                cancionesAMantener.push(primera.song);
                
                duplicadas.forEach(dup => {
                  cancionesEliminadasDelAlbum.push(dup.song.name);
                  cancionesEliminadas++;
                });
                
                if (duplicadas.length > 0) {
                  detalles.push(`  ${c.green}[v] ${artist.name} - ${album.name}${c.reset}`);
                  detalles.push(`      ${c.dim}Mantiene: ${primera.song.name}${c.reset}`);
                  duplicadas.forEach(dup => {
                    detalles.push(`      ${c.red}x Elimina: ${dup.song.name}${c.reset}`);
                  });
                }
              } else {
                // Solo una version - mantener
                cancionesAMantener.push(versions[0].song);
              }
            });
            
            // Actualizar el album con las canciones filtradas
            album.songs = cancionesAMantener;
          }
        });
      }
    });
  }
  
  if (cancionesEliminadas > 0) {
    // Mostrar primeros 30 detalles
    if (detalles.length > 0) {
      console.log(`${c.bold}Duplicados eliminados:${c.reset}`);
      detalles.slice(0, 30).forEach(d => console.log(d));
      if (detalles.length > 30) {
        console.log(`  ${c.dim}... y mas${c.reset}`);
      }
    }
    
    // Actualizar stats
    data.stats = {
      totalArtists: data.artists.length,
      totalSongs: data.artists.reduce((sum, a) => sum + a.albums.reduce((s, al) => s + al.songs.length, 0), 0),
      totalCharts: data.stats?.totalCharts || 0
    };
    
    data.lastUpdated = new Date().toISOString();
    createBackup('secuencias');
    saveDataJson(data, 'secuencias');
    
    console.log(`\n${c.green}[v] ${cancionesEliminadas} canciones duplicadas eliminadas${c.reset}`);
  } else {
    console.log(`${c.dim}No se encontraron duplicados de tonos${c.reset}`);
  }
  
  return cancionesEliminadas;
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🔀 FUSIONAR ARTISTAS DUPLICADOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula similitud entre dos strings (algoritmo Levenshtein simplificado)
 */
function calcularSimilitud(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Similitud basada en palabras comunes
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matches = 0;
  words1.forEach(w1 => {
    if (words2.some(w2 => w1 === w2 || (w1.length > 3 && w2.length > 3 && (w1.includes(w2) || w2.includes(w1))))) {
      matches++;
    }
  });
  
  return matches / Math.max(words1.length, words2.length);
}

/**
 * Busca artistas duplicados con nombres similares
 */
function buscarArtistasDuplicados(umbralSimilitud = 0.7) {
  console.log(`\n${c.cyan}🔍 Buscando artistas con nombres similares...${c.reset}\n`);
  
  const data = readDataJson('secuencias');
  const duplicados = [];
  
  if (!data.artists || data.artists.length === 0) {
    console.log(`${c.dim}No hay artistas para analizar${c.reset}`);
    return [];
  }
  
  // Comparar cada par de artistas
  for (let i = 0; i < data.artists.length; i++) {
    for (let j = i + 1; j < data.artists.length; j++) {
      const artista1 = data.artists[i];
      const artista2 = data.artists[j];
      
      const similitud = calcularSimilitud(artista1.name, artista2.name);
      
      if (similitud >= umbralSimilitud) {
        // Contar canciones de cada uno
        const canciones1 = artista1.albums?.reduce((sum, a) => sum + (a.songs?.length || 0), 0) || 0;
        const canciones2 = artista2.albums?.reduce((sum, a) => sum + (a.songs?.length || 0), 0) || 0;
        
        duplicados.push({
          artista1: { index: i, ...artista1, totalCanciones: canciones1 },
          artista2: { index: j, ...artista2, totalCanciones: canciones2 },
          similitud: Math.round(similitud * 100)
        });
      }
    }
  }
  
  return duplicados;
}

/**
 * Fusiona artistas duplicados interactivamente
 */
async function fusionarArtistasDuplicados(rl) {
  console.log(`\n${c.cyan}🔀 Fusionar artistas duplicados${c.reset}\n`);
  
  const duplicados = buscarArtistasDuplicados(0.6);
  
  if (duplicados.length === 0) {
    console.log(`${c.green}✓ No se encontraron artistas duplicados!${c.reset}`);
    return 0;
  }
  
  console.log(`${c.yellow}⚠ Se encontraron ${duplicados.length} posibles duplicados:${c.reset}\n`);
  
  // Mostrar lista
  duplicados.forEach((dup, idx) => {
    console.log(`  ${c.bold}[${idx + 1}]${c.reset} ${c.cyan}${dup.artista1.name}${c.reset} (${dup.artista1.totalCanciones} canciones)`);
    console.log(`      ↔ ${c.yellow}${dup.artista2.name}${c.reset} (${dup.artista2.totalCanciones} canciones)`);
    console.log(`      ${c.dim}Similitud: ${dup.similitud}%${c.reset}\n`);
  });
  
  const respuesta = await ask(rl, `${c.cyan}¿Fusionar todos automáticamente? (s/n/numero para fusionar uno): ${c.reset}`);
  
  if (respuesta.toLowerCase() === 'n') {
    console.log(`${c.dim}Operación cancelada${c.reset}`);
    return 0;
  }
  
  createBackup('secuencias');
  const data = readDataJson('secuencias');
  let fusionados = 0;
  
  // Determinar qué duplicados fusionar
  let duplicadosAFusionar = [];
  if (respuesta.toLowerCase() === 's' || respuesta.toLowerCase() === 'si') {
    duplicadosAFusionar = duplicados;
  } else {
    const num = parseInt(respuesta);
    if (num > 0 && num <= duplicados.length) {
      duplicadosAFusionar = [duplicados[num - 1]];
    }
  }
  
  // Procesar fusiones (de mayor a menor índice para no afectar índices)
  const indicesAEliminar = new Set();
  
  duplicadosAFusionar.forEach(dup => {
    // El principal es el que tiene más canciones
    const [principal, secundario] = dup.artista1.totalCanciones >= dup.artista2.totalCanciones
      ? [dup.artista1, dup.artista2]
      : [dup.artista2, dup.artista1];
    
    console.log(`\n  ${c.green}→ Fusionando "${secundario.name}" en "${principal.name}"${c.reset}`);
    
    const artistaPrincipal = data.artists.find(a => a.id === principal.id);
    const artistaSecundario = data.artists.find(a => a.id === secundario.id);
    
    if (artistaPrincipal && artistaSecundario) {
      // Transferir álbumes
      artistaSecundario.albums?.forEach(albumSecundario => {
        // Buscar si el álbum ya existe en el principal
        let albumPrincipal = artistaPrincipal.albums.find(
          a => normalizeText(a.name) === normalizeText(albumSecundario.name)
        );
        
        if (albumPrincipal) {
          // Agregar canciones al álbum existente
          albumSecundario.songs?.forEach(song => {
            albumPrincipal.songs.push(song);
          });
          console.log(`    ${c.dim}+ ${albumSecundario.songs?.length || 0} canciones a "${albumPrincipal.name}"${c.reset}`);
        } else {
          // Agregar álbum completo
          artistaPrincipal.albums.push(albumSecundario);
          console.log(`    ${c.dim}+ Álbum "${albumSecundario.name}" (${albumSecundario.songs?.length || 0} canciones)${c.reset}`);
        }
      });
      
      // Marcar para eliminar
      indicesAEliminar.add(data.artists.indexOf(artistaSecundario));
      fusionados++;
    }
  });
  
  // Eliminar artistas fusionados (de mayor a menor)
  const indicesOrdenados = Array.from(indicesAEliminar).sort((a, b) => b - a);
  indicesOrdenados.forEach(idx => {
    if (idx >= 0) data.artists.splice(idx, 1);
  });
  
  // Actualizar stats
  data.stats = {
    totalArtists: data.artists.length,
    totalSongs: data.artists.reduce((sum, a) => sum + a.albums.reduce((s, al) => s + al.songs.length, 0), 0),
    totalCharts: data.stats?.totalCharts || 0
  };
  data.lastUpdated = new Date().toISOString();
  
  saveDataJson(data, 'secuencias');
  
  console.log(`\n${c.green}✓ ${fusionados} artistas fusionados exitosamente${c.reset}`);
  return fusionados;
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🚀 COMMIT Y DEPLOY
// ═══════════════════════════════════════════════════════════════════════════════

const { execSync } = require('child_process');

/**
 * Ejecuta comando y muestra salida
 */
function ejecutarComando(comando, opciones = {}) {
  console.log(`${c.dim}  $ ${comando}${c.reset}`);
  try {
    const resultado = execSync(comando, {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
      stdio: opciones.silencioso ? 'pipe' : 'inherit',
      ...opciones
    });
    return { exito: true, salida: resultado };
  } catch (error) {
    return { exito: false, error: error.message };
  }
}

/**
 * Hace commit de los cambios y deploy a GitHub Pages
 */
async function commitYDeploy(rl) {
  console.log(`\n${c.cyan}🚀 Commit y Deploy a GitHub Pages${c.reset}\n`);
  
  // Verificar cambios pendientes
  console.log(`${c.dim}Verificando cambios...${c.reset}`);
  const { salida: status } = ejecutarComando('git status --porcelain', { silencioso: true });
  
  if (!status || status.trim() === '') {
    console.log(`${c.yellow}⚠ No hay cambios pendientes para commit${c.reset}`);
    const soloDeplorar = await ask(rl, `${c.cyan}¿Deseas solo hacer deploy sin commit? (s/n): ${c.reset}`);
    if (soloDeplorar.toLowerCase() !== 's') {
      return false;
    }
  } else {
    // Mostrar archivos modificados
    console.log(`\n${c.bold}Archivos modificados:${c.reset}`);
    const lineas = status.trim().split('\n');
    lineas.forEach(linea => {
      const [estado, archivo] = [linea.substring(0, 2), linea.substring(3)];
      if (archivo.includes('secuencias.json') || archivo.includes('software.json')) {
        console.log(`  ${c.green}${estado}${c.reset} ${archivo}`);
      } else {
        console.log(`  ${c.dim}${estado} ${archivo}${c.reset}`);
      }
    });
    
    // Pedir mensaje de commit
    const mensajeDefault = `Actualizar datos: ${new Date().toLocaleDateString('es-ES')}`;
    console.log(`\n${c.dim}Mensaje por defecto: "${mensajeDefault}"${c.reset}`);
    const mensaje = await ask(rl, `${c.cyan}Mensaje del commit (Enter para usar default): ${c.reset}`);
    const mensajeFinal = mensaje.trim() || mensajeDefault;
    
    // Hacer commit
    console.log(`\n${c.bold}Haciendo commit...${c.reset}`);
    ejecutarComando('git add .');
    const commitResult = ejecutarComando(`git commit -m "${mensajeFinal}"`);
    
    if (!commitResult.exito) {
      console.log(`${c.red}❌ Error en commit${c.reset}`);
      return false;
    }
    console.log(`${c.green}✓ Commit realizado${c.reset}`);
    
    // Push
    console.log(`\n${c.bold}Subiendo a GitHub...${c.reset}`);
    const pushResult = ejecutarComando('git push');
    
    if (!pushResult.exito) {
      console.log(`${c.red}❌ Error en push${c.reset}`);
      return false;
    }
    console.log(`${c.green}✓ Push realizado${c.reset}`);
  }
  
  // Preguntar si hacer deploy
  const hacerDeploy = await ask(rl, `\n${c.cyan}¿Hacer deploy a GitHub Pages? (s/n): ${c.reset}`);
  
  if (hacerDeploy.toLowerCase() === 's' || hacerDeploy.toLowerCase() === 'si') {
    console.log(`\n${c.bold}Construyendo y desplegando...${c.reset}`);
    console.log(`${c.dim}Esto puede tardar unos segundos...${c.reset}\n`);
    
    const deployResult = ejecutarComando('npm run deploy');
    
    if (deployResult.exito) {
      console.log(`\n${c.green}✓ Deploy completado exitosamente!${c.reset}`);
      console.log(`${c.dim}  Los cambios estarán visibles en unos minutos en GitHub Pages${c.reset}`);
    } else {
      console.log(`${c.red}❌ Error en deploy${c.reset}`);
      return false;
    }
  }
  
  return true;
}

// ===============================================================================
//   MENU PRINCIPAL
// ===============================================================================

async function showMainMenu() {
  const rl = createReadline();
  
  while (true) {
    clearScreen();
    showBanner();
    
    const secuenciasData = readDataJson('secuencias');
    const softwareData = readDataJson('software');
    
    console.log(`${c.dim}  Secuencias: ${secuenciasData.stats?.totalArtists || 0} artistas | ${secuenciasData.stats?.totalSongs || 0} secuencias | ${secuenciasData.stats?.totalCharts || 0} charts${c.reset}`);
    console.log(`${c.dim}  Software: ${softwareData.categories?.length || 0} categorias | ${softwareData.categories?.reduce((s, c) => s + (c.items?.length || 0), 0) || 0} items${c.reset}`);
    console.log(`${c.dim}  Ultima actualizacion: ${formatDate(secuenciasData.lastUpdated)}${c.reset}\n`);
    
    // Contar aportes pendientes
    ensureAportesDirectories();
    const aportesSeq = fs.readdirSync(CONFIG.APORTES_SECUENCIAS_DIR).filter(f => f.startsWith('aporte_') && f.endsWith('.xlsx')).length;
    const aportesSw = fs.readdirSync(CONFIG.APORTES_SOFTWARE_DIR).filter(f => f.startsWith('aporte_') && f.endsWith('.xlsx')).length;
    
    if (aportesSeq > 0 || aportesSw > 0) {
      console.log(`${c.yellow}  [!] Aportes pendientes: ${aportesSeq} secuencias | ${aportesSw} software${c.reset}\n`);
    }
    
    console.log(`${c.bold}  Que deseas hacer?${c.reset}

  ${c.magenta}--- DATOS (JSON <-> XLSX) ---${c.reset}
  ${c.cyan} 1.${c.reset} [>] Exportar JSONs a Excel (secuencias + software)
  ${c.cyan} 2.${c.reset} [<] Importar cambios desde Excel

  ${c.magenta}--- APORTES DE SECUENCIAS ---${c.reset}
  ${c.cyan} 3.${c.reset} [+] Agregar aporte(s) de secuencia
  ${c.cyan} 4.${c.reset} [=] Combinar aportes (crear archivo madre)
  ${c.cyan} 5.${c.reset} [?] Revisar aportes (ver duplicados)
  ${c.cyan} 6.${c.reset} [v] Aprobar y transferir al JSON
  ${c.cyan} 7.${c.reset} [x] Limpiar aportes procesados

  ${c.magenta}--- APORTES DE SOFTWARE ---${c.reset}
  ${c.cyan} 8.${c.reset} [+] Agregar aporte(s) de software
  ${c.cyan} 9.${c.reset} [=] Combinar aportes (crear archivo madre)
  ${c.cyan}10.${c.reset} [?] Revisar aportes (ver duplicados)
  ${c.cyan}11.${c.reset} [v] Aprobar y transferir al JSON
  ${c.cyan}12.${c.reset} [x] Limpiar aportes procesados

  ${c.magenta}--- UTILIDADES ---${c.reset}
  ${c.cyan}13.${c.reset} [#] Limpiar numeracion de nombres
  ${c.cyan}14.${c.reset} [~] Sincronizar estadisticas
  ${c.cyan}15.${c.reset} [!] Validar integridad de datos
  ${c.cyan}16.${c.reset} [*] Buscar duplicados (solo ver)
  ${c.cyan}17.${c.reset} [S] Crear backup manual
  ${c.cyan}18.${c.reset} [X] Eliminar albumes vacios
  ${c.cyan}19.${c.reset} [D] Eliminar duplicados de tonos
  ${c.cyan}20.${c.reset} [M] Fusionar artistas duplicados

  ${c.magenta}--- PUBLICAR ---${c.reset}
  ${c.cyan}21.${c.reset} [G] Commit y Deploy a GitHub Pages

  ${c.cyan} 0.${c.reset} [0] Salir
`);
    
    const answer = await ask(rl, `${c.cyan}Selecciona una opción: ${c.reset}`);
    
    switch (answer) {
      // === DATOS (JSON ↔ XLSX) ===
      case '1':
        exportToExcel();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '2':
        importFromExcel();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      
      // === APORTES SECUENCIAS ===
      case '3':
        await agregarAporteSecuencia(rl);
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '4':
        combinarAportes('secuencias');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '5':
        revisarAportes('secuencias');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '6':
        await aprobarAportes(rl, 'secuencias');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '7':
        limpiarAportes('secuencias');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      
      // === APORTES SOFTWARE ===
      case '8':
        await agregarAporteSoftware(rl);
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '9':
        combinarAportes('software');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '10':
        revisarAportes('software');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '11':
        await aprobarAportes(rl, 'software');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '12':
        limpiarAportes('software');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      
      // === UTILIDADES ===
      case '13':
        limpiarNumeracionNombres();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '14':
        sincronizarStats();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '15':
        validarIntegridad();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '16':
        findDuplicates();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '17':
        createBackup('secuencias');
        createBackup('software');
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '18':
        eliminarAlbumesVacios();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '19':
        eliminarDuplicadosTonos();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '20':
        await fusionarArtistasDuplicados(rl);
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '21':
        await commitYDeploy(rl);
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '0':
        console.log(`\n${c.cyan}Hasta luego!${c.reset}\n`);
        rl.close();
        process.exit(0);
        
      default:
        console.log(`\n${c.red}Opcion no valida${c.reset}`);
        await ask(rl, `${c.dim}Presiona Enter para continuar...${c.reset}`);
    }
  }
}

// ===============================================================================
//   PUNTO DE ENTRADA
// ===============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--export')) {
    showBanner();
    exportToExcel();
  } else if (args.includes('--import')) {
    showBanner();
    importFromExcel();
  } else if (args.includes('--add-fields')) {
    showBanner();
    addNewFieldsToData();
  } else if (args.includes('--link-charts')) {
    showBanner();
    linkChartsToSongs();
  } else if (args.includes('--cleanup-charts')) {
    showBanner();
    cleanupCharts();
  } else if (args.includes('--cleanup-duplicates')) {
    showBanner();
    cleanupDuplicates();
  } else if (args.includes('--extract-metadata')) {
    showBanner();
    extractMetadata();
  } else if (args.includes('--find-duplicates')) {
    showBanner();
    findDuplicates();
  // === FUNCIONES DE APORTES ===
  } else if (args.includes('--combinar-aportes-seq')) {
    showBanner();
    combinarAportes('secuencias');
  } else if (args.includes('--combinar-aportes-sw')) {
    showBanner();
    combinarAportes('software');
  } else if (args.includes('--revisar-aportes-seq')) {
    showBanner();
    revisarAportes('secuencias');
  } else if (args.includes('--revisar-aportes-sw')) {
    showBanner();
    revisarAportes('software');
  } else if (args.includes('--limpiar-aportes-seq')) {
    showBanner();
    limpiarAportes('secuencias');
  } else if (args.includes('--limpiar-aportes-sw')) {
    showBanner();
    limpiarAportes('software');
  // === UTILIDADES ===
  } else if (args.includes('--limpiar-numeracion')) {
    showBanner();
    limpiarNumeracionNombres();
  } else if (args.includes('--sync-stats')) {
    showBanner();
    sincronizarStats();
  } else if (args.includes('--validar')) {
    showBanner();
    validarIntegridad();
  } else if (args.includes('--eliminar-vacios')) {
    showBanner();
    eliminarAlbumesVacios();
  } else if (args.includes('--eliminar-duplicados-tonos')) {
    showBanner();
    eliminarDuplicadosTonos();
  } else if (args.includes('--fusionar-artistas')) {
    showBanner();
    const rl = createReadline();
    await fusionarArtistasDuplicados(rl);
    rl.close();
  } else if (args.includes('--deploy')) {
    showBanner();
    const rl = createReadline();
    await commitYDeploy(rl);
    rl.close();
  } else if (args.includes('--help')) {
    showBanner();
    console.log(`
${c.bold}USO:${c.reset}
  node tools/data-manager.cjs                       Menu interactivo
  
${c.bold}DATOS (JSON <-> XLSX):${c.reset}
  node tools/data-manager.cjs --export              Exportar a Excel
  node tools/data-manager.cjs --import              Importar desde Excel
  
${c.bold}APORTES:${c.reset}
  node tools/data-manager.cjs --combinar-aportes-seq   Combinar aportes de secuencias
  node tools/data-manager.cjs --combinar-aportes-sw    Combinar aportes de software
  node tools/data-manager.cjs --revisar-aportes-seq    Revisar aportes de secuencias
  node tools/data-manager.cjs --revisar-aportes-sw     Revisar aportes de software
  node tools/data-manager.cjs --limpiar-aportes-seq    Limpiar aportes de secuencias
  node tools/data-manager.cjs --limpiar-aportes-sw     Limpiar aportes de software
  
${c.bold}UTILIDADES:${c.reset}
  node tools/data-manager.cjs --limpiar-numeracion     Limpiar numeracion de nombres
  node tools/data-manager.cjs --sync-stats             Sincronizar estadisticas
  node tools/data-manager.cjs --validar                Validar integridad de datos
  node tools/data-manager.cjs --find-duplicates        Buscar duplicados (solo ver)
  node tools/data-manager.cjs --eliminar-vacios        Eliminar albumes vacios
  node tools/data-manager.cjs --eliminar-duplicados-tonos  Eliminar duplicados de tonos
  node tools/data-manager.cjs --fusionar-artistas       Fusionar artistas duplicados
  node tools/data-manager.cjs --deploy                  Commit y deploy a GitHub Pages
`);
  } else {
    await showMainMenu();
  }
}

main().catch(console.error);
