/* eslint-env worker */
/**
 * searchWorker.js
 *
 * Web Worker para busquedas.
 * Esto corre en un hilo separado para no bloquear la UI.
 */

import { buildSearchIndex, searchInIndex } from '../utils/searchIndex';

let index = [];
let isReady = false;
let pendingQueries = [];

const runSearch = ({ query, limit, requestId }) => {
  const results = searchInIndex(index, query, limit);
  self.postMessage({ type: 'results', payload: results, requestId, query });
};

self.onmessage = (event) => {
  const { type, payload } = event.data || {};

  if (type === 'init') {
    // Construimos el indice una sola vez en el worker.
    index = buildSearchIndex(payload.artists, payload.charts);
    isReady = true;
    self.postMessage({ type: 'ready' });

    // Procesamos cualquier busqueda que haya llegado antes de estar listo.
    pendingQueries.forEach(runSearch);
    pendingQueries = [];
    return;
  }

  if (type === 'search') {
    if (!isReady) {
      pendingQueries.push(payload);
      return;
    }
    runSearch(payload);
  }
};
