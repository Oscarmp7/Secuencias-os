/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   🔗 WORSHIP BOX - HERRAMIENTA DE GESTION DE ENLACES                        ║
 * ║                                                                               ║
 * ║   Herramienta completa para verificar, analizar y mantener los enlaces        ║
 * ║   de Google Drive en tu biblioteca de secuencias.                             ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 *   📖 GUÍA DE USO COMPLETA
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 *   REQUISITOS PREVIOS:
 *   -------------------
 *   1. Tener Node.js instalado (v14 o superior)
 *   2. Estar en la carpeta "app" del proyecto
 *   3. Tener el archivo src/data/secuencias.json con los datos
 * 
 * 
 *   MODO INTERACTIVO (Recomendado para principiantes):
 *   --------------------------------------------------
 *   Simplemente ejecuta sin argumentos y aparecerá un menú:
 * 
 *      node check-links.cjs
 * 
 *   El menú te mostrará todas las opciones disponibles y solo tienes que
 *   escribir el número de la opción que quieras usar.
 * 
 * 
 *   MODO LÍNEA DE COMANDOS (Para usuarios avanzados):
 *   -------------------------------------------------
 * 
 *   1. VERIFICAR ENLACES:
 *      
 *      node check-links.cjs --check              → Verifica 50 enlaces aleatorios
 *      node check-links.cjs --check --sample 100 → Verifica 100 enlaces aleatorios
 *      node check-links.cjs --check --full       → Verifica TODOS (¡toma ~20 min!)
 * 
 *   2. BUSCAR DUPLICADOS:
 *      
 *      node check-links.cjs --duplicates         → Muestra todos los enlaces duplicados
 * 
 *   3. VER ESTADÍSTICAS:
 *      
 *      node check-links.cjs --stats              → Muestra estadísticas de la biblioteca
 * 
 *   4. VER HISTORIAL:
 *      
 *      node check-links.cjs --history            → Muestra historial de verificaciones
 * 
 *   5. GESTIONAR ENLACES MUERTOS:
 *      
 *      node check-links.cjs --manage-dead        → Menú para gestionar enlaces muertos
 * 
 *   6. ENVIAR REPORTE POR EMAIL:
 *      
 *      node check-links.cjs --email              → Envía reporte a tu Gmail
 *      (Requiere configurar EMAIL_USER y EMAIL_PASS primero)
 * 
 *   7. VERIFICACIÓN PROGRAMADA (cada semana):
 *      
 *      node check-links.cjs --scheduled          → Inicia verificación automática semanal
 *      (El programa debe quedar corriendo en segundo plano)
 * 
 * 
 *   ARCHIVOS QUE GENERA ESTE PROGRAMA:
 *   ----------------------------------
 *   
 *   📄 dead-links.json      → Lista de enlaces muertos encontrados
 *   📄 check-history.json   → Historial de todas las verificaciones
 *   📄 duplicates.json      → Lista de enlaces duplicados
 *   📄 .email-config.json   → Configuración de email (¡NO subir a GitHub!)
 * 
 * 
 *   CONFIGURAR EMAIL PARA REPORTES:
 *   -------------------------------
 *   
 *   1. Ve a tu cuenta de Google: https://myaccount.google.com/apppasswords
 *   2. Genera una "Contraseña de aplicación" para "Correo"
 *   3. Ejecuta: node check-links.cjs --setup-email
 *   4. Ingresa tu Gmail y la contraseña de aplicación generada
 *   
 *   NOTA: Nunca uses tu contraseña real de Gmail, siempre usa App Passwords.
 * 
 * 
 *   EJEMPLOS DE USO COMÚN:
 *   ----------------------
 *   
 *   # Verificación rápida antes de hacer deploy
 *   node check-links.cjs --check --sample 100
 *   
 *   # Verificación completa mensual
 *   node check-links.cjs --check --full --email
 *   
 *   # Limpiar duplicados antes de agregar más contenido
 *   node check-links.cjs --duplicates
 *   
 *   # Ver el estado general de la biblioteca
 *   node check-links.cjs --stats
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 *   🔧 CONFIGURACIÓN AVANZADA
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 *   Puedes modificar estas constantes al inicio del código:
 *   
 *   - CONCURRENT_REQUESTS: Peticiones simultáneas (default: 10)
 *   - TIMEOUT_MS: Tiempo de espera por enlace (default: 10000ms)
 *   - DEFAULT_SAMPLE_SIZE: Muestra por defecto (default: 50)
 *   - SCHEDULED_DAY: Día de verificación semanal (default: 0 = Domingo)
 *   - SCHEDULED_HOUR: Hora de verificación (default: 8:00 AM)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const https = require('https');
const path = require('path');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════════════════════
//   ⚙️ CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Archivos
  DATA_FILE: path.join(__dirname, 'src', 'data', 'secuencias.json'),
  DEAD_LINKS_FILE: path.join(__dirname, 'dead-links.json'),
  HISTORY_FILE: path.join(__dirname, 'check-history.json'),
  DUPLICATES_FILE: path.join(__dirname, 'duplicates.json'),
  EMAIL_CONFIG_FILE: path.join(__dirname, '.email-config.json'),
  
  // Verificación
  CONCURRENT_REQUESTS: 10,      // Peticiones simultáneas
  TIMEOUT_MS: 10000,            // Timeout en milisegundos
  DEFAULT_SAMPLE_SIZE: 50,      // Muestra por defecto
  
  // Programación semanal
  SCHEDULED_DAY: 0,             // 0=Domingo, 1=Lunes, ..., 6=Sábado
  SCHEDULED_HOUR: 8,            // Hora (0-23)
};

