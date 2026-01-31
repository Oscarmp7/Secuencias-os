/**
 * i18n setup (react-i18next)
 *
 * Este archivo inicializa el sistema de traducciones.
 * Piensa en i18n como un "diccionario" que React consulta
 * para mostrar textos en el idioma elegido.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importamos los JSON con textos por idioma.
import es from './locales/es/translation.json';
import en from './locales/en/translation.json';
import pt from './locales/pt/translation.json';

// Intentamos recuperar el idioma guardado.
const savedLanguage = localStorage.getItem('language');

// Inicialización de i18n con React.
i18n.use(initReactI18next).init({
  // Diccionario por idioma.
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
  },

  // Idioma principal (español) + fallback.
  lng: savedLanguage || 'es',
  fallbackLng: 'es',

  // Evita escapar HTML porque React ya es seguro por defecto.
  interpolation: {
    escapeValue: false,
  },

  // Solo consideramos códigos simples: "es", "en", "pt".
  supportedLngs: ['es', 'en', 'pt'],
  load: 'languageOnly',
});

export default i18n;
