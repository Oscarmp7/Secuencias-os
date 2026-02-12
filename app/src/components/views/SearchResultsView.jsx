/**
 * SearchResultsView.jsx
 *
 * Muestra resultados de busqueda (canciones).
 * Los charts estan integrados en las canciones (chartUrl).
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Download } from 'lucide-react';

function getSequenceType(value) {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized.includes('cover')) return 'cover';
  if (normalized.includes('original')) return 'original';
  return null;
}

const SearchResultsView = memo(function SearchResultsView({ searchResults, searchQuery }) {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="text-2xl font-bold mb-2">{t('search.resultsTitle')}</h2>
      <p className="text-[var(--text-muted)] mb-6">
        {t('search.resultsFor', { count: searchResults.length, query: searchQuery })}
      </p>

      <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
        <div className="space-y-2">
          {searchResults.map((item, index) => {
            const sequenceType = getSequenceType(item.tipoSecuencia);

            return (
              <div
                key={`${item.id}-${index}`}
                className="flex items-center gap-3 md:gap-4 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:bg-[var(--card-hover)] transition-all duration-200"
              >
                <div className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
                  <Music size={18} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-[var(--text)] truncate">{item.name}</div>

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

                  <div className="text-xs text-[var(--text-subtle)] truncate">
                    {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {/* Boton de Chart (naranja, si tiene) */}
                  {item.chartUrl && (
                    <a
                      href={item.chartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[var(--chart-accent-strong)] hover:bg-[var(--chart-accent-strong-hover)] rounded-lg transition-all duration-200 active:scale-95 text-sm text-white"
                      title={item.chartName || t('actions.downloadChart')}
                    >
                      <Download size={16} />
                      <span className="hidden md:inline">{t('actions.chart')}</span>
                    </a>
                  )}
                  {/* Boton de Secuencia (azul) */}
                  <a
                    href={item.downloadUrl}
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
    </>
  );
});

export default SearchResultsView;
