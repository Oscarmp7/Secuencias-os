#!/usr/bin/env node
/**
 * import-mega-folder-public.cjs
 *
 * Importa archivos de una carpeta publica de MEGA hacia secuencias-public.json.
 * - Descifra nombres de nodos de MEGA (carpetas/archivos)
 * - Toma solo archivos de secuencia comprimidos (.zip/.rar/.7z)
 * - Los transforma al esquema artists/albums/songs
 * - Evita duplicados contra lo ya existente y dentro del propio import
 *
 * Uso:
 * node tools/import-mega-folder-public.cjs \
 *   --mega "https://mega.nz/folder/<id>#<key>" \
 *   --input src/data/secuencias-public.json \
 *   --output src/data/secuencias-public.json \
 *   --report ../mega_import_report.json
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const artist = normalizeText(artistName);
  if (artist) {
    const artistRegex = new RegExp(escapeRegExp(artistName), 'ig');
    text = text.replace(artistRegex, ' ');
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
      fileKey: decrypted,
      attrKey: decrypted,
    };
  }
  if (decrypted.length >= 32) {
    return {
      fileKey: decrypted.subarray(0, 32),
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
  const json = text.slice(4);
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function parseMegaFolderUrl(value) {
  const raw = (value || '').trim();
  const folderMatch = raw.match(/mega\.nz\/folder\/([^#/?]+)#([^/?]+)/i);
  if (folderMatch) {
    return { folderId: folderMatch[1], folderKey: folderMatch[2], raw };
  }
  const compactMatch = raw.match(/^([^#\s]+)#([^#\s]+)$/);
  if (compactMatch) {
    return { folderId: compactMatch[1], folderKey: compactMatch[2], raw };
  }
  throw new Error(`URL de carpeta MEGA invalida: ${raw}`);
}

async function fetchMegaNodes(folderId) {
  const requestId = Math.floor(Math.random() * 1000000);
  const url = `https://g.api.mega.co.nz/cs?id=${requestId}&n=${folderId}`;
  const payload = [{ a: 'f', c: 1, r: 1, ca: 1 }];
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`MEGA API error: HTTP ${response.status}`);
  }
  const data = await response.json();
  const body = data && data[0];
  if (!body || !Array.isArray(body.f)) {
    throw new Error('Respuesta invalida de MEGA API');
  }
  return body.f;
}

function buildDecodedNodes(nodes, shareKey) {
  const map = new Map();
  for (const node of nodes) {
    const keyInfo = decryptNodeKey(node.k, shareKey);
    if (!keyInfo) continue;
    const attrs = decryptAttrs(node.a, keyInfo.attrKey);
    const nodeName = attrs && attrs.n ? attrs.n : null;
    if (!nodeName) continue;
    map.set(node.h, {
      ...node,
      name: nodeName,
      fileKey: keyInfo.fileKey,
    });
  }
  return map;
}

function getPathSegments(handle, byHandle) {
  const parts = [];
  let current = byHandle.get(handle);
  let guard = 0;
  while (current && guard < 64) {
    parts.push(current.name);
    current = byHandle.get(current.p);
    guard += 1;
  }
  return parts.reverse();
}

function isSequenceArchive(fileName) {
  return /\.(zip|rar|7z)$/i.test(fileName || '');
}

function sanitizeAlbumName(value) {
  const trimmed = (value || '').toString().trim();
  return trimmed || 'Singles / Otros';
}

function makeSongFromMegaNode(node, songName) {
  const fileKeyB64 = bufToB64Url(node.fileKey);
  const url = `https://mega.nz/file/${node.h}#${fileKeyB64}`;
  return {
    id: `mega_${node.h}`,
    name: songName,
    fullName: node.name,
    type: 'sequence',
    driveId: null,
    downloadUrl: url,
    compas: null,
    bpm: null,
    tonalidad: null,
    duracion: null,
    tipoSecuencia: null,
    comentarios: null,
    chartUrl: null,
    chartName: null,
  };
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

function collectCandidates(byHandle) {
  const candidates = [];
  const topTrackName = 'track';

  for (const node of byHandle.values()) {
    if (node.t !== 0) continue;
    if (!isSequenceArchive(node.name)) continue;

    const fullPath = getPathSegments(node.h, byHandle);
    if (!fullPath.length) continue;

    const pathParts = [...fullPath];
    if (normalizeText(pathParts[0]) === topTrackName) {
      pathParts.shift();
    }
    if (!pathParts.length) continue;

    const fileName = pathParts[pathParts.length - 1];
    const folderParts = pathParts.slice(0, -1);

    let artistName = 'Varios';
    let albumName = 'Singles / Otros';
    if (folderParts.length === 1) {
      artistName = folderParts[0];
    } else if (folderParts.length >= 2) {
      artistName = folderParts[0];
      albumName = sanitizeAlbumName(folderParts.slice(1).join(' / '));
    }

    const songName = fileName.replace(/\.(zip|rar|7z)$/i, '').trim();
    candidates.push({
      node,
      artistName: artistName.trim() || 'Varios',
      albumName: sanitizeAlbumName(albumName),
      songName: songName || fileName,
      sourcePath: fullPath.join(' / '),
    });
  }

  return candidates;
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

async function main() {
  if (typeof fetch !== 'function') {
    throw new Error('Este script requiere Node 18+ (fetch global).');
  }

  const args = parseArgs(process.argv.slice(2));
  if (!args.mega) {
    throw new Error('Falta --mega con la URL de carpeta publica de MEGA.');
  }

  const cwd = process.cwd();
  const inputPath = path.resolve(cwd, args.input || 'src/data/secuencias-public.json');
  const outputPath = path.resolve(cwd, args.output || inputPath);
  const reportPath = path.resolve(cwd, args.report || '../mega_import_report.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`No existe input: ${inputPath}`);
  }

  const mega = parseMegaFolderUrl(args.mega);
  const shareKey = b64UrlToBuf(mega.folderKey);
  if (shareKey.length !== 16) {
    throw new Error('La clave de carpeta MEGA no parece valida (se esperaban 16 bytes).');
  }

  console.log('Descargando nodos de MEGA...');
  const rawNodes = await fetchMegaNodes(mega.folderId);
  console.log(`Nodos recibidos: ${rawNodes.length}`);

  console.log('Descifrando nombres de nodos...');
  const decodedNodes = buildDecodedNodes(rawNodes, shareKey);
  console.log(`Nodos descifrados: ${decodedNodes.size}`);

  const candidates = collectCandidates(decodedNodes);
  console.log(`Candidatos de secuencia (.zip/.rar/.7z): ${candidates.length}`);

  const data = readJson(inputPath);
  data.artists = Array.isArray(data.artists) ? data.artists : [];
  data.charts = Array.isArray(data.charts) ? data.charts : [];

  const beforeArtists = countArtists(data);
  const beforeSongs = countSongs(data);

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

  for (const item of candidates) {
    const song = makeSongFromMegaNode(item.node, item.songName);
    const artistNorm = normalizeText(item.artistName);
    const tight = normalizeSongTight(song.name);
    const loose = normalizeSongLoose(song.name, item.artistName);
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
    } else if (artistNorm && tight && (existing.byArtistSongTight.has(tightKey) || importedArtistSongTight.has(tightKey))) {
      duplicateReason = 'name_tight';
      counters.skippedDuplicateNameTight += 1;
    } else if (artistNorm && loose && (existing.byArtistSongLoose.has(looseKey) || importedArtistSongLoose.has(looseKey))) {
      duplicateReason = 'name_loose';
      counters.skippedDuplicateNameLoose += 1;
    }

    if (duplicateReason) {
      if (duplicatesSample.length < 80) {
        duplicatesSample.push({
          reason: duplicateReason,
          artist: item.artistName,
          album: item.albumName,
          song: song.name,
          sourcePath: item.sourcePath,
        });
      }
      continue;
    }

    const artist = ensureArtist(data, item.artistName);
    const album = ensureAlbum(artist, item.albumName);
    album.songs.push(song);

    counters.inserted += 1;
    if (songUrl) importedUrlSet.add(songUrl);
    if (artistNorm && tight) importedArtistSongTight.add(tightKey);
    if (artistNorm && loose) importedArtistSongLoose.add(looseKey);
  }

  updateStats(data);

  const afterArtists = countArtists(data);
  const afterSongs = countSongs(data);

  writeJson(outputPath, data);

  const report = {
    generatedAt: new Date().toISOString(),
    sourceMega: mega.raw,
    folderId: mega.folderId,
    input: inputPath,
    output: outputPath,
    nodes: {
      raw: rawNodes.length,
      decoded: decodedNodes.size,
    },
    candidates: candidates.length,
    results: counters,
    before: {
      artists: beforeArtists,
      songs: beforeSongs,
    },
    after: {
      artists: afterArtists,
      songs: afterSongs,
    },
    duplicatesSample,
  };

  writeJson(reportPath, report);

  console.log('Importacion completada.');
  console.log(`- Output: ${outputPath}`);
  console.log(`- Report: ${reportPath}`);
  console.log(`- Agregadas: ${counters.inserted}`);
  console.log(
    `- Duplicados omitidos: ${counters.skippedDuplicateUrl + counters.skippedDuplicateId + counters.skippedDuplicateNameTight + counters.skippedDuplicateNameLoose}`
  );
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

