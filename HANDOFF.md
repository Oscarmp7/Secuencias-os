# HANDOFF.md — Worship Box

Documento de contexto técnico para retomar el desarrollo rápidamente.

---

## Resumen del proyecto

Worship Box es una app React 18 + Vite con:
- Catálogo de secuencias musicales (776+ artistas, 5,900+ secuencias, 700+ charts)
- Sección de recursos/software (DAWs, Plugins, Utilidades)
- Formulario de aportes comunitarios
- Tema dark/light
- i18n (ES, EN, PT)
- Búsqueda indexada + Web Worker
- Deploy en GitHub Pages

---

## Arquitectura

```
app/src/
├── data/
│   ├── index.js           # Exporta artistas, canciones, software
│   ├── secuencias.json    # Artistas y canciones
│   └── software.json      # DAWs, Plugins, Utilidades
├── components/
│   ├── views/
│   │   ├── HomeView.jsx           # Dashboard con stats
│   │   ├── ArtistView.jsx         # Vista de artista individual
│   │   ├── SearchResultsView.jsx  # Resultados de búsqueda
│   │   ├── ResourcesView.jsx      # Software y recursos
│   │   └── ContributeFormView.jsx # Formulario de aportes
│   ├── HeaderBar.jsx
│   ├── Sidebar.jsx
│   └── MainContent.jsx
├── utils/
│   ├── searchIndex.js      # Índice Fuse.js
│   ├── downloadUtils.js    # Validación multi-servicio
│   ├── formValidation.js   # Validación del formulario
│   └── xlsxGenerator.js    # Generación de Excel
├── services/
│   └── emailService.js     # Integración EmailJS
├── hooks/
├── workers/
└── locales/
```

---

## Estructura de datos

### secuencias.json
```json
{
  "artistas": [
    {
      "nombre": "Hillsong Worship",
      "canciones": [
        {
          "titulo": "What a Beautiful Name",
          "secuencia": "https://drive.google.com/...",
          "chart": "https://drive.google.com/..."
        }
      ]
    }
  ]
}
```

### software.json
```json
{
  "software": [
    {
      "id": "daw-001",
      "nombre": "Ableton Live 12 Suite",
      "tipo": "daw",
      "imagen": "/images/software/ableton.webp",
      "descripcion": "DAW profesional para producción musical",
      "link": "https://mega.nz/..."
    }
  ]
}
```

---

## Servicios de descarga soportados

El sistema valida URLs de múltiples servicios en `downloadUtils.js`:

| Servicio   | Dominios                                      |
|------------|-----------------------------------------------|
| Google Drive | drive.google.com                            |
| MEGA       | mega.nz, mega.co.nz                           |
| TeraBox    | terabox.com, terabox.app, teraboxapp.com      |
| MediaFire  | mediafire.com                                 |
| Dropbox    | dropbox.com                                   |
| OneDrive   | onedrive.live.com, 1drv.ms                    |

---

## Configuración de EmailJS

El servicio de email usa EmailJS para notificaciones. Configurar en `emailService.js`:

```javascript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_xxxxxx',        // ID del servicio de email
  TEMPLATE_CONTRIBUTION: 'template_xxx', // Template para notificar aportes
  TEMPLATE_THANKYOU: 'template_xxx',     // Template de agradecimiento
  PUBLIC_KEY: 'xxxxxxxxxxxxxxx'          // Clave pública de EmailJS
};
```

### Pasos para configurar:
1. Crear cuenta en [EmailJS](https://www.emailjs.com/)
2. Agregar servicio de email (Gmail, Outlook, etc.)
3. Crear templates para:
   - `contribution`: Notificación al admin de nuevo aporte
   - `thankyou`: Agradecimiento al usuario (si proporciona email)
4. Copiar IDs al archivo `emailService.js`

---

## Comandos de data-manager

```bash
# Menú interactivo
node tools/data-manager.cjs

# Exportar secuencias a Excel
node tools/data-manager.cjs --export

# Importar desde Excel (con backup automático)
node tools/data-manager.cjs --import

# Los archivos Excel se generan en:
# - app/worship-box-secuencias.xlsx
# - app/worship-box-software.xlsx
```

### Configuración
- `MAX_BACKUPS`: 3 (archivos de respaldo máximos)
- Backups en: `app/backups/`

---

## Flujo del formulario de aportes

1. Usuario selecciona tipo: Secuencia | Software | Sugerencia
2. Formulario se renderiza condicionalmente según tipo
3. Validación en tiempo real de campos y URLs
4. Límite de archivo: 20MB (.zip, .rar)
5. Anti-spam: cooldown de 60 segundos entre envíos
6. Al enviar:
   - Se notifica al admin vía EmailJS
   - Se muestra SweetAlert2 de agradecimiento
   - Si usuario proporcionó email, recibe agradecimiento

---

## Temas y estilos

CSS variables en `index.css`:

```css
:root {
  --primary: #3b82f6;
  --background: #ffffff;
  --surface: #f3f4f6;
  --text: #111827;
}

[data-theme="dark"] {
  --primary: #60a5fa;
  --background: #0f172a;
  --surface: #1e293b;
  --text: #f1f5f9;
}
```

TailwindCSS usa estas variables automáticamente.

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor local (puerto 5173) |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run deploy` | Deploy a GitHub Pages |
| `npm run lint` | ESLint check |

---

## Dependencias clave

| Paquete | Uso |
|---------|-----|
| react-i18next | Internacionalización |
| fuse.js | Búsqueda difusa |
| xlsx | Import/export Excel |
| sweetalert2 | Notificaciones UI |
| @emailjs/browser | Envío de emails |
| react-window | Virtualización de listas |
| tailwindcss | Estilos utilitarios |

---

## Flujo de deploy

1. `npm run build` genera `/dist`
2. `npm run deploy` publica en rama `gh-pages`
3. GitHub Pages sirve desde `/worship-box/`

Base URL: `https://[usuario].github.io/worship-box/`

---

## Próximos pasos sugeridos

1. **Optimización de chunks**: Configurar `manualChunks` en `vite.config.js`
2. **Lazy loading**: Componentes de vistas con `React.lazy()`
3. **Service Worker**: Cache offline para datos frecuentes
4. **Tests**: Agregar testing con Vitest
5. **Analytics**: Integrar tracking de uso

