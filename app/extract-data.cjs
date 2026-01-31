/**
 * Script para extraer datos de index.html y generar data.json
 */

const fs = require('fs');
const path = require('path');

// Resolver archivo de entrada (HTML exportado o JSON)
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const inputArg = inputIndex !== -1 ? args[inputIndex + 1] : null;
const inputPath = inputArg
    ? (path.isAbsolute(inputArg) ? inputArg : path.resolve(process.cwd(), inputArg))
    : path.join(__dirname, 'index.html');

if (!fs.existsSync(inputPath)) {
    console.error(`Archivo no encontrado: ${inputPath}`);
    console.error('Usa: node extract-data.cjs --input ruta/al/export.html');
    process.exit(1);
}

const rawInput = fs.readFileSync(inputPath, 'utf-8');

let searchData = null;

// Si es JSON, intentar parsear directo
if (inputPath.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(rawInput);
    if (Array.isArray(parsed)) {
        searchData = parsed;
    } else if (Array.isArray(parsed.searchData)) {
        searchData = parsed.searchData;
    }
}

// Si no es JSON (o no coincidió), buscar en HTML/JS
if (!searchData) {
    const searchDataMatch = rawInput.match(/const searchData = (\[[\s\S]*?\]);/);
    if (searchDataMatch) {
        searchData = JSON.parse(searchDataMatch[1]);
    }
}

if (!searchData) {
    console.error('No se encontró searchData en el archivo de entrada.');
    console.error('Asegúrate de pasar el HTML exportado que contiene `const searchData = [...]`');
    console.error('o un JSON con el array en la raíz o en la propiedad `searchData`.');
    process.exit(1);
}

console.log(`Archivo de entrada: ${inputPath}`);
console.log(`Total de items encontrados: ${searchData.length}`);

// Filtrar solo items dentro de MULTITRACKS (secuencias) y CHARTS
const multitracksRoot = searchData.find(item => item.name === 'MULTITRACKS' && item.path === 'COMUNIDAD MULTITRACKS/MULTITRACKS');
const chartsRoot = searchData.find(item => item.name === 'CHARTS' && item.path === 'COMUNIDAD MULTITRACKS/CHARTS');

console.log('MULTITRACKS root:', multitracksRoot?.id);
console.log('CHARTS root:', chartsRoot?.id);

// Función para obtener el nivel de profundidad basado en el path
function getDepth(path) {
    return path.split('/').length;
}

// Función para verificar si un item es descendiente de un parent
function isDescendantOf(item, parentPath) {
    return item.path.startsWith(parentPath + '/');
}

// Función para obtener el parent directo
function getDirectParent(itemPath) {
    const parts = itemPath.split('/');
    parts.pop();
    return parts.join('/');
}

// ============================================================
// PROCESAR MULTITRACKS (Artistas → Álbumes → Canciones)
// ============================================================

const multitracksPath = 'COMUNIDAD MULTITRACKS/MULTITRACKS';
const chartsPath = 'COMUNIDAD MULTITRACKS/CHARTS';

// Obtener todos los items de MULTITRACKS
const multitracksItems = searchData.filter(item => 
    item.path.startsWith(multitracksPath + '/') && item.path !== multitracksPath
);

// Obtener todos los items de CHARTS
const chartsItems = searchData.filter(item => 
    item.path.startsWith(chartsPath + '/') && item.path !== chartsPath
);

console.log(`Items en MULTITRACKS: ${multitracksItems.length}`);
console.log(`Items en CHARTS: ${chartsItems.length}`);

// ============================================================
// EXTRAER ARTISTAS (carpetas directamente bajo MULTITRACKS)
// ============================================================

