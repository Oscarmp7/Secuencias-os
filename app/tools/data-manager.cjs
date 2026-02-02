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
 * 1. Exportar data.json a Excel (XLSX)
 * 2. Importar cambios desde Excel a data.json
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
 * npm install xlsx (ejecutar en la carpeta app)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════════════════════
//   ⚙️ CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  DATA_FILE: path.join(__dirname, '..', 'src', 'data.json'),
  EXCEL_FILE: path.join(__dirname, '..', 'data', 'worship-box-data.xlsx'),
  BACKUP_DIR: path.join(__dirname, '..', 'backups'),
  
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
  cyan: '\x1b[36m',
  white: '\x1b[37m',
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
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ${c.white}📊 WORSHIP BOX - GESTOR DE DATOS${c.cyan}                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}
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
 * Lee el archivo data.json
 */
function readDataJson() {
  const content = fs.readFileSync(CONFIG.DATA_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Guarda el archivo data.json
 */
function saveDataJson(data) {
  fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Crea un backup del data.json
 */
function createBackup() {
  if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
    fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(CONFIG.BACKUP_DIR, `data-backup-${timestamp}.json`);
  
  fs.copyFileSync(CONFIG.DATA_FILE, backupFile);
  console.log(`${c.green}✓ Backup creado: ${backupFile}${c.reset}`);
  
  return backupFile;
}

/**
 * Verifica si xlsx está instalado
 */
function checkXlsxInstalled() {
  try {
    require.resolve('xlsx');
    return true;
  } catch (e) {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🔧 AGREGAR CAMPOS NUEVOS AL DATA.JSON
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Agrega los campos nuevos a todas las canciones y charts
 */
function addNewFieldsToData() {
  console.log(`\n${c.cyan}📝 Agregando campos nuevos al data.json...${c.reset}\n`);
  
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
 * Exporta el data.json a un archivo Excel con estilos
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
  
  console.log(`\n${c.cyan}📤 Exportando data.json a Excel...${c.reset}\n`);
  
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
  // HOJA 1: SECUENCIAS (canciones) - TODAS LAS COLUMNAS DE DATA.JSON
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
    ['   DriveID        →  ID único del archivo en Google Drive (OBLIGATORIO)'],
    ['   LinkDescarga   →  URL de descarga directa (se genera automático si vacío)'],
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
    ['   3. CAMPOS OBLIGATORIOS:'],
    ['      • Artista     - Nombre del artista (usa exacto si ya existe)'],
    ['      • Album       - Nombre del álbum (usa exacto si ya existe)'],
    ['      • Cancion     - Nombre de la canción'],
    ['      • DriveID     - ID del archivo en Google Drive'],
    [''],
    ['   4. CAMPOS OPCIONALES (recomendados):'],
    ['      • NombreArchivo  - Nombre completo con extensión'],
    ['      • Tipo           - "sequence" (por defecto)'],
    ['      • LinkDescarga   - Se genera automático si lo dejas vacío'],
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
    ['   3. Pon "Agregar" en Accion (reemplazará la existente por DriveID)'],
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
    ['   • NO modifiques CancionID ni DriveID de registros existentes'],
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
  const excelDir = path.dirname(CONFIG.EXCEL_FILE);
  if (!fs.existsSync(excelDir)) {
    fs.mkdirSync(excelDir, { recursive: true });
  }
  
  // Guardar
  XLSX.writeFile(workbook, CONFIG.EXCEL_FILE);
  
  // Estadísticas
  const songsWithChartsCount = songsData.filter(r => r[1] === '✓').length;
  const songsWithoutCharts = songsData.length - songsWithChartsCount;
  const linkedCharts = chartsData.filter(r => r[1] === '✓').length;
  const unlinkedCharts = chartsData.length - linkedCharts;
  
  console.log(`${c.green}✓ Excel exportado exitosamente!${c.reset}`);
  console.log(`  • Archivo: ${CONFIG.EXCEL_FILE}`);
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
  console.log(`\n${c.yellow}📝 Abre el archivo en Excel para editarlo${c.reset}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//   📥 IMPORTAR DESDE EXCEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Importa cambios desde el Excel al data.json
 */
function importFromExcel() {
  if (!checkXlsxInstalled()) {
    console.log(`\n${c.red}❌ Error: El paquete 'xlsx' no está instalado.${c.reset}`);
    console.log(`${c.yellow}   Ejecuta: npm install xlsx${c.reset}\n`);
    return;
  }
  
  if (!fs.existsSync(CONFIG.EXCEL_FILE)) {
    console.log(`\n${c.red}❌ Error: No se encontró el archivo Excel.${c.reset}`);
    console.log(`${c.yellow}   Primero ejecuta --export para generar el archivo.${c.reset}\n`);
    return;
  }
  
  const XLSX = require('xlsx');
  
  console.log(`\n${c.cyan}📥 Importando cambios desde Excel...${c.reset}\n`);
  
  // Crear backup antes de modificar
  createBackup();
  
  const workbook = XLSX.readFile(CONFIG.EXCEL_FILE);
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
  showImportReport(report);
}

/**
 * Agrega una canción al data.json
 */
function addSong(data, row, report) {
  const artistName = (row['Artista'] || '').trim();
  const albumName = (row['Album'] || '').trim();
  const songName = (row['Cancion'] || '').trim();
  const driveId = (row['DriveID'] || '').trim();
  
  if (!artistName || !albumName || !songName || !driveId) {
    throw new Error('Faltan campos obligatorios (Artista, Album, Cancion, DriveID)');
  }
  
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
    s.driveId === driveId || normalizeText(s.name) === normalizeText(songName)
  );
  
  if (existingSong) {
    throw new Error(`La canción "${songName}" ya existe en este álbum`);
  }
  
  // Crear la canción
  const newSong = {
    id: row['CancionID'] || driveId,
    name: songName,
    fullName: row['NombreArchivo'] || `${songName}.zip`,
    type: row['Tipo'] || 'sequence',
    driveId: driveId,
    downloadUrl: row['LinkDescarga'] || `https://drive.google.com/uc?export=download&id=${driveId}`,
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
 * Elimina una canción del data.json
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
 * Agrega un chart al data.json
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
 * Elimina un chart del data.json
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
 * Actualiza las estadísticas del data.json
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
 */
function showImportReport(report) {
  console.log(`\n${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.cyan}${c.bold}                    📊 REPORTE DE IMPORTACIÓN                   ${c.reset}`);
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
//   �🎛️ MENÚ PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

async function showMainMenu() {
  const rl = createReadline();
  
  while (true) {
    clearScreen();
    showBanner();
    
    const data = readDataJson();
    console.log(`${c.dim}  Biblioteca: ${data.stats.totalArtists} artistas | ${data.stats.totalSongs} secuencias | ${data.stats.totalCharts} charts${c.reset}`);
    console.log(`${c.dim}  Última actualización: ${formatDate(data.lastUpdated)}${c.reset}\n`);
    
    console.log(`${c.bold}  ¿Qué deseas hacer?${c.reset}
    
  ${c.cyan}1.${c.reset} 📤 Exportar data.json a Excel
  ${c.cyan}2.${c.reset} 📥 Importar cambios desde Excel
  ${c.cyan}3.${c.reset} 📝 Agregar campos nuevos al data.json
  ${c.cyan}4.${c.reset} 🔗 Enlazar charts con canciones
  ${c.cyan}5.${c.reset} 🗜️  Simplificar charts (1 por secuencia)
  ${c.cyan}6.${c.reset} 🧹 Limpiar duplicados y covers
  ${c.cyan}7.${c.reset} 🎵 Extraer metadatos (BPM, tonalidad)
  ${c.cyan}8.${c.reset} 🔍 Buscar duplicados (solo ver)
  ${c.cyan}9.${c.reset} 💾 Crear backup manual
  
  ${c.cyan}0.${c.reset} 🚪 Salir
`);
    
    const answer = await ask(rl, `${c.cyan}Selecciona una opción: ${c.reset}`);
    
    switch (answer) {
      case '1':
        exportToExcel();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '2':
        importFromExcel();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '3':
        addNewFieldsToData();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '4':
        linkChartsToSongs();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '5':
        cleanupCharts();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '6':
        cleanupDuplicates();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '7':
        extractMetadata();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '8':
        findDuplicates();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '9':
        createBackup();
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
        
      case '0':
        console.log(`\n${c.cyan}👋 ¡Hasta luego!${c.reset}\n`);
        rl.close();
        process.exit(0);
        
      default:
        console.log(`\n${c.red}Opción no válida${c.reset}`);
        await ask(rl, `${c.dim}Presiona Enter para continuar...${c.reset}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🚀 PUNTO DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════════════

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
  } else if (args.includes('--help')) {
    showBanner();
    console.log(`
${c.bold}USO:${c.reset}
  node tools/data-manager.cjs                       Menú interactivo
  node tools/data-manager.cjs --export              Exportar a Excel
  node tools/data-manager.cjs --import              Importar desde Excel
  node tools/data-manager.cjs --add-fields          Agregar campos nuevos al JSON
  node tools/data-manager.cjs --link-charts         Enlazar charts con canciones
  node tools/data-manager.cjs --cleanup-charts      Simplificar charts (1 por secuencia)
  node tools/data-manager.cjs --cleanup-duplicates  Limpiar duplicados y covers
  node tools/data-manager.cjs --extract-metadata    Extraer BPM/tonalidad de nombres
  node tools/data-manager.cjs --find-duplicates     Buscar duplicados (solo ver)
  node tools/data-manager.cjs --help                Mostrar esta ayuda
`);
  } else {
    await showMainMenu();
  }
}

main().catch(console.error);
