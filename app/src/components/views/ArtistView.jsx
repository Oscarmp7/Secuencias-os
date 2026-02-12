/**
 * ArtistView.jsx
 *
 * Vista de un artista con sus albumes y canciones.
 */

import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Folder, Download } from 'lucide-react';

function getSequenceType(value) {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized.includes('cover')) return 'cover';
  if (normalized.includes('original')) return 'original';
  return null;
}

/**
 * AlbumItem
 * - Componente interno para un album individual.
 * - Memoizado para evitar renders si el album no cambia.
 */
const AlbumItem = memo(function AlbumItem({ album, isExpanded, onToggle }) {
  const { t } = useTranslation();

  // useCallback evita crear una funcion nueva en cada render.
  const handleToggle = useCallback(() => onToggle(album.id), [onToggle, album.id]);

  return (
    <div className="mb-3 md:mb-4">
      <button
        onClick={handleToggle}
        className="w-full bg-[var(--panel)] hover:bg-[var(--panel-hover)] rounded-xl p-3 md:p-4 border border-[var(--border)] transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div
            className={`text-[var(--text-muted)] transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          >
            <ChevronRight size={20} />
          </div>

          <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <Folder size={18} className="md:hidden text-white" />
            <Folder size={22} className="hidden md:block text-white" />
          </div>

          <div className="flex-1 text-left min-w-0">
            <h4 className="text-base md:text-lg font-semibold text-[var(--text)] truncate">{album.name}</h4>
            <p className="text-xs md:text-sm text-[var(--text-muted)]">
              {t('artist.songCount', { count: album.songs.length })}
            </p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 bg-[var(--surface)] rounded-xl p-3 md:p-4 border border-[var(--border)] animate-in fade-in duration-200">
          <div className="space-y-1">
            {album.songs.map((song, index) => {
              const sequenceType = getSequenceType(song.tipoSecuencia);

              return (
                <div
                  key={song.id}
                  className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:bg-[var(--card-hover)] transition-all duration-200 group"
                >
                  <div className="w-6 md:w-8 text-center text-[var(--text-muted)] text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-[var(--text)] text-sm md:text-base truncate">{song.name}</div>

                      {sequenceType === 'cover' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-amber-500/15 text-amber-400 border border-amber-400/30">
                          {t('songInfo.typeCover')}
                        </span>
                      )}

                      {sequenceType === 'original' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-400/30">
                          {t('songInfo.typeOriginal')}
                        </span>
                      )}
                    </div>

                    {(song.tonalidad || song.bpm || song.compas) && (
                      <div className="text-xs text-[var(--text-subtle)] hidden md:flex items-center gap-2">
                        {song.tonalidad && (
                          <span className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                            {t('songInfo.key')}: {song.tonalidad}
                          </span>
                        )}
                        {song.bpm && <span className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">{song.bpm} BPM</span>}
                        {song.compas && <span className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">{song.compas}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {/* Boton de Chart (naranja, si tiene) */}
                    {song.chartUrl && (
                      <a
                        href={song.chartUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[var(--chart-accent-strong)] hover:bg-[var(--chart-accent-strong-hover)] rounded-lg transition-all duration-200 active:scale-95 text-sm text-white"
                        title={song.chartName || t('actions.downloadChart')}
                      >
                        <Download size={16} />
                        <span className="hidden md:inline">{t('actions.chart')}</span>
                      </a>
                    )}

                    {/* Boton de Secuencia (azul) */}
                    <a
                      href={song.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[var(--accent-strong)] hover:bg-[var(--accent-strong-hover)] rounded-lg transition-all duration-200 active:scale-95 text-sm text-white"
                    >
                      <Download size={16} />
                      <span className="hidden md:inline">{t('actions.sequence')}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

const ArtistView = memo(function ArtistView({ artist, expandedAlbums, onToggleAlbum }) {
  const { t } = useTranslation();

  // Calculamos el total de canciones una sola vez por artista.
  const totalSongs = useMemo(() => {
    return artist.albums.reduce((sum, album) => sum + album.songs.length, 0);
  }, [artist]);

  return (
    <>
      <h2 className="text-2xl md:text-3xl font-bold mb-2">{artist.name}</h2>
      <p className="text-[var(--text-muted)] mb-6 text-sm md:text-base">
        {t('artist.stats', { albums: artist.albums.length, songs: totalSongs })}
      </p>

      {artist.albums.map((album) => (
        <AlbumItem
          key={album.id}
          album={album}
          isExpanded={Boolean(expandedAlbums[album.id])}
          onToggle={onToggleAlbum}
        />
      ))}
    </>
  );
});

export default ArtistView;
