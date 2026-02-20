#!/usr/bin/env node
/**
 * import-mega-audio-projects-public.cjs
 *
 * Importa proyectos de audio desde una carpeta publica de MEGA hacia
 * secuencias-public.json, infiriendo:
 * - artista (primera carpeta bajo Track)
 * - cancion (carpeta de proyecto mas especifica)
 * - album (carpeta superior no generica, si existe)
 *
 * Se crea 1 entrada por carpeta de proyecto (no por cada archivo .wav/.mp3).
 *
 * Uso:
 * node tools/import-mega-audio-projects-public.cjs \
 *   --mega "https://mega.nz/folder/<id>#<key>" \
 *   --input src/data/secuencias-public.json \
 *   --output src/data/secuencias-public.json \
 *   --report ../mega_audio_projects_import_report.json \
 *   --min-files 2
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
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

function normalizeText(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSongTight(name) {
  const noExt = (name || '').replace(/\.(zip|rar|7z)$/i, '');
  return normalizeText(noExt)
    .replace(/[_\-–—|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSongLoose(name, artistName = '') {
  let text = (name || '').replace(/\.(zip|rar|7z)$/i, '');
  if (artistName) {
    const escaped = artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'ig'), ' ');
  }
  return normalizeText(text)
    .replace(/[_\-–—|]+/g, ' ')
    .replace(/\b(multitrack|multi\s*track|mt)\b/g, ' ')
    .replace(/\b(cover|original|live|en vivo)\b/g, ' ')
    .replace(/\b\d{2,3}(?:\.\d+)?\s*bpm\b/g, ' ')
    .replace(/\b\d\/\d\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function b64UrlToBuf(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

function bufToB64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function aesEcbDecrypt(data, key) {
  const decipher = crypto.createDecipheriv('aes-128-ecb', key, null);
  decipher.setAutoPadding(false);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

function aesCbcDecrypt(data, key) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
  decipher.setAutoPadding(false);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

function xor16(a, b) {
  const out = Buffer.alloc(16);
  for (let i = 0; i < 16; i += 1) out[i] = a[i] ^ b[i];
  return out;
}

function decryptNodeKey(nodeKey, shareKey) {
  const part = (nodeKey || '').split(':').pop();
  if (!part) return null;
  const encrypted = b64UrlToBuf(part);
  if (!encrypted.length || encrypted.length % 16 !== 0) return null;

  const decrypted = aesEcbDecrypt(encrypted, shareKey);
  if (decrypted.length === 16) {
    return {
      fullKey: decrypted,
      attrKey: decrypted,
    };
  }
  if (decrypted.length >= 32) {
    return {
      fullKey: decrypted.subarray(0, 32),
      attrKey: xor16(decrypted.subarray(0, 16), decrypted.subarray(16, 32)),
    };
  }
  return null;
}

function decryptAttrs(attrValue, attrKey) {
  const encrypted = b64UrlToBuf(attrValue || '');
  if (!encrypted.length || encrypted.length % 16 !== 0) return null;
  const decrypted = aesCbcDecrypt(encrypted, attrKey);
  const text = decrypted.toString('utf8').replace(/\0+$/g, '');
  if (!text.startsWith('MEGA')) return null;
  try {
    return JSON.parse(text.slice(4));
  } catch {
    return null;
  }
}

function parseMegaFolderUrl(value) {
  const raw = (value || '').trim();
  const match = raw.match(/mega\.nz\/folder\/([^#/?]+)#([^/?]+)/i);
  if (!match) {
    throw new Error(`URL de carpeta MEGA invalida: ${raw}`);
  }
  return {
    raw,
    folderId: match[1],
    folderKey: match[2],
  };
}

async function fetchMegaNodes(folderId) {
  const requestId = Math.floor(Math.random() * 1000000);
  const response = await fetch(`https://g.api.mega.co.nz/cs?id=${requestId}&n=${folderId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify([{ a: 'f', c: 1, r: 1, ca: 1 }]),
  });

  if (!response.ok) {
    throw new Error(`MEGA API error HTTP ${response.status}`);
  }

  const json = await response.json();
  const body = json && json[0];
  if (!body || !Array.isArray(body.f)) {
    throw new Error('Respuesta invalida de MEGA API');
  }
  return body.f;
}

function buildDecodedNodes(nodes, shareKey) {
  const byHandle = new Map();
  for (const node of nodes) {
    const keyInfo = decryptNodeKey(node.k, shareKey);
    if (!keyInfo) continue;
    const attrs = decryptAttrs(node.a, keyInfo.attrKey);
    if (!attrs || !attrs.n) continue;
    byHandle.set(node.h, {
      ...node,
      name: attrs.n,
      fullKey: keyInfo.fullKey,
    });
  }
  return byHandle;
}

function getPathNodes(handle, byHandle) {
  const pathNodes = [];
  let current = byHandle.get(handle);
  let guard = 0;
  while (current && guard < 80) {
    pathNodes.push(current);
    current = byHandle.get(current.p);
    guard += 1;
  }
  return pathNodes.reverse();
}

function extOf(name) {
  const index = (name || '').lastIndexOf('.');
  return index >= 0 ? name.slice(index + 1).trim().toLowerCase() : '';
}

function cleanFolderLabel(name) {
  return (name || '')
    .replace(/^\s*\[?\s*multitracks?\s*\]?\s*/i, '')
    .replace(/^\s*multi\s*track\s*[-:_ ]*/i, '')
    .replace(/^\s*multitrack\s*[-:_ ]*/i, '')
    .replace(/^\s*mt\s*[-:_ ]*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGenericFolder(name) {
  const compact = normalizeText(name).replace(/[^a-z0-9]/g, '');
  const generic = new Set([
    'track',
    'tracks',
    'multitrack',
    'multitracks',
    'imported',
    'importedfiles',
    'recorded',
    'conformedfiles',
    'archivosimportados',
    'audio',
    'stems',
    'stem',
    'files',
  ]);
  return generic.has(compact);
}

function buildExistingIndexes(data) {
  const byUrl = new Set();
  const byId = new Set();
  const byArtistSongTight = new Set();
  const byArtistSongLoose = new Set();

  for (const artist of data.artists || []) {
    const artistNorm = normalizeText(artist.name);
    for (const album of artist.albums || []) {
      for (const song of album.songs || []) {
        const url = (song.downloadUrl || '').trim().toLowerCase();
        if (url) byUrl.add(url);
        if (song.id) byId.add(String(song.id).trim().toLowerCase());
        if (song.driveId) byId.add(String(song.driveId).trim().toLowerCase());

        const tight = normalizeSongTight(song.name || song.fullName || '');
        const loose = normalizeSongLoose(song.name || song.fullName || '', artist.name || '');
        if (artistNorm && tight) byArtistSongTight.add(`${artistNorm}|${tight}`);
        if (artistNorm && loose) byArtistSongLoose.add(`${artistNorm}|${loose}`);
      }
    }
  }

  return { byUrl, byId, byArtistSongTight, byArtistSongLoose };
}

function ensureArtist(data, artistName) {
  const target = normalizeText(artistName);
  let artist = (data.artists || []).find((item) => normalizeText(item.name) === target);
  if (!artist) {
    artist = {
      id: `mega_artist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: artistName,
      albums: [],
    };
    data.artists.push(artist);
  }
  return artist;
}

function ensureAlbum(artist, albumName) {
  const target = normalizeText(albumName);
  let album = (artist.albums || []).find((item) => normalizeText(item.name) === target);
  if (!album) {
    album = {
      id: `mega_album_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: albumName,
      image: null,
      songs: [],
    };
    artist.albums.push(album);
  }
  return album;
}

function countSongs(data) {
  return (data.artists || []).reduce(
    (sum, artist) =>
      sum + (artist.albums || []).reduce((inner, album) => inner + (album.songs || []).length, 0),
    0
  );
}

function countArtists(data) {
  return (data.artists || []).length;
}

function updateStats(data) {
  data.lastUpdated = new Date().toISOString();
  data.stats = {
    totalArtists: countArtists(data),
    totalSongs: countSongs(data),
    totalCharts: (data.charts || []).reduce(
      (sum, group) => sum + ((group && group.charts) ? group.charts.length : 0),
      0
    ),
  };
}

function collectAudioProjectCandidates(byHandle, minFiles) {
  const allowedExt = new Set(['wav', 'mp3']);
  const candidatesByFolder = new Map();

  const counters = {
    filesConsidered: 0,
    skippedNoArtist: 0,
    skippedNoFolderChain: 0,
    skippedNoSongFolder: 0,
    skippedSongFolderNoKey: 0,
  };

  for (const node of byHandle.values()) {
    if (node.t !== 0) continue;
    const ext = extOf(node.name);
    if (!allowedExt.has(ext)) continue;
    counters.filesConsidered += 1;

    let pathNodes = getPathNodes(node.h, byHandle);
    if (!pathNodes.length) continue;

    if (normalizeText(pathNodes[0].name) === 'track') {
      pathNodes = pathNodes.slice(1);
    }
    if (pathNodes.length < 2) {
      counters.skippedNoArtist += 1;
      continue;
    }

    const artistNode = pathNodes[0];
    const folderNodes = pathNodes.slice(1, -1);
    if (!folderNodes.length) {
      counters.skippedNoFolderChain += 1;
      continue;
    }

    let songFolderIndex = -1;
    for (let i = folderNodes.length - 1; i >= 0; i -= 1) {
      if (!isGenericFolder(folderNodes[i].name)) {
        songFolderIndex = i;
        break;
      }
    }
    if (songFolderIndex < 0) {
      counters.skippedNoSongFolder += 1;
      continue;
    }

    const songFolderNode = folderNodes[songFolderIndex];
    if (!songFolderNode.fullKey || !songFolderNode.fullKey.length) {
      counters.skippedSongFolderNoKey += 1;
      continue;
    }

    const songNameRaw = cleanFolderLabel(songFolderNode.name);
    const songName = songNameRaw || songFolderNode.name;
    if (!songName) continue;

    let albumName = 'Singles / Otros';
    for (let i = songFolderIndex - 1; i >= 0; i -= 1) {
      if (!isGenericFolder(folderNodes[i].name)) {
        albumName = cleanFolderLabel(folderNodes[i].name) || folderNodes[i].name;
        break;
      }
    }

    const key = songFolderNode.h;
    if (!candidatesByFolder.has(key)) {
      candidatesByFolder.set(key, {
        folderHandle: songFolderNode.h,
        folderKey: songFolderNode.fullKey,
        artistName: artistNode.name,
        albumName,
        songName,
        filesCount: 0,
        extCounts: { wav: 0, mp3: 0 },
        sampleFiles: [],
        samplePath: getPathNodes(songFolderNode.h, byHandle).map((item) => item.name).join(' / '),
      });
    }

    const candidate = candidatesByFolder.get(key);
    candidate.filesCount += 1;
    candidate.extCounts[ext] += 1;
    if (candidate.sampleFiles.length < 8) {
      candidate.sampleFiles.push(node.name);
    }
  }

  const allCandidates = Array.from(candidatesByFolder.values());
  const filtered = allCandidates.filter((item) => item.filesCount >= minFiles);
  return {
    allCandidates,
    filteredCandidates: filtered,
    counters,
  };
}

function makeSongFromProject(candidate) {
  const folderKeyB64 = bufToB64Url(candidate.folderKey);
  const downloadUrl = `https://mega.nz/folder/${candidate.folderHandle}#${folderKeyB64}`;
  return {
    id: `mega_folder_${candidate.folderHandle}`,
    name: candidate.songName,
    fullName: `${candidate.songName} [MEGA Folder]`,
    type: 'sequence',
    driveId: null,
    downloadUrl,
    compas: null,
    bpm: null,
    tonalidad: null,
    duracion: null,
    tipoSecuencia: null,
    comentarios: `Proyecto detectado por carpetas de audio (${candidate.filesCount} archivos wav/mp3).`,
    chartUrl: null,
    chartName: null,
  };
}

async function main() {
  if (typeof fetch !== 'function') {
    throw new Error('Este script requiere Node 18+ (fetch global).');
  }

  const args = parseArgs(process.argv.slice(2));
  if (!args.mega) {
    throw new Error('Falta --mega con la URL de carpeta publica de MEGA.');
  }

  const minFiles = Number(args['min-files'] || 2);
  if (!Number.isFinite(minFiles) || minFiles < 1) {
    throw new Error('--min-files debe ser un numero entero >= 1.');
  }

  const cwd = process.cwd();
  const inputPath = path.resolve(cwd, args.input || 'src/data/secuencias-public.json');
  const outputPath = path.resolve(cwd, args.output || inputPath);
  const reportPath = path.resolve(cwd, args.report || '../mega_audio_projects_import_report.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`No existe input: ${inputPath}`);
  }

  const mega = parseMegaFolderUrl(args.mega);
  const shareKey = b64UrlToBuf(mega.folderKey);
  if (shareKey.length !== 16) {
    throw new Error('Clave de carpeta MEGA invalida: se esperaban 16 bytes.');
  }

  console.log('Descargando nodos de MEGA...');
  const rawNodes = await fetchMegaNodes(mega.folderId);
  console.log(`Nodos recibidos: ${rawNodes.length}`);

  console.log('Descifrando nodos...');
  const byHandle = buildDecodedNodes(rawNodes, shareKey);
  console.log(`Nodos descifrados: ${byHandle.size}`);

  const candidatesResult = collectAudioProjectCandidates(byHandle, minFiles);
  console.log(`Proyectos detectados (todos): ${candidatesResult.allCandidates.length}`);
  console.log(
    `Proyectos detectados (>= ${minFiles} archivos wav/mp3): ${candidatesResult.filteredCandidates.length}`
  );

  const data = readJson(inputPath);
  data.artists = Array.isArray(data.artists) ? data.artists : [];
  data.charts = Array.isArray(data.charts) ? data.charts : [];

  const before = {
    artists: countArtists(data),
    songs: countSongs(data),
  };

  const existing = buildExistingIndexes(data);
  const importedUrlSet = new Set();
  const importedArtistSongTight = new Set();
  const importedArtistSongLoose = new Set();

  const counters = {
    inserted: 0,
    skippedDuplicateUrl: 0,
    skippedDuplicateId: 0,
    skippedDuplicateNameTight: 0,
    skippedDuplicateNameLoose: 0,
  };
  const duplicatesSample = [];

  for (const candidate of candidatesResult.filteredCandidates) {
    const song = makeSongFromProject(candidate);
    const artistNorm = normalizeText(candidate.artistName);
    const tight = normalizeSongTight(song.name);
    const loose = normalizeSongLoose(song.name, candidate.artistName);
    const songUrl = (song.downloadUrl || '').trim().toLowerCase();
    const songId = (song.id || '').trim().toLowerCase();

    const tightKey = `${artistNorm}|${tight}`;
    const looseKey = `${artistNorm}|${loose}`;

    let duplicateReason = null;
    if (songUrl && (existing.byUrl.has(songUrl) || importedUrlSet.has(songUrl))) {
      duplicateReason = 'url';
      counters.skippedDuplicateUrl += 1;
    } else if (songId && existing.byId.has(songId)) {
      duplicateReason = 'id';
      counters.skippedDuplicateId += 1;
    } else if (
      artistNorm &&
      tight &&
      (existing.byArtistSongTight.has(tightKey) || importedArtistSongTight.has(tightKey))
    ) {
      duplicateReason = 'name_tight';
      counters.skippedDuplicateNameTight += 1;
    } else if (
      artistNorm &&
      loose &&
      (existing.byArtistSongLoose.has(looseKey) || importedArtistSongLoose.has(looseKey))
    ) {
      duplicateReason = 'name_loose';
      counters.skippedDuplicateNameLoose += 1;
    }

    if (duplicateReason) {
      if (duplicatesSample.length < 80) {
        duplicatesSample.push({
          reason: duplicateReason,
          artist: candidate.artistName,
          album: candidate.albumName,
          song: song.name,
          samplePath: candidate.samplePath,
        });
      }
      continue;
    }

    const artist = ensureArtist(data, candidate.artistName);
    const album = ensureAlbum(artist, candidate.albumName || 'Singles / Otros');
    album.songs.push(song);

    counters.inserted += 1;
    if (songUrl) importedUrlSet.add(songUrl);
    if (artistNorm && tight) importedArtistSongTight.add(tightKey);
    if (artistNorm && loose) importedArtistSongLoose.add(looseKey);
  }

  updateStats(data);
  writeJson(outputPath, data);

  const after = {
    artists: countArtists(data),
    songs: countSongs(data),
  };

  const report = {
    generatedAt: new Date().toISOString(),
    sourceMega: mega.raw,
    folderId: mega.folderId,
    minFiles,
    input: inputPath,
    output: outputPath,
    decodedNodes: byHandle.size,
    detectCounters: candidatesResult.counters,
    candidates: {
      total: candidatesResult.allCandidates.length,
      afterMinFiles: candidatesResult.filteredCandidates.length,
    },
    merge: counters,
    before,
    after,
    duplicatesSample,
    candidatesSample: candidatesResult.filteredCandidates.slice(0, 60).map((item) => ({
      artist: item.artistName,
      album: item.albumName,
      song: item.songName,
      filesCount: item.filesCount,
      extCounts: item.extCounts,
      samplePath: item.samplePath,
      sampleFiles: item.sampleFiles,
    })),
  };

  writeJson(reportPath, report);

  console.log('Importacion de proyectos de audio completada.');
  console.log(`- Output: ${outputPath}`);
  console.log(`- Report: ${reportPath}`);
  console.log(`- Insertadas: ${counters.inserted}`);
  console.log(
    `- Duplicadas omitidas: ${
      counters.skippedDuplicateUrl +
      counters.skippedDuplicateId +
      counters.skippedDuplicateNameTight +
      counters.skippedDuplicateNameLoose
    }`
  );
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

