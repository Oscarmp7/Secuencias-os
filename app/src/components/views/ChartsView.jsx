/**
 * ChartsView.jsx
 *
 * Vista de charts (PDFs) de un artista.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download } from 'lucide-react';

const ChartsView = memo(function ChartsView({ chartArtist }) {
  const { t } = useTranslation();

  if (!chartArtist) return null;

  return (
    <>
      <h2 className="text-3xl font-bold mb-6">{chartArtist.name}</h2>
      <p className="text-[var(--text-muted)] mb-4">
        {t('charts.available', { count: chartArtist.charts.length })}
      </p>

      <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
        <div className="space-y-2">
          {chartArtist.charts.map((chart, index) => (
            <div
              key={chart.id}
              className="flex items-center gap-3 md:gap-4 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:bg-[var(--card-hover)] transition-all duration-200"
            >
              <div className="w-6 md:w-8 text-center text-[var(--text-muted)] text-sm font-medium">
                {index + 1}
              </div>

              <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-orange-500 to-red-600 rounded flex items-center justify-center">
                <FileText size={18} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text)] truncate">{chart.name}</div>
                <div className="text-xs text-[var(--text-subtle)]">{t('charts.pdf')}</div>
              </div>

              <a
                href={chart.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[var(--chart-accent-strong)] hover:bg-[var(--chart-accent-strong-hover)] rounded-lg transition-all duration-200 active:scale-95 text-sm text-white flex-shrink-0"
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

export default ChartsView;
