import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import './index.css';

// 1) Cargamos i18n una sola vez al iniciar la app.
//    Esto deja listas las traducciones globales antes de renderizar.
import './i18n';
import App from './App.jsx';
import { initEmailJS } from './services/emailService';

// 2) Este log ayuda a identificar rapidamente que build esta corriendo en el navegador.
//    Si cambia el timestamp, sabemos que se actualizo el bundle.
console.log('Worship Box v2.2.0 - Build:', Date.now());

// 3) Inicializamos EmailJS una sola vez antes del render.
//    Asi los formularios que dependen de EmailJS ya arrancan con el servicio listo.
initEmailJS();

// 4) Montamos toda la app React dentro del nodo #root.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 5) App representa toda tu interfaz principal. */}
    <App />
    {/* 6) Analytics agrega el script de Vercel para medir visitas/page views.
          Importante: usamos @vercel/analytics/react porque este proyecto es Vite + React.
          @vercel/analytics/next solo aplica cuando la app esta hecha con Next.js. */}
    <Analytics />
  </StrictMode>
);
