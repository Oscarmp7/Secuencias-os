/**
 * HomeView.jsx
 *
 * Pantalla de bienvenida con estadísticas y artistas destacados/recientes.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Music } from 'lucide-react';

const HomeView = memo(function HomeView({
  stats,
  homeArtists,
  hasRecentArtists,
  onSelectArtist,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4 py-12 sm:py-0">
      <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-[var(--accent-shadow)]">
        <Music size={40} className="md:hidden text-white" />
        <Music size={48} className="hidden md:block text-white" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold mb-3">{t('home.welcomeTitle')}</h1>
      <p className="text-[var(--text-muted)] text-lg mb-8 max-w-md">
        {t('home.welcomeSubtitle')}
      </p>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 w-full max-w-2xl">
        <div className="glass-card rounded-xl p-4 transition-all duration-200">
          <div className="text-2xl sm:text-3xl font-bold text-[var(--accent)]">
            {stats.totalArtists}
          </div>
          <div className="text-sm text-[var(--text-muted)]">{t('home.statsArtists')}</div>
        </div>
        <div className="glass-card rounded-xl p-4 transition-all duration-200">
          <div className="text-2xl sm:text-3xl font-bold text-[var(--accent)]">
            {stats.totalSongs.toLocaleString()}
          </div>
          <div className="text-sm text-[var(--text-muted)]">{t('home.statsSequences')}</div>
        </div>
        <div className="glass-card rounded-xl p-4 transition-all duration-200">
          <div className="text-2xl sm:text-3xl font-bold text-[var(--accent)]">
            {stats.totalCharts.toLocaleString()}
          </div>
          <div className="text-sm text-[var(--text-muted)]">{t('home.statsCharts')}</div>
        </div>
      </div>

      <div className="w-full max-w-lg">
        <h3 className="text-sm font-medium text-[var(--text-subtle)] mb-3 text-center">
          {hasRecentArtists ? t('home.recentTitle') : t('home.featuredTitle')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {homeArtists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => onSelectArtist(artist.id, 'artists')}
              className="glass-card flex items-center gap-3 p-3 rounded-lg transition-all duration-200 active:scale-[0.98] text-left"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Music size={18} className="text-white" />
              </div>
              <span className="font-medium truncate">{artist.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default HomeView;
