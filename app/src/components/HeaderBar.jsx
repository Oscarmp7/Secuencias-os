/**
 * HeaderBar.jsx
 *
 * Header superior con buscador, selector de idioma y toggle de tema.
 * Está memoizado para evitar renders si las props no cambian.
 */

import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Home, Menu, Sun, Moon, Globe, ChevronDown } from 'lucide-react';

const HeaderBar = memo(function HeaderBar({
  // Props controladas por App (estado global).
  searchQuery,
  onSearchChange,
  onClearSearch,
  onToggleSidebar,
  onGoHome,
  theme,
  onToggleTheme,
}) {
  // Hook de traducciones: t() devuelve el texto en el idioma actual.
  const { t, i18n } = useTranslation();

  // Idioma actual (ej: "es", "en", "pt").
  const currentLanguage = i18n.resolvedLanguage || i18n.language;

  // Estado para abrir/cerrar el menú de idioma.
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const handleLanguageChange = (nextLang) => {
    i18n.changeLanguage(nextLang);
    localStorage.setItem('language', nextLang);
    setLangOpen(false);
  };

  // Cerrar el menú si se hace clic fuera.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[var(--header)] border-b border-[var(--border)] px-4 h-[72px] flex items-center">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 w-full">
        {/* Centro: menú + buscador + inicio (centrados) */}
        <div className="col-start-2 justify-self-center">
          <div className="flex items-center gap-4 w-[min(60vw,720px)] min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
            aria-label={t('aria.toggleMenu')}
          >
            <Menu size={20} />
          </button>

          {/* Buscador controlado: el valor vive en App y se actualiza vía props */}
          <div className="flex-1 min-w-0 max-w-xl relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
              size={20}
            />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={onSearchChange}
              className="w-full bg-[var(--input-bg)] text-[var(--text)] pl-12 pr-4 py-3 rounded-full border border-[var(--input-border)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text)]"
                aria-label={t('aria.clearSearch')}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onGoHome}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[var(--accent-strong)] hover:bg-[var(--accent-strong-hover)] rounded-lg transition-all duration-200 active:scale-95 text-white"
          >
            <Home size={18} />
            <span className="hidden md:inline text-sm font-medium">{t('actions.home')}</span>
          </button>
          </div>
        </div>

        {/* Controles a la derecha: idioma + tema (pegados al borde derecho) */}
        <div className="col-start-3 justify-self-end flex items-center gap-2 pr-3 md:pr-4">
          {/* Selector de idioma (custom, coherente con el diseño) */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
              aria-label={t('aria.languageSelect')}
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              <Globe size={16} className="text-[var(--text-subtle)]" />
              <span className="uppercase">{currentLanguage}</span>
              <ChevronDown size={14} className="text-[var(--text-subtle)]" />
            </button>

            {/* Menú desplegable */}
            {langOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-20 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] overflow-hidden z-50"
              >
                {['es', 'en', 'pt'].map((lang) => (
                  <button
                    key={lang}
                    role="menuitem"
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`w-full px-3 py-2 text-left text-sm uppercase transition-colors ${
                      currentLanguage === lang
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'text-[var(--text)] hover:bg-[var(--hover)]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle de tema con animación suave */}
          <button
            onClick={onToggleTheme}
            className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-full transition-all duration-200 active:scale-95"
            aria-label={t('aria.toggleTheme')}
          >
            <div
              className={`transition-transform duration-300 ${
                theme === 'dark' ? 'rotate-0' : 'rotate-180'
              }`}
            >
              {theme === 'dark' ? (
                <Moon size={18} className="text-[var(--text)]" />
              ) : (
                <Sun size={18} className="text-[var(--chart-accent)]" />
              )}
            </div>
          </button>

        </div>
      </div>
    </header>
  );
});

export default HeaderBar;
