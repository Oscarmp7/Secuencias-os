import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Importamos i18n una sola vez para inicializar las traducciones globales.
import './i18n';
import App from './App.jsx';

// Build version timestamp for cache busting
console.log('Worship Box v2.1.0 - Build:', Date.now());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* StrictMode ayuda a detectar errores comunes en desarrollo */}
    <App />
  </StrictMode>
);