// ═══════════════════════════════════════════════════════════════════════════════
//   🎨 COLORES Y ESTILOS PARA CONSOLA
// ═══════════════════════════════════════════════════════════════════════════════

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colores
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Fondos
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// ═══════════════════════════════════════════════════════════════════════════════
//   📚 UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Crea una interfaz de lectura para input del usuario
 */
function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Pregunta algo al usuario y espera respuesta
 */
function ask(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

/**
 * Pausa la ejecución por X milisegundos
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formatea una fecha de forma legible
 */
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
 * Lee el archivo secuencias.json y lo parsea
 */
function readDataJson() {
  const content = fs.readFileSync(CONFIG.DATA_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Guarda secuencias.json
 */
function saveDataJson(data) {
  fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Limpia la pantalla
 */
function clearScreen() {
  console.clear();
}

/**
 * Muestra el banner del programa
 */
function showBanner() {
  console.log(`
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ${c.white}🔗 WORSHIP BOX - HERRAMIENTA DE GESTION${c.cyan}                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🔍 EXTRACCIÓN Y ANÁLISIS DE DATOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extrae todos los enlaces de Drive con información de contexto
 * Retorna: [{ id, url, artist, album, song, type }]
 */
function extractAllLinks() {
  const data = readDataJson();
  const links = [];
  
  // Extraer de artistas/álbumes/canciones (secuencias)
  if (data.artists) {
    data.artists.forEach(artist => {
      if (artist.albums) {
        artist.albums.forEach(album => {
          if (album.songs) {
            album.songs.forEach(song => {
              // Soportar tanto 'url' como 'downloadUrl' y 'driveId'
              const url = song.downloadUrl || song.url;
              const driveId = song.driveId || song.id;
              
              if (driveId) {
                links.push({
                  id: driveId,
                  url: url || `https://drive.google.com/uc?export=download&id=${driveId}`,
                  artist: artist.name,
                  album: album.name,
                  song: song.name,
                  type: 'secuencia'
                });
              } else if (url) {
                const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
                if (idMatch) {
                  links.push({
                    id: idMatch[1],
                    url: url,
                    artist: artist.name,
                    album: album.name,
                    song: song.name,
                    type: 'secuencia'
                  });
                }
              }
            });
          }
        });
      }
    });
  }
  
  // Extraer de charts
  if (data.charts) {
    data.charts.forEach(chartArtist => {
      if (chartArtist.charts) {
        chartArtist.charts.forEach(chart => {
          // Soportar tanto 'url' como 'downloadUrl' y 'driveId'
          const url = chart.downloadUrl || chart.url;
          const driveId = chart.driveId || chart.id;
          
          if (driveId) {
            links.push({
              id: driveId,
              url: url || `https://drive.google.com/uc?export=download&id=${driveId}`,
              artist: chartArtist.name,
              album: null,
              song: chart.name,
              type: 'chart'
            });
          } else if (url) {
            const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
            if (idMatch) {
              links.push({
                id: idMatch[1],
                url: url,
                artist: chartArtist.name,
                album: null,
                song: chart.name,
                type: 'chart'
              });
            }
          }
        });
      }
    });
  }
  
  return links;
}

/**
 * Extrae solo los IDs únicos
 */
function extractUniqueIds() {
  const links = extractAllLinks();
  const uniqueIds = [...new Set(links.map(l => l.id))];
  return uniqueIds;
}

/**
 * Encuentra enlaces duplicados
 */
function findDuplicates() {
  const links = extractAllLinks();
  const idCounts = {};
  
  // Contar ocurrencias de cada ID
  links.forEach(link => {
    if (!idCounts[link.id]) {
      idCounts[link.id] = [];
    }
    idCounts[link.id].push(link);
  });
  
  // Filtrar solo los que tienen más de una ocurrencia
  const duplicates = {};
  Object.entries(idCounts).forEach(([id, occurrences]) => {
    if (occurrences.length > 1) {
      duplicates[id] = occurrences;
    }
  });
  
  return duplicates;
}

/**
 * Calcula estadísticas de la biblioteca
 */