const artists = multitracksItems
    .filter(item => {
        const relativePath = item.path.replace(multitracksPath + '/', '');
        return item.is_folder && !relativePath.includes('/');
    })
    .map(artist => ({
        id: artist.id,
        name: artist.name,
        path: artist.path
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

console.log(`\nArtistas encontrados: ${artists.length}`);
artists.forEach(a => console.log(`  - ${a.name}`));

// ============================================================
// PARA CADA ARTISTA, ENCONTRAR ÁLBUMES Y CANCIONES
// ============================================================

const artistsWithAlbums = artists.map(artist => {
    const artistPath = artist.path;
    
    // Encontrar todos los items bajo este artista
    const artistItems = multitracksItems.filter(item => 
        item.path.startsWith(artistPath + '/') || item.path === artistPath
    );
    
    // Álbumes = carpetas directamente bajo el artista
    const albumFolders = artistItems.filter(item => {
        const relativePath = item.path.replace(artistPath + '/', '');
        return item.is_folder && !relativePath.includes('/') && item.path !== artistPath;
    });
    
    const albums = albumFolders.map(album => {
        const albumPath = album.path;
        
        // Canciones = archivos cuyo path es exactamente el albumPath (no subcarpetas)
        // En esta estructura, el path del archivo es igual al path de la carpeta padre
        const songs = artistItems
            .filter(item => 
                item.path === albumPath && !item.is_folder
            )
            .map(song => {
                const ext = song.name.split('.').pop().toLowerCase();
                const isSequence = ['zip', 'rar', '7z'].includes(ext);
                const isChart = ['pdf'].includes(ext);
                let cleanName = song.name.replace(/\.(zip|rar|7z|pdf)$/i, '');
                
                return {
                    id: song.id,
                    name: cleanName,
                    fullName: song.name,
                    type: isSequence ? 'sequence' : (isChart ? 'chart' : 'other'),
                    driveId: song.id,
                    downloadUrl: `https://drive.google.com/uc?export=download&id=${song.id}`
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
        
        return {
            id: album.id,
            name: album.name,
            image: null,
            songs: songs
        };
    })
    .filter(album => album.songs.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
    
    // Canciones sueltas (directamente bajo el artista, sin álbum)
    const looseSongs = artistItems
        .filter(item => 
            item.path === artistPath && !item.is_folder
        )
        .map(song => {
            const ext = song.name.split('.').pop().toLowerCase();
            const isSequence = ['zip', 'rar', '7z'].includes(ext);
            let cleanName = song.name.replace(/\.(zip|rar|7z|pdf)$/i, '');
            
            return {
                id: song.id,
                name: cleanName,
                fullName: song.name,
                type: isSequence ? 'sequence' : 'other',
                driveId: song.id,
                downloadUrl: `https://drive.google.com/uc?export=download&id=${song.id}`
            };
        });
    
    // Si hay canciones sueltas, crear un álbum "Singles / Otros"
    if (looseSongs.length > 0) {
        albums.push({
            id: `${artist.id}-otros`,
            name: 'Singles / Otros',
            image: null,
            songs: looseSongs.sort((a, b) => a.name.localeCompare(b.name))
        });
    }
    
    return {
        id: artist.id,
        name: artist.name,
        albums: albums
    };
}).filter(artist => artist.albums.length > 0);

// ============================================================
// PROCESAR CHARTS POR ARTISTA
// ============================================================

const chartsArtists = chartsItems
    .filter(item => {
        const relativePath = item.path.replace(chartsPath + '/', '');
        return item.is_folder && !relativePath.includes('/');
    })
    .map(artist => ({
        id: artist.id,
        name: artist.name,
        path: artist.path
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const chartsData = chartsArtists.map(artist => {
    const artistPath = artist.path;
    
    const artistItems = chartsItems.filter(item => 
        item.path.startsWith(artistPath + '/')
    );
    
    const files = artistItems
        .filter(item => !item.is_folder)
        .map(file => ({
            id: file.id,
            name: file.name.replace(/\.pdf$/i, ''),
            fullName: file.name,
            driveId: file.id,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    return {
        id: artist.id,
        name: artist.name,
        charts: files
    };
}).filter(artist => artist.charts.length > 0);

// ============================================================
// CREAR ESTRUCTURA FINAL
// ============================================================

const data = {
    lastUpdated: new Date().toISOString(),
    stats: {
        totalArtists: artistsWithAlbums.length,
        totalAlbums: artistsWithAlbums.reduce((sum, a) => sum + a.albums.length, 0),
        totalSongs: artistsWithAlbums.reduce((sum, a) => 
            sum + a.albums.reduce((s, al) => s + al.songs.length, 0), 0
        ),
        totalCharts: chartsData.reduce((sum, a) => sum + a.charts.length, 0)
    },
    artists: artistsWithAlbums,
    charts: chartsData
};

console.log('\n============ ESTADÍSTICAS ============');
console.log(`Artistas con secuencias: ${data.stats.totalArtists}`);
console.log(`Total de álbumes: ${data.stats.totalAlbums}`);
console.log(`Total de canciones/secuencias: ${data.stats.totalSongs}`);
console.log(`Artistas con charts: ${chartsData.length}`);
console.log(`Total de charts: ${data.stats.totalCharts}`);

// Guardar el JSON
const outputPath = path.join(__dirname, 'src', 'data.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`\n✅ Datos guardados en: ${outputPath}`);

// También mostrar algunos ejemplos
console.log('\n============ EJEMPLOS ============');
if (artistsWithAlbums.length > 0) {
    const example = artistsWithAlbums[0];
    console.log(`\nArtista: ${example.name}`);
    if (example.albums.length > 0) {
        console.log(`  Álbum: ${example.albums[0].name}`);
        console.log(`  Canciones: ${example.albums[0].songs.slice(0, 3).map(s => s.name).join(', ')}...`);
    }
}
