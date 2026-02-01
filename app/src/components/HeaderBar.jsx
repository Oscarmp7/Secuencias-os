/**
 * HeaderBar.jsx
 *
 * Header superior con buscador, selector de idioma y toggle de tema.
 * Esta memoizado para evitar renders si las props no cambian.
 */

import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Home,
  Menu,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';

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

  // Estado para abrir/cerrar el menu de idioma (desktop).
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  // Menu compacto de controles para mobile.
  const [controlsOpen, setControlsOpen] = useState(false);
  const controlsRef = useRef(null);

  const handleLanguageChange = (nextLang) => {
    i18n.changeLanguage(nextLang);
    localStorage.setItem('language', nextLang);
    setLangOpen(false);
    setControlsOpen(false);
  };

  // Cerrar menus si se hace clic fuera.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
      if (controlsRef.current && !controlsRef.current.contains(event.target)) {
        setControlsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    // Header un poco mas alto en mobile para que los controles respiren mejor.
    <header className="bg-[var(--header)] border-b border-[var(--border)] px-4 h-[84px] md:h-[72px] flex items-center">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 w-full">
        {/* Centro: menu + buscador + inicio (centrados) */}
        <div className="col-start-2 justify-self-center">
          {/* En mobile damos mas ancho al buscador para que se sienta comodo */}
          <div className="flex items-center gap-4 w-[min(80vw,820px)] md:w-[min(60vw,720px)] min-w-0">
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
              aria-label={t('aria.toggleMenu')}
            >
              <Menu size={20} />
            </button>

            {/* Buscador controlado: el valor vive en App y se actualiza via props */}
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
                  x
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

        {/* Controles a la derecha: desktop con botones completos, mobile con menu compacto */}
        <div className="col-start-3 justify-self-end flex items-center gap-2 pr-3 md:pr-4">
          {/* Desktop: selector de idioma + toggle de tema */}
          <div className="hidden md:flex items-center gap-2">
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

              {/* Menu desplegable */}
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

            {/* Toggle de tema con animacion suave y duracion consistente */}
            <button
              onClick={onToggleTheme}
              className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-full transition-all duration-200 active:scale-95"
              aria-label={t('aria.toggleTheme')}
            >
              <div
                className={`transition-transform duration-200 ${
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

          {/* Mobile: un solo boton que abre un panel compacto */}
          <div ref={controlsRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => setControlsOpen((prev) => !prev)}
              className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-full transition-colors hover:bg-[var(--hover)]"
              aria-label={t('aria.languageSelect')}
              aria-haspopup="menu"
              aria-expanded={controlsOpen}
            >
              <SlidersHorizontal size={18} />
            </button>

            {controlsOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] overflow-hidden z-50"
              >
                {/* Seccion de idioma con chips para tocar rapido */}
                <div className="px-3 py-2">
                  <div className="text-xs text-[var(--text-subtle)] mb-2">
                    {t('labels.language')}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['es', 'en', 'pt'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageChange(lang)}
                        className={`px-2 py-1 rounded-full text-xs uppercase transition-colors ${
                          currentLanguage === lang
                            ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                            : 'bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--hover)]'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seccion de tema con switch centrado (label + control como grupo) */}
                <div className="border-t border-[var(--border)] px-3 py-3 flex items-center justify-center gap-3">
                  <span className="text-sm text-[var(--text)]">{t('labels.theme')}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={theme === 'light'}
                    onClick={() => {
                      onToggleTheme();
                      setControlsOpen(false);
                    }}
                    className={`relative inline-flex items-center w-11 h-6 rounded-full border transition-colors duration-200 ${
                      theme === 'light'
                        ? 'bg-[var(--chart-accent)] border-[var(--chart-accent)]'
                        : 'bg-[var(--panel)] border-[var(--border)]'
                    }`}
                    aria-label={t('aria.toggleTheme')}
                  >
                    {/* "Bolita" del switch que se mueve con translate */}
                    <span
                      className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        theme === 'light' ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

export default HeaderBar;
