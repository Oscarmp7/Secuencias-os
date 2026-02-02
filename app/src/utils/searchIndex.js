/**
 * searchIndex.js
 *
 * Prepara un indice liviano para busquedas rapidas.
 * La idea es convertir la data grande en una lista plana con texto normalizado.
 */

// Normaliza texto: minusculas y sin acentos para que la busqueda sea mas tolerante.
const normalizeText = (value) => {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Construye el indice de busqueda (solo una vez).
 * Cada item tiene un "haystack" ya normalizado para comparar rapido.
 */
export const buildSearchIndex = (artists, charts) => {
  const index = [];

  artists.forEach((artist) => {
    const artistName = artist.name || '';

    artist.albums.forEach((album) => {
      const albumName = album.name || '';

      album.songs.forEach((song) => {
        index.push({
          id: song.id,
          type: 'song',
          name: song.name,
          artistName,
          artistId: artist.id,
          albumName,
          downloadUrl: song.downloadUrl,
          chartUrl: song.chartUrl || null,
          chartName: song.chartName || null,
          haystack: normalizeText(`${song.name} ${artistName} ${albumName}`),
        });
      });
    });
  });

  // Charts legacy - ya no necesarios para búsqueda separada
  // Los charts ahora están integrados en songs via chartUrl

  return index;
};

/**
 * Busca en el indice ya preparado.
 * Se corta al llegar al limite para no renderizar demasiado.
 */
export const searchInIndex = (index, query, limit = 50) => {
  const normalizedQuery = normalizeText(query.trim());
  if (normalizedQuery.length < 2) return [];

  const results = [];

  for (const item of index) {
    if (item.haystack.includes(normalizedQuery)) {
      results.push(item);
      if (results.length >= limit) break;
    }
  }

  return results;
};
