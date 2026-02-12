#!/usr/bin/env node
/**
 * build-public-secuencias.cjs
 *
 * Construye un dataset publico a partir de secuencias.json + reporte de salud.
 * Elimina canciones/charts con links no accesibles y limpia chartUrl privados.
 *
 * Uso:
 * node tools/build-public-secuencias.cjs \
 *   --input src/data/secuencias.json \
 *   --health ../secuencias_link_health.json \
 *   --output src/data/secuencias-public.json \
 *   --report ../secuencias_public_build_report.json
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, value) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

function nowIso() {
  return new Date().toISOString();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();

  const inputPath = path.resolve(cwd, args.input || 'src/data/secuencias.json');
  const healthPath = path.resolve(cwd, args.health || '../secuencias_link_health.json');
  const outputPath = path.resolve(cwd, args.output || 'src/data/secuencias-public.json');
  const reportPath = path.resolve(cwd, args.report || '../secuencias_public_build_report.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`No existe input: ${inputPath}`);
  }
  if (!fs.existsSync(healthPath)) {
    throw new Error(`No existe health report: ${healthPath}`);
  }

  const sec = readJson(inputPath);
  const health = readJson(healthPath);

  const problematicUrls = new Set(
    (health.problematic || []).map((entry) => (entry.url || '').trim()).filter(Boolean)
  );

  const isReachable = (url) => {
    const value = (url || '').trim();
    if (!value) return false;
    return !problematicUrls.has(value);
  };

  const publicData = JSON.parse(JSON.stringify(sec));

  let originalArtists = 0;
  let originalAlbums = 0;
  let originalSongs = 0;
  let originalSongCharts = 0;
  let originalChartGroups = 0;
  let originalCharts = 0;

  let removedArtists = 0;
  let removedAlbums = 0;
  let removedSongs = 0;
  let clearedSongChartUrls = 0;
  let removedChartGroups = 0;
  let removedCharts = 0;

  originalArtists = (sec.artists || []).length;
  for (const artist of sec.artists || []) {
    for (const album of artist.albums || []) {
      originalAlbums += 1;
      for (const song of album.songs || []) {
        originalSongs += 1;
        if (song.chartUrl) originalSongCharts += 1;
      }
    }
  }
  originalChartGroups = (sec.charts || []).length;
  for (const group of sec.charts || []) {
    originalCharts += (group.charts || []).length;
  }

  const filteredArtists = [];
  for (const artist of publicData.artists || []) {
    const filteredAlbums = [];
    for (const album of artist.albums || []) {
      const filteredSongs = [];
      for (const song of album.songs || []) {
        if (!isReachable(song.downloadUrl)) {
          removedSongs += 1;
          continue;
        }

        if (song.chartUrl && !isReachable(song.chartUrl)) {
          song.chartUrl = null;
          song.chartName = null;
          clearedSongChartUrls += 1;
        }

        filteredSongs.push(song);
      }

      if (filteredSongs.length === 0) {
        removedAlbums += 1;
        continue;
      }

      album.songs = filteredSongs;
      filteredAlbums.push(album);
    }

    if (filteredAlbums.length === 0) {
      removedArtists += 1;
      continue;
    }

    artist.albums = filteredAlbums;
    filteredArtists.push(artist);
  }
  publicData.artists = filteredArtists;

  const filteredChartGroups = [];
  for (const group of publicData.charts || []) {
    const before = (group.charts || []).length;
    const charts = (group.charts || []).filter((chart) => isReachable(chart.downloadUrl));
    const removed = before - charts.length;
    removedCharts += removed;
    if (charts.length === 0) {
      removedChartGroups += 1;
      continue;
    }
    group.charts = charts;
    filteredChartGroups.push(group);
  }
  publicData.charts = filteredChartGroups;

  const finalArtists = (publicData.artists || []).length;
  const finalAlbums = (publicData.artists || []).reduce(
    (sum, artist) => sum + (artist.albums || []).length,
    0
  );
  const finalSongs = (publicData.artists || []).reduce(
    (sum, artist) =>
      sum + (artist.albums || []).reduce((inner, album) => inner + (album.songs || []).length, 0),
    0
  );
  const finalSongCharts = (publicData.artists || []).reduce(
    (sum, artist) =>
      sum +
      (artist.albums || []).reduce(
        (inner, album) => inner + (album.songs || []).filter((song) => song.chartUrl).length,
        0
      ),
    0
  );
  const finalChartGroups = (publicData.charts || []).length;
  const finalCharts = (publicData.charts || []).reduce(
    (sum, group) => sum + (group.charts || []).length,
    0
  );

  publicData.lastUpdated = nowIso();
  publicData.stats = {
    totalArtists: finalArtists,
    totalSongs: finalSongs,
    totalCharts: finalCharts,
  };

  writeJson(outputPath, publicData);

  const report = {
    generatedAt: nowIso(),
    source: inputPath,
    healthSource: healthPath,
    output: outputPath,
    original: {
      artists: originalArtists,
      albums: originalAlbums,
      songs: originalSongs,
      songChartsLinked: originalSongCharts,
      chartGroups: originalChartGroups,
      charts: originalCharts,
    },
    public: {
      artists: finalArtists,
      albums: finalAlbums,
      songs: finalSongs,
      songChartsLinked: finalSongCharts,
      chartGroups: finalChartGroups,
      charts: finalCharts,
    },
    removed: {
      artists: removedArtists,
      albums: removedAlbums,
      songs: removedSongs,
      songChartUrlsCleared: clearedSongChartUrls,
      chartGroups: removedChartGroups,
      charts: removedCharts,
    },
  };

  writeJson(reportPath, report);

  console.log('Public dataset generado.');
  console.log(`- Output: ${outputPath}`);
  console.log(`- Report: ${reportPath}`);
  console.log(
    `- Publico: ${finalArtists} artistas, ${finalSongs} canciones, ${finalCharts} charts`
  );
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
