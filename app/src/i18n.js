/**
 * i18n setup (react-i18next)
 *
 * Este modulo inicializa traducciones para ES/EN/PT.
 * React usa este "diccionario" para renderizar textos segun idioma.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// JSON de traducciones por idioma.
import es from './locales/es/translation.json';
import en from './locales/en/translation.json';
import pt from './locales/pt/translation.json';

// Recupera el idioma guardado por el usuario (si existe).
const savedLanguage = localStorage.getItem('language');

// Inicializacion base de i18n.
i18n.use(initReactI18next).init({
  // Diccionario completo disponible en runtime.
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
  },

  // Espanol es idioma principal y fallback.
  lng: savedLanguage || 'es',
  fallbackLng: 'es',

  // React ya escapa HTML por defecto, no duplicar escape aqui.
  interpolation: {
    escapeValue: false,
  },

  // Solo codigos simples de idioma.
  supportedLngs: ['es', 'en', 'pt'],
  load: 'languageOnly',
});

export default i18n;
