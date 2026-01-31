/**
 * SearchResultsView.jsx
 *
 * Muestra resultados de búsqueda (canciones y charts).
 * Está separado para mantener App.jsx limpio.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Music, Download } from 'lucide-react';

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
          {searchResults.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-3 md:gap-4 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:bg-[var(--card-hover)] transition-all duration-200"
            >
              <div
                className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br ${
                  item.type === 'chart' ? 'from-orange-500 to-red-600' : 'from-blue-600 to-blue-800'
                }`}
              >
                {item.type === 'chart' ? (
                  <FileText size={18} className="text-white" />
                ) : (
                  <Music size={18} className="text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text)] truncate">{item.name}</div>
                <div className="text-xs text-[var(--text-subtle)] truncate">
                  {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                </div>
              </div>

              <a
                href={item.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[var(--accent-strong)] hover:bg-[var(--accent-strong-hover)] rounded-lg transition-all duration-200 active:scale-95 text-sm text-white flex-shrink-0"
              >
                <Download size={16} />
                <span className="hidden md:inline">{t('actions.download')}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

export default SearchResultsView;
