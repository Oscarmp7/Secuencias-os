import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Importamos i18n una sola vez para inicializar las traducciones globales.
import './i18n';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* StrictMode ayuda a detectar errores comunes en desarrollo */}
    <App />
  </StrictMode>
);
