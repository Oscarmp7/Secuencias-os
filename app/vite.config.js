import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Configuracion base para desplegar en GitHub Pages.
// Si renombras el repo con otro slug, ajusta este valor.
export default defineConfig({
  plugins: [react()],
  base: '/worship-box/',
  build: {
    rollupOptions: {
      output: {
        // Mantiene nombres estables para assets de SEO como og:image/favicon.
        assetFileNames: 'assets/[name][extname]',
        // Optimización de chunks para mejor caching y carga paralela
        manualChunks: {
          // Vendor chunks - librerías externas
          'vendor-react': ['react', 'react-dom'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-ui': ['sweetalert2', 'lucide-react'],
          'vendor-xlsx': ['xlsx'],
        },
      },
    },
    // Aumentar límite de advertencia de chunks
    chunkSizeWarningLimit: 600,
  },
});
