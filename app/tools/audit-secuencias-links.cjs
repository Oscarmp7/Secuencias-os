#!/usr/bin/env node
/**
 * audit-secuencias-links.cjs
 *
 * Audita links de secuencias.json y clasifica cada URL:
 * - reachable
 * - login_required
 * - not_accessible
 * - error
 *
 * Uso:
 * node tools/audit-secuencias-links.cjs \
 *   --input src/data/secuencias.json \
 *   --output ../secuencias_link_health.json \
 *   --simple ../secuencias_links_problematicos.json \
 *   --csv ../secuencias_links_problematicos.csv
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

function writeCsv(filePath, rows) {
  if (!rows.length) {
    fs.writeFileSync(filePath, '', 'utf-8');
    return;
  }
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const raw = value == null ? '' : String(value);
    const escaped = raw.replace(/"/g, '""');
    return `"${escaped}"`;
  };
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf-8');
}

function providerForUrl(url) {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return 'other';
  }
  if (
    host.includes('drive.google.com') ||
    host.includes('drive.usercontent.google.com') ||
    host.includes('docs.google.com')
  ) {
    return 'drive';
  }
  if (host.includes('mega.nz') || host.includes('mega.co.nz')) return 'mega';
  if (host.includes('mediafire.com')) return 'mediafire';
  if (
    host.includes('terabox.com') ||
    host.includes('terabox.app') ||
    host.includes('teraboxapp.com') ||
    host.includes('1024tera.com') ||
    host.includes('freeterabox.com')
  ) {
    return 'terabox';
  }
  return 'other';
}

function extractMegaFileId(url) {
  const match = url.match(/\/file\/([^#/?]+)/i);
  return match ? match[1] : null;
}

function lowerIncludesAny(text, patterns) {
  return patterns.find((pattern) => pattern.test(text)) || null;
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

async function checkMegaFileApi(url, timeoutMs) {
  const fileId = extractMegaFileId(url);
  if (!fileId) {
    return {
      status: 'not_accessible',
      reason: 'mega_missing_file_id',
      httpStatus: null,
      finalUrl: null,
      provider: 'mega',
    };
  }

  const requestId = crypto.randomInt(100000, 999999);
  const endpoint = `https://g.api.mega.co.nz/cs?id=${requestId}`;
  const payload = [{ a: 'g', p: fileId, g: 1, ssl: 1 }];
  const { signal, clear } = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    clear();

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (Array.isArray(body) && body.length > 0) {
      const first = body[0];
      if (typeof first === 'object' && first && typeof first.g === 'string') {
        return {
          status: 'reachable',
          reason: null,
          httpStatus: response.status,
          finalUrl: url,
          provider: 'mega',
        };
      }
      if (typeof first === 'number') {
        return {
          status: 'not_accessible',
          reason: `mega_api_error_${first}`,
          httpStatus: response.status,
          finalUrl: url,
          provider: 'mega',
        };
      }
    }

    return {
      status: 'not_accessible',
      reason: 'mega_api_unexpected_response',
      httpStatus: response.status,
      finalUrl: url,
      provider: 'mega',
    };
  } catch (error) {
    clear();
    return {
      status: 'error',
      reason: `${error.name || 'Error'}: ${error.message || 'unknown'}`,
      httpStatus: null,
      finalUrl: null,
      provider: 'mega',
    };
  }
}

async function checkUrl(url, timeoutMs) {
  const provider = providerForUrl(url);

  if (provider === 'mega' && extractMegaFileId(url)) {
    return checkMegaFileApi(url, timeoutMs);
  }

  const { signal, clear } = createTimeoutSignal(timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
      },
    });
    clear();

    const httpStatus = response.status;
    const finalUrl = response.url;

    if (httpStatus === 401 || httpStatus === 403) {
      return {
        provider,
        httpStatus,
        finalUrl,
        status: provider === 'drive' ? 'login_required' : 'not_accessible',
        reason: `http_${httpStatus}`,
      };
    }
    if (httpStatus === 404) {
      return {
        provider,
        httpStatus,
        finalUrl,
        status: 'not_accessible',
        reason: 'http_404',
      };
    }
    if (httpStatus >= 400) {
      return {
        provider,
        httpStatus,
        finalUrl,
        status: 'not_accessible',
        reason: `http_${httpStatus}`,
      };
    }

    let text = '';
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const isTextLike = contentType.includes('text/html') || contentType.includes('text/plain');
    if (isTextLike || provider === 'drive' || provider === 'mediafire' || provider === 'terabox') {
      text = (await response.text()).toLowerCase().slice(0, 160000);
    }

    if (provider === 'drive') {
      const finalLower = (finalUrl || '').toLowerCase();
      if (finalLower.includes('accounts.google.com') || finalLower.includes('servicelogin')) {
        return {
          provider,
          httpStatus,
          finalUrl,
          status: 'login_required',
          reason: 'drive_login_redirect',
        };
      }

      const loginPattern = lowerIncludesAny(text, [
        /you need access/i,
        /request access/i,
        /access denied/i,
        /solicitar acceso/i,
        /necesitas acceso/i,
      ]);
      if (loginPattern) {
        return {
          provider,
          httpStatus,
          finalUrl,
          status: 'login_required',
          reason: `drive_login_pattern:${loginPattern}`,
        };
      }

      const notFoundPattern = lowerIncludesAny(text, [
        /file not found/i,
        /no longer exists/i,
        /archivo no encontrado/i,
      ]);
      if (notFoundPattern) {
        return {
          provider,
          httpStatus,
          finalUrl,
          status: 'not_accessible',
          reason: `drive_notfound_pattern:${notFoundPattern}`,
        };
      }
    }

    if (provider === 'mediafire') {
      const badPattern = lowerIncludesAny(text, [
        /file has been removed/i,
        /invalid or deleted file/i,
        /unknown or invalid file/i,
        /file could not be found/i,
      ]);
      if (badPattern) {
        return {
          provider,
          httpStatus,
          finalUrl,
          status: 'not_accessible',
          reason: `mediafire_pattern:${badPattern}`,
        };
      }
    }

    if (provider === 'terabox') {
      const badPattern = lowerIncludesAny(text, [
        /file has been deleted/i,
        /file does not exist/i,
        /invalid link/i,
        /cannot access/i,
      ]);
      if (badPattern) {
        return {
          provider,
          httpStatus,
          finalUrl,
          status: 'not_accessible',
          reason: `terabox_pattern:${badPattern}`,
        };
      }
    }

    return {
      provider,
      httpStatus,
      finalUrl,
      status: 'reachable',
      reason: null,
    };
  } catch (error) {
    clear();
    return {
      provider,
      httpStatus: null,
      finalUrl: null,
      status: 'error',
      reason: `${error.name || 'Error'}: ${error.message || 'unknown'}`,
    };
  }
}

function collectUrlRefs(secuencias) {
  const map = new Map();
  const add = (url, ref) => {
    const value = (url || '').trim();
    if (!value) return;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(ref);
  };

  for (const artist of secuencias.artists || []) {
    for (const album of artist.albums || []) {
      for (const song of album.songs || []) {
        add(song.downloadUrl, {
          kind: 'sequence',
          artist: artist.name || null,
          album: album.name || null,
          name: song.name || null,
          id: song.id || null,
        });
        add(song.chartUrl, {
          kind: 'song_chart',
          artist: artist.name || null,
          album: album.name || null,
          name: song.chartName || song.name || null,
          id: song.id || null,
        });
      }
    }
  }

  for (const chartArtist of secuencias.charts || []) {
    for (const chart of chartArtist.charts || []) {
      add(chart.downloadUrl, {
        kind: 'chart',
        artist: chartArtist.name || null,
        album: null,
        name: chart.name || null,
        id: chart.id || null,
      });
    }
  }

  return map;
}

async function runWithConcurrency(items, limit, worker, onProgress) {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;

  const runOne = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
      done += 1;
      if (onProgress) onProgress(done, items.length);
    }
  };

  const workers = [];
  const count = Math.min(Math.max(1, limit), Math.max(1, items.length));
  for (let i = 0; i < count; i += 1) {
    workers.push(runOne());
  }
  await Promise.all(workers);
  return results;
}

function summarize(results) {
  const summary = {
    totalUniqueUrls: results.length,
    reachable: 0,
    login_required: 0,
    not_accessible: 0,
    error: 0,
  };

  const byProvider = {};
  for (const item of results) {
    if (!byProvider[item.provider]) {
      byProvider[item.provider] = {
        total: 0,
        reachable: 0,
        login_required: 0,
        not_accessible: 0,
        error: 0,
      };
    }
    const block = byProvider[item.provider];
    block.total += 1;
    block[item.status] += 1;
    summary[item.status] += 1;
  }

  return { summary, byProvider };
}

function toCsvRows(problematic) {
  return problematic.map((entry) => {
    const sample = entry.refsSample && entry.refsSample.length ? entry.refsSample[0] : {};
    return {
      status: entry.status,
      reason: entry.reason || '',
      provider: entry.provider || '',
      httpStatus: entry.httpStatus ?? '',
      refsCount: entry.refsCount ?? 0,
      artistSample: sample.artist || '',
      albumSample: sample.album || '',
      nameSample: sample.name || '',
      url: entry.url || '',
    };
  });
}

async function main() {
  if (typeof fetch !== 'function') {
    throw new Error('Este script requiere Node.js con fetch global disponible (Node 18+).');
  }

  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const inputPath = path.resolve(cwd, args.input || 'src/data/secuencias.json');
  const outputPath = path.resolve(cwd, args.output || '../secuencias_link_health.json');
  const simplePath = path.resolve(cwd, args.simple || '../secuencias_links_problematicos.json');
  const csvPath = path.resolve(cwd, args.csv || '../secuencias_links_problematicos.csv');
  const timeoutMs = Number(args.timeout || 20000);
  const concurrency = Number(args.concurrency || 20);
  const progressEvery = Number(args['progress-every'] || 300);
  const limit = args.limit ? Number(args.limit) : null;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`No existe input: ${inputPath}`);
  }

  const secuencias = readJson(inputPath);
  const urlRefs = collectUrlRefs(secuencias);
  let urls = Array.from(urlRefs.keys());
  if (limit && Number.isFinite(limit) && limit > 0) {
    urls = urls.slice(0, limit);
  }

  console.log(`Auditando ${urls.length} URL(s) con concurrencia=${concurrency}...`);

  const results = await runWithConcurrency(
    urls,
    concurrency,
    async (url) => {
      const result = await checkUrl(url, timeoutMs);
      return {
        url,
        ...result,
      };
    },
    (done, total) => {
      if (done % progressEvery === 0 || done === total) {
        console.log(`progress ${done}/${total}`);
      }
    }
  );

  for (const item of results) {
    const refs = urlRefs.get(item.url) || [];
    item.refsCount = refs.length;
    item.refsSample = refs.slice(0, 5);
  }

  const { summary, byProvider } = summarize(results);
  const problematic = results.filter((item) =>
    ['login_required', 'not_accessible', 'error'].includes(item.status)
  );

  const report = {
    generatedAt: new Date().toISOString(),
    source: inputPath,
    summary,
    byProvider,
    problematicCount: problematic.length,
    problematic,
  };
  writeJson(outputPath, report);

  const simple = {
    generatedAt: report.generatedAt,
    summary,
    problematicCount: problematic.length,
    problematic: problematic.map((entry) => ({
      status: entry.status,
      provider: entry.provider,
      reason: entry.reason,
      url: entry.url,
      refsCount: entry.refsCount,
      refsSample: entry.refsSample,
    })),
  };
  writeJson(simplePath, simple);
  writeCsv(csvPath, toCsvRows(problematic));

  console.log('Auditoria completada.');
  console.log(`- Report: ${outputPath}`);
  console.log(`- Problematic JSON: ${simplePath}`);
  console.log(`- Problematic CSV: ${csvPath}`);
  console.log(`- Summary: ${JSON.stringify(summary)}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