function calculateStats() {
  const data = readDataJson();
  const links = extractAllLinks();
  const uniqueIds = extractUniqueIds();
  
  const stats = {
    // Contadores generales
    totalArtists: data.artists?.length || 0,
    totalAlbums: 0,
    totalSongs: 0,
    totalChartArtists: data.charts?.length || 0,
    totalCharts: 0,
    
    // Enlaces
    totalLinks: links.length,
    uniqueLinks: uniqueIds.length,
    duplicateLinks: links.length - uniqueIds.length,
    
    // Por tipo
    sequenceLinks: links.filter(l => l.type === 'secuencia').length,
    chartLinks: links.filter(l => l.type === 'chart').length,
    
    // Top artistas por cantidad de canciones
    topArtists: []
  };
  
  // Contar álbumes y canciones
  const artistSongCount = {};
  if (data.artists) {
    data.artists.forEach(artist => {
      let songCount = 0;
      if (artist.albums) {
        stats.totalAlbums += artist.albums.length;
        artist.albums.forEach(album => {
          if (album.songs) {
            stats.totalSongs += album.songs.length;
            songCount += album.songs.length;
          }
        });
      }
      artistSongCount[artist.name] = songCount;
    });
  }
  
  // Contar charts
  if (data.charts) {
    data.charts.forEach(chartArtist => {
      if (chartArtist.charts) {
        stats.totalCharts += chartArtist.charts.length;
      }
    });
  }
  
  // Top 10 artistas
  stats.topArtists = Object.entries(artistSongCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  
  return stats;
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🌐 VERIFICACIÓN DE ENLACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si un enlace de Drive está activo
 */
function checkLink(id) {
  return new Promise((resolve) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    
    const req = https.request(url, { method: 'HEAD', timeout: CONFIG.TIMEOUT_MS }, (res) => {
      const isAlive = res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 303;
      resolve({ id, alive: isAlive, status: res.statusCode });
    });
    
    req.on('error', () => resolve({ id, alive: false, status: 'ERROR' }));
    req.on('timeout', () => { req.destroy(); resolve({ id, alive: false, status: 'TIMEOUT' }); });
    req.end();
  });
}

/**
 * Verifica múltiples enlaces en lotes
 */
async function checkLinksInBatches(ids, showProgress = true) {
  const allLinks = extractAllLinks();
  const results = { alive: 0, dead: 0, deadLinks: [] };
  const total = ids.length;
  
  for (let i = 0; i < ids.length; i += CONFIG.CONCURRENT_REQUESTS) {
    const batch = ids.slice(i, i + CONFIG.CONCURRENT_REQUESTS);
    const batchResults = await Promise.all(batch.map(checkLink));
    
    batchResults.forEach(result => {
      if (result.alive) {
        results.alive++;
      } else {
        results.dead++;
        // Encontrar info del enlace
        const linkInfo = allLinks.find(l => l.id === result.id) || { id: result.id };
        results.deadLinks.push({ ...linkInfo, status: result.status });
      }
    });
    
    if (showProgress) {
      const progress = Math.min(i + CONFIG.CONCURRENT_REQUESTS, total);
      const percent = ((progress / total) * 100).toFixed(1);
      process.stdout.write(`\r${c.yellow}⏳ Progreso: ${progress}/${total} (${percent}%)${c.reset}   `);
    }
  }
  
  if (showProgress) console.log('\n');
  return results;
}

/**
 * Guarda resultados en el historial
 */
function saveToHistory(results, sampleSize, isFullScan) {
  let history = [];
  
  if (fs.existsSync(CONFIG.HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf-8'));
    } catch (e) {
      history = [];
    }
  }
  
  history.push({
    date: new Date().toISOString(),
    type: isFullScan ? 'full' : 'sample',
    sampleSize: sampleSize,
    alive: results.alive,
    dead: results.dead,
    healthPercent: ((results.alive / (results.alive + results.dead)) * 100).toFixed(1),
    deadLinks: results.deadLinks.map(l => l.id)
  });
  
  // Mantener solo últimos 50 registros
  if (history.length > 50) {
    history = history.slice(-50);
  }
  
  fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Guarda enlaces muertos
 */
function saveDeadLinks(deadLinks) {
  const data = {
    lastUpdate: new Date().toISOString(),
    count: deadLinks.length,
    links: deadLinks
  };
  fs.writeFileSync(CONFIG.DEAD_LINKS_FILE, JSON.stringify(data, null, 2));
}

// ═══════════════════════════════════════════════════════════════════════════════
//   📧 SISTEMA DE EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Carga configuración de email
 */
function loadEmailConfig() {
  if (fs.existsSync(CONFIG.EMAIL_CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.EMAIL_CONFIG_FILE, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Guarda configuración de email
 */
function saveEmailConfig(config) {
  fs.writeFileSync(CONFIG.EMAIL_CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`\n${c.yellow}⚠️  Importante: Agrega .email-config.json a tu .gitignore${c.reset}`);
}

/**
 * Envía email con nodemailer (si está disponible) o muestra instrucciones
 */
async function sendEmailReport(results, stats) {
  const emailConfig = loadEmailConfig();
  
  if (!emailConfig) {
    console.log(`\n${c.red}❌ Email no configurado.${c.reset}`);
    console.log(`${c.yellow}   Ejecuta: node check-links.cjs --setup-email${c.reset}\n`);
    return false;
  }
  
  // Verificar si nodemailer está instalado
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (e) {
    console.log(`\n${c.yellow}📦 Instalando nodemailer para envío de emails...${c.reset}`);
    const { execSync } = require('child_process');
    try {
      execSync('npm install nodemailer', { cwd: __dirname, stdio: 'inherit' });
      nodemailer = require('nodemailer');
    } catch (installError) {
      console.log(`\n${c.red}❌ No se pudo instalar nodemailer.${c.reset}`);
      console.log(`   Ejecuta manualmente: npm install nodemailer\n`);
      return false;
    }
  }
  
  // Crear transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailConfig.email,
      pass: emailConfig.password
    }
  });
  
  // Crear HTML del reporte
  const healthPercent = ((results.alive / (results.alive + results.dead)) * 100).toFixed(1);
  const healthColor = healthPercent > 95 ? '#22c55e' : healthPercent > 80 ? '#eab308' : '#ef4444';
  
  const deadLinksHtml = results.deadLinks.length > 0
    ? results.deadLinks.map(l => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${l.artist || 'Desconocido'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${l.song || l.id}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${l.type || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #ef4444;">${l.status}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #22c55e;">🎉 ¡No hay enlaces muertos!</td></tr>';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f9fafb; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #1f2937; }
        .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
        .health-card { background: ${healthColor}15; border-left: 4px solid ${healthColor}; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .health-value { font-size: 48px; font-weight: bold; color: ${healthColor}; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f9fafb; padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔗 Reporte Worship Box</h1>
          <p>${formatDate(new Date())}</p>
        </div>
        
        <div class="content">
          <div class="health-card">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Salud de la Biblioteca</div>
                <div class="health-value">${healthPercent}%</div>
              </div>
              <div style="font-size: 64px;">${healthPercent > 95 ? '💚' : healthPercent > 80 ? '💛' : '❤️'}</div>
            </div>
          </div>
          
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value" style="color: #22c55e;">${results.alive}</div>
              <div class="stat-label">Enlaces Vivos</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #ef4444;">${results.dead}</div>
              <div class="stat-label">Enlaces Muertos</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalArtists}</div>
              <div class="stat-label">Artistas</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalSongs + stats.totalCharts}</div>
              <div class="stat-label">Secuencias + Charts</div>
            </div>
          </div>
          
          <h3 style="color: #1f2937; margin-bottom: 15px;">📋 Enlaces Muertos</h3>
          <table>
            <thead>
              <tr>
                <th>Artista</th>
                <th>Canción</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${deadLinksHtml}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Generado automáticamente por Worship Box</p>
          <p>Este reporte se envía semanalmente</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    await transporter.sendMail({
      from: emailConfig.email,
      to: emailConfig.email,
      subject: `🔗 Worship Box - Reporte de Salud: ${healthPercent}%`,
      html: html
    });
    
    console.log(`\n${c.green}✅ Email enviado exitosamente a ${emailConfig.email}${c.reset}\n`);
    return true;
  } catch (error) {
    console.log(`\n${c.red}❌ Error enviando email: ${error.message}${c.reset}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//   📊 FUNCIONES DE VISUALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Muestra estadísticas de la biblioteca
 */
function showStats() {
  const stats = calculateStats();
  
  console.log(`
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║                    📊 ESTADÍSTICAS                            ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}

${c.bold}SECUENCIAS:${c.reset}
  ${c.blue}►${c.reset} Artistas:        ${c.bold}${stats.totalArtists}${c.reset}
  ${c.blue}►${c.reset} Álbumes:         ${c.bold}${stats.totalAlbums}${c.reset}
  ${c.blue}►${c.reset} Canciones:       ${c.bold}${stats.totalSongs}${c.reset}

${c.bold}CHARTS:${c.reset}
  ${c.blue}►${c.reset} Artistas:        ${c.bold}${stats.totalChartArtists}${c.reset}
  ${c.blue}►${c.reset} Charts:          ${c.bold}${stats.totalCharts}${c.reset}

${c.bold}ENLACES:${c.reset}
  ${c.blue}►${c.reset} Total:           ${c.bold}${stats.totalLinks}${c.reset}
  ${c.blue}►${c.reset} Únicos:          ${c.bold}${stats.uniqueLinks}${c.reset}
  ${c.yellow}►${c.reset} Duplicados:      ${c.bold}${c.yellow}${stats.duplicateLinks}${c.reset}

${c.bold}TOP 10 ARTISTAS (por canciones):${c.reset}
${stats.topArtists.map((a, i) => `  ${c.dim}${(i + 1).toString().padStart(2)}.${c.reset} ${a.name.padEnd(30)} ${c.cyan}${a.count} canciones${c.reset}`).join('\n')}
`);
}

/**
 * Muestra historial de verificaciones
 */
function showHistory() {
  if (!fs.existsSync(CONFIG.HISTORY_FILE)) {
    console.log(`\n${c.yellow}📋 No hay historial de verificaciones aún.${c.reset}\n`);
    return;
  }
  
  const history = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE, 'utf-8'));
  
  if (history.length === 0) {
    console.log(`\n${c.yellow}📋 El historial está vacío.${c.reset}\n`);
    return;
  }
  
  console.log(`
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║                    📜 HISTORIAL                               ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}
`);
  
  // Mostrar últimos 10
  const recent = history.slice(-10).reverse();
  
  recent.forEach((entry, i) => {
    const healthColor = entry.healthPercent > 95 ? c.green : entry.healthPercent > 80 ? c.yellow : c.red;
    const typeLabel = entry.type === 'full' ? 'COMPLETO' : `Muestra (${entry.sampleSize})`;
    
    console.log(`  ${c.dim}${formatDate(entry.date)}${c.reset}`);
    console.log(`  ${healthColor}${c.bold}${entry.healthPercent}%${c.reset} salud | ${c.green}${entry.alive}${c.reset} vivos | ${c.red}${entry.dead}${c.reset} muertos | ${typeLabel}`);
    if (entry.deadLinks && entry.deadLinks.length > 0) {
      console.log(`  ${c.dim}Enlaces muertos: ${entry.deadLinks.slice(0, 3).join(', ')}${entry.deadLinks.length > 3 ? '...' : ''}${c.reset}`);
    }
    console.log('');
  });
}

/**
 * Muestra duplicados encontrados
 */
function showDuplicates() {
  const duplicates = findDuplicates();
  const duplicateCount = Object.keys(duplicates).length;
  
  if (duplicateCount === 0) {
    console.log(`\n${c.green}✅ ¡No hay enlaces duplicados!${c.reset}\n`);
    return;
  }
  
  console.log(`
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║                    🔄 DUPLICADOS                              ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}

${c.yellow}⚠️  Se encontraron ${duplicateCount} enlaces duplicados:${c.reset}
`);
  
  Object.entries(duplicates).forEach(([id, occurrences]) => {
    console.log(`${c.bold}ID: ${c.cyan}${id}${c.reset} ${c.dim}(${occurrences.length} ocurrencias)${c.reset}`);
    occurrences.forEach((link, i) => {
      console.log(`    ${i + 1}. ${link.artist} - ${link.song} ${c.dim}[${link.type}]${c.reset}`);
    });
    console.log('');
  });
  
  // Guardar en archivo
  fs.writeFileSync(CONFIG.DUPLICATES_FILE, JSON.stringify({
    lastUpdate: new Date().toISOString(),
    count: duplicateCount,
    duplicates: duplicates
  }, null, 2));
  
  console.log(`${c.blue}📄 Lista guardada en: duplicates.json${c.reset}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🛠️ GESTIÓN DE ENLACES MUERTOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Menú interactivo para gestionar enlaces muertos
 */
async function manageDeadLinks() {
  if (!fs.existsSync(CONFIG.DEAD_LINKS_FILE)) {
    console.log(`\n${c.yellow}📋 No hay enlaces muertos registrados.${c.reset}`);
    console.log(`${c.dim}   Ejecuta una verificación primero con --check${c.reset}\n`);
    return;
  }
  
  const deadData = JSON.parse(fs.readFileSync(CONFIG.DEAD_LINKS_FILE, 'utf-8'));
  
  if (!deadData.links || deadData.links.length === 0) {
    console.log(`\n${c.green}✅ ¡No hay enlaces muertos! Tu biblioteca está saludable.${c.reset}\n`);
    return;
  }
  
  const rl = createReadline();
  
  console.log(`
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║              🛠️ GESTIONAR ENLACES MUERTOS                     ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}

${c.yellow}Última actualización: ${formatDate(deadData.lastUpdate)}${c.reset}
${c.red}Enlaces muertos encontrados: ${deadData.count}${c.reset}
`);
  
  for (let i = 0; i < deadData.links.length; i++) {
    const link = deadData.links[i];
    
    console.log(`
${c.bold}═══════════════════════════════════════════════════════════════${c.reset}
${c.bold}[${i + 1}/${deadData.links.length}]${c.reset} ${c.red}Enlace Muerto${c.reset}

  ${c.bold}Artista:${c.reset}  ${link.artist || 'Desconocido'}
  ${c.bold}Canción:${c.reset}  ${link.song || 'Desconocida'}
  ${c.bold}Álbum:${c.reset}    ${link.album || 'N/A'}
  ${c.bold}Tipo:${c.reset}     ${link.type || 'N/A'}
  ${c.bold}ID:${c.reset}       ${link.id}
  ${c.bold}Estado:${c.reset}   ${link.status}

${c.cyan}¿Qué deseas hacer?${c.reset}
  ${c.yellow}1.${c.reset} Sustituir enlace (tengo uno nuevo)
  ${c.yellow}2.${c.reset} Eliminar de la biblioteca
  ${c.yellow}3.${c.reset} Saltar (dejar como está)
  ${c.yellow}4.${c.reset} Salir del gestor
`);
    
    const answer = await ask(rl, `${c.bold}Opción: ${c.reset}`);
    
    if (answer === '1') {
      // Sustituir enlace
      console.log(`\n${c.cyan}Pega el nuevo enlace de Google Drive:${c.reset}`);
      const newUrl = await ask(rl, `${c.bold}URL: ${c.reset}`);
      
      // Extraer ID del nuevo enlace
      const idMatch = newUrl.match(/id=([a-zA-Z0-9_-]+)/) || newUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      
      if (idMatch) {
        const newId = idMatch[1];
        const newFullUrl = `https://drive.google.com/uc?export=download&id=${newId}`;
        
        // Actualizar en secuencias.json
        const data = readDataJson();
        let updated = false;
        
        // Buscar en artistas
        if (data.artists && link.type === 'secuencia') {
          for (const artist of data.artists) {
            if (artist.name === link.artist && artist.albums) {
              for (const album of artist.albums) {
                if (album.songs) {
                  for (const song of album.songs) {
                    if (song.url && song.url.includes(link.id)) {
                      song.url = newFullUrl;
                      updated = true;
                      break;
                    }
                  }
                }
                if (updated) break;
              }
            }
            if (updated) break;
          }
        }
        
        // Buscar en charts
        if (data.charts && link.type === 'chart') {
          for (const chartArtist of data.charts) {
            if (chartArtist.name === link.artist && chartArtist.charts) {
              for (const chart of chartArtist.charts) {
                if (chart.url && chart.url.includes(link.id)) {
                  chart.url = newFullUrl;
                  updated = true;
                  break;
                }
              }
            }
            if (updated) break;
          }
        }
        
        if (updated) {
          saveDataJson(data);
          console.log(`\n${c.green}✅ Enlace actualizado exitosamente!${c.reset}`);
          
          // Remover de la lista de muertos
          deadData.links.splice(i, 1);
          deadData.count = deadData.links.length;
          fs.writeFileSync(CONFIG.DEAD_LINKS_FILE, JSON.stringify(deadData, null, 2));
          i--; // Ajustar índice
        } else {
          console.log(`\n${c.yellow}⚠️  No se encontró el enlace para actualizar. Puede que ya haya sido modificado.${c.reset}`);
        }
      } else {
        console.log(`\n${c.red}❌ URL inválida. Debe ser un enlace de Google Drive.${c.reset}`);
      }
      
    } else if (answer === '2') {
      // Confirmar eliminación
      const confirm = await ask(rl, `\n${c.red}¿Estás seguro de eliminar "${link.song}" de ${link.artist}? (s/n): ${c.reset}`);
      
      if (confirm.toLowerCase() === 's') {
        const data = readDataJson();
        let deleted = false;
        
        // Eliminar de artistas
        if (data.artists && link.type === 'secuencia') {
          for (const artist of data.artists) {
            if (artist.name === link.artist && artist.albums) {
              for (const album of artist.albums) {
                if (album.songs) {
                  const songIndex = album.songs.findIndex(s => s.url && s.url.includes(link.id));
                  if (songIndex !== -1) {
                    album.songs.splice(songIndex, 1);
                    deleted = true;
                    break;
                  }
                }
              }
            }
            if (deleted) break;
          }
        }
        
        // Eliminar de charts
        if (data.charts && link.type === 'chart') {
          for (const chartArtist of data.charts) {
            if (chartArtist.name === link.artist && chartArtist.charts) {
              const chartIndex = chartArtist.charts.findIndex(ch => ch.url && ch.url.includes(link.id));
              if (chartIndex !== -1) {
                chartArtist.charts.splice(chartIndex, 1);
                deleted = true;
                break;
              }
            }
          }
        }
        
        if (deleted) {
          saveDataJson(data);
          console.log(`\n${c.green}✅ Eliminado exitosamente!${c.reset}`);
          
          // Remover de la lista de muertos
          deadData.links.splice(i, 1);
          deadData.count = deadData.links.length;
          fs.writeFileSync(CONFIG.DEAD_LINKS_FILE, JSON.stringify(deadData, null, 2));
          i--;
        } else {
          console.log(`\n${c.yellow}⚠️  No se encontró para eliminar.${c.reset}`);
        }
      }
      
    } else if (answer === '3') {
      console.log(`\n${c.dim}Saltando...${c.reset}`);
      
    } else if (answer === '4') {
      console.log(`\n${c.blue}👋 Saliendo del gestor.${c.reset}\n`);
      rl.close();
      return;
    }
  }
  
  console.log(`\n${c.green}✅ Terminaste de revisar todos los enlaces muertos!${c.reset}\n`);
  rl.close();
}

// ═══════════════════════════════════════════════════════════════════════════════
//   ⏰ VERIFICACIÓN PROGRAMADA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula milisegundos hasta la próxima ejecución programada
 */
function msUntilNextScheduledRun() {
  const now = new Date();
  const next = new Date();
  
  // Configurar para el próximo día programado a la hora configurada
  next.setHours(CONFIG.SCHEDULED_HOUR, 0, 0, 0);
  
  // Ajustar al día de la semana correcto
  const daysUntil = (CONFIG.SCHEDULED_DAY + 7 - now.getDay()) % 7;
  next.setDate(next.getDate() + (daysUntil === 0 && now > next ? 7 : daysUntil));
  
  return next.getTime() - now.getTime();
}

/**
 * Inicia el modo de verificación programada
 */
async function startScheduledMode() {
  console.log(`
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║              ⏰ MODO PROGRAMADO ACTIVADO                      ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}

${c.yellow}La verificación se ejecutará automáticamente:${c.reset}
  📅 Día: ${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][CONFIG.SCHEDULED_DAY]}
  🕐 Hora: ${CONFIG.SCHEDULED_HOUR}:00

${c.dim}Mantén esta ventana abierta para que funcione.
Presiona Ctrl+C para detener.${c.reset}
`);
  
  const runScheduledCheck = async () => {
    console.log(`\n${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.cyan}🔄 Ejecutando verificación programada - ${formatDate(new Date())}${c.reset}`);
    console.log(`${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}\n`);
    
    const ids = extractUniqueIds();
    const results = await checkLinksInBatches(ids);
    const stats = calculateStats();
    
    // Guardar resultados
    saveToHistory(results, ids.length, true);
    if (results.deadLinks.length > 0) {
      saveDeadLinks(results.deadLinks);
    }
    
    // Mostrar resumen
    const healthPercent = ((results.alive / (results.alive + results.dead)) * 100).toFixed(1);
    console.log(`${c.bold}Resumen: ${c.reset}${healthPercent}% salud | ${c.green}${results.alive}${c.reset} vivos | ${c.red}${results.dead}${c.reset} muertos`);
    
    // Enviar email
    const emailConfig = loadEmailConfig();
    if (emailConfig) {
      await sendEmailReport(results, stats);
    }
    
    // Programar siguiente
    const msUntilNext = msUntilNextScheduledRun();
    const nextDate = new Date(Date.now() + msUntilNext);
    console.log(`\n${c.blue}⏰ Próxima verificación: ${formatDate(nextDate)}${c.reset}\n`);
    
    setTimeout(runScheduledCheck, msUntilNext);
  };
  
  // Primera ejecución
  const msUntilNext = msUntilNextScheduledRun();
  const nextDate = new Date(Date.now() + msUntilNext);
  console.log(`${c.blue}⏰ Primera verificación programada: ${formatDate(nextDate)}${c.reset}`);
  console.log(`${c.dim}   (en ${Math.round(msUntilNext / 1000 / 60 / 60)} horas)${c.reset}\n`);
  
  // Opción de ejecutar ahora
  const rl = createReadline();
  const runNow = await ask(rl, `${c.yellow}¿Ejecutar una verificación ahora? (s/n): ${c.reset}`);
  rl.close();
  
  if (runNow.toLowerCase() === 's') {
    await runScheduledCheck();
  } else {
    setTimeout(runScheduledCheck, msUntilNext);
    
    // Mantener el proceso vivo
    setInterval(() => {
      // Heartbeat cada hora
      console.log(`${c.dim}[${new Date().toLocaleTimeString()}] Modo programado activo...${c.reset}`);
    }, 60 * 60 * 1000);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🎯 MENÚ PRINCIPAL INTERACTIVO
// ═══════════════════════════════════════════════════════════════════════════════

async function showMainMenu() {
  const rl = createReadline();
  
  while (true) {
    clearScreen();
    showBanner();
    
    const stats = calculateStats();
    
    console.log(`${c.dim}  Biblioteca: ${stats.totalArtists} artistas | ${stats.totalSongs} canciones | ${stats.totalCharts} charts${c.reset}`);
    console.log(`${c.dim}  Enlaces: ${stats.uniqueLinks} únicos | ${stats.duplicateLinks} duplicados${c.reset}
`);
    
    console.log(`${c.bold}  ¿Qué deseas hacer?${c.reset}
    
  ${c.cyan}1.${c.reset} 🔍 Verificar enlaces (muestra rápida)
  ${c.cyan}2.${c.reset} 🔍 Verificar TODOS los enlaces
  ${c.cyan}3.${c.reset} 📊 Ver estadísticas completas
  ${c.cyan}4.${c.reset} 🔄 Buscar duplicados
  ${c.cyan}5.${c.reset} 📜 Ver historial de verificaciones
  ${c.cyan}6.${c.reset} 🛠️  Gestionar enlaces muertos
  ${c.cyan}7.${c.reset} 📧 Configurar email
  ${c.cyan}8.${c.reset} 📧 Enviar reporte por email
  ${c.cyan}9.${c.reset} ⏰ Iniciar verificación programada
  
  ${c.dim}0.${c.reset} 👋 Salir
`);
    
    const choice = await ask(rl, `  ${c.bold}Opción: ${c.reset}`);
    
    switch (choice) {
      case '1': {
        console.log('');
        const sampleStr = await ask(rl, `  ${c.cyan}¿Cuántos enlaces verificar? (default: 50): ${c.reset}`);
        const sample = parseInt(sampleStr) || 50;
        
        console.log('');
        const allIds = extractUniqueIds();
        const sampleIds = [...allIds].sort(() => Math.random() - 0.5).slice(0, sample);
        const results = await checkLinksInBatches(sampleIds);
        
        saveToHistory(results, sample, false);
        if (results.deadLinks.length > 0) saveDeadLinks(results.deadLinks);
        
        const health = ((results.alive / (results.alive + results.dead)) * 100).toFixed(1);
        console.log(`${c.bold}Resultado: ${c.reset}${health}% salud | ${c.green}${results.alive}${c.reset} vivos | ${c.red}${results.dead}${c.reset} muertos\n`);
        
        await ask(rl, `${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      }
      
      case '2': {
        console.log(`\n${c.yellow}⚠️  Esto verificará los ${stats.uniqueLinks} enlaces. Puede tomar 15-20 minutos.${c.reset}`);
        const confirm = await ask(rl, `${c.cyan}¿Continuar? (s/n): ${c.reset}`);
        
        if (confirm.toLowerCase() === 's') {
          console.log('');
          const allIds = extractUniqueIds();
          const results = await checkLinksInBatches(allIds);
          
          saveToHistory(results, allIds.length, true);
          if (results.deadLinks.length > 0) saveDeadLinks(results.deadLinks);
          
          const health = ((results.alive / (results.alive + results.dead)) * 100).toFixed(1);
          console.log(`${c.bold}Resultado: ${c.reset}${health}% salud | ${c.green}${results.alive}${c.reset} vivos | ${c.red}${results.dead}${c.reset} muertos\n`);
        }
        
        await ask(rl, `${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      }
      
      case '3':
        showStats();
        await ask(rl, `${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      
      case '4':
        showDuplicates();
        await ask(rl, `${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      
      case '5':
        showHistory();
        await ask(rl, `${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      
      case '6':
        rl.close();
        await manageDeadLinks();
        return showMainMenu(); // Reiniciar menú
      
      case '7': {
        console.log(`
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║              📧 CONFIGURAR EMAIL                              ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}

${c.yellow}Para usar Gmail necesitas una "Contraseña de Aplicación":${c.reset}
  1. Ve a: https://myaccount.google.com/apppasswords
  2. Selecciona "Correo" y "Windows Computer"
  3. Copia la contraseña generada (16 caracteres)
`);
        const email = await ask(rl, `  ${c.cyan}Tu Gmail: ${c.reset}`);
        const password = await ask(rl, `  ${c.cyan}App Password (16 caracteres): ${c.reset}`);
        
        if (email && password) {
          saveEmailConfig({ email, password });
          console.log(`\n${c.green}✅ Email configurado!${c.reset}`);
        }
        
        await ask(rl, `\n${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      }
      
      case '8': {
        console.log(`\n${c.cyan}Ejecutando verificación rápida antes de enviar...${c.reset}\n`);
        const allIds = extractUniqueIds();
        const sampleIds = [...allIds].sort(() => Math.random() - 0.5).slice(0, 100);
        const results = await checkLinksInBatches(sampleIds);
        const emailStats = calculateStats();
        
        await sendEmailReport(results, emailStats);
        await ask(rl, `${c.dim}Presiona Enter para continuar...${c.reset}`);
        break;
      }
      
      case '9':
        rl.close();
        await startScheduledMode();
        return;
      
      case '0':
        console.log(`\n${c.cyan}👋 ¡Hasta luego!${c.reset}\n`);
        rl.close();
        process.exit(0);
      
      default:
        console.log(`\n${c.red}Opción no válida${c.reset}`);
        await sleep(1000);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//   🚀 PUNTO DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  
  // Modo línea de comandos
  if (args.length > 0) {
    if (args.includes('--check')) {
      showBanner();
      const isFullScan = args.includes('--full');
      const sampleIndex = args.indexOf('--sample');
      const sampleSize = sampleIndex !== -1 ? parseInt(args[sampleIndex + 1]) || CONFIG.DEFAULT_SAMPLE_SIZE : CONFIG.DEFAULT_SAMPLE_SIZE;
      
      const allIds = extractUniqueIds();
      console.log(`${c.green}✓ Encontrados ${allIds.length} enlaces únicos${c.reset}\n`);
      
      let idsToCheck;
      if (isFullScan) {
        console.log(`${c.yellow}⚠️  Verificando TODOS los enlaces...${c.reset}\n`);
        idsToCheck = allIds;
      } else {
        console.log(`${c.blue}📊 Verificando ${sampleSize} enlaces aleatorios${c.reset}\n`);
        idsToCheck = [...allIds].sort(() => Math.random() - 0.5).slice(0, sampleSize);
      }
      
      const results = await checkLinksInBatches(idsToCheck);
      saveToHistory(results, idsToCheck.length, isFullScan);
      if (results.deadLinks.length > 0) saveDeadLinks(results.deadLinks);
      
      const health = ((results.alive / (results.alive + results.dead)) * 100).toFixed(1);
      console.log(`${c.bold}═══════════════════════════════════════════════════════════════${c.reset}`);
      console.log(`${c.green}✅ Vivos: ${results.alive}${c.reset}`);
      console.log(`${c.red}❌ Muertos: ${results.dead}${c.reset}`);
      console.log(`${health > 95 ? c.green : health > 80 ? c.yellow : c.red}💚 Salud: ${health}%${c.reset}\n`);
      
      if (args.includes('--email')) {
        const stats = calculateStats();
        await sendEmailReport(results, stats);
      }
      
    } else if (args.includes('--duplicates')) {
      showBanner();
      showDuplicates();
      
    } else if (args.includes('--stats')) {
      showBanner();
      showStats();
      
    } else if (args.includes('--history')) {
      showBanner();
      showHistory();
      
    } else if (args.includes('--manage-dead')) {
      showBanner();
      await manageDeadLinks();
      
    } else if (args.includes('--setup-email') || args.includes('--email') && !args.includes('--check')) {
      showBanner();
      const rl = createReadline();
      console.log(`
${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════════╗
║              📧 CONFIGURAR EMAIL                              ║
╚═══════════════════════════════════════════════════════════════╝${c.reset}

${c.yellow}Para usar Gmail necesitas una "Contraseña de Aplicación":${c.reset}
  1. Ve a: https://myaccount.google.com/apppasswords
  2. Selecciona "Correo" y "Windows Computer"
  3. Copia la contraseña generada
`);
      const email = await ask(rl, `  ${c.cyan}Tu Gmail: ${c.reset}`);
      const password = await ask(rl, `  ${c.cyan}App Password: ${c.reset}`);
      rl.close();
      
      if (email && password) {
        saveEmailConfig({ email, password });
        console.log(`\n${c.green}✅ Email configurado!${c.reset}\n`);
      }
      
    } else if (args.includes('--scheduled')) {
      showBanner();
      await startScheduledMode();
      
    } else {
      showBanner();
      console.log(`${c.yellow}Uso: node check-links.cjs [opciones]${c.reset}

${c.bold}Opciones:${c.reset}
  --check              Verificar enlaces
    --sample N         Verificar N enlaces (default: 50)
    --full             Verificar TODOS los enlaces
    --email            Enviar reporte por email
    
  --duplicates         Buscar enlaces duplicados
  --stats              Ver estadísticas
  --history            Ver historial
  --manage-dead        Gestionar enlaces muertos
  --setup-email        Configurar email
  --scheduled          Iniciar verificación programada

${c.dim}Sin argumentos se abre el menú interactivo.${c.reset}
`);
    }
  } else {
    // Modo interactivo
    await showMainMenu();
  }
}

// Ejecutar
main().catch(console.error);
