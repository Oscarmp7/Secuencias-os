# Worship Box

Biblioteca web de secuencias, charts musicales y recursos para producción.

## Descripción

Worship Box es una app React + Vite para explorar artistas, buscar canciones, descargar secuencias/charts
y acceder a recursos de software para producción musical.
El proyecto está optimizado para desktop y mobile, con tema dark/light e internacionalización.

## Características principales

### Biblioteca Musical
- Catálogo extenso (776+ artistas, 5,900+ secuencias y 700+ charts)
- Búsqueda optimizada (debounce + índice + Web Worker)
- Sidebar virtualizado para listas extensas
- Charts integrados directamente en canciones

### Recursos y Software
- Sección de recursos: DAWs, Plugins y Utilidades
- Sistema de categorías con filtros
- Soporte para múltiples servicios de descarga (Google Drive, MEGA, TeraBox, MediaFire, Dropbox, OneDrive)

### Formulario de Aportes
- Contribución de secuencias, software y sugerencias
- Validación de URLs de múltiples servicios
- Soporte para archivos adjuntos (.zip, .rar hasta 20MB)
- Sistema anti-spam (cooldown de 1 minuto)
- Notificaciones por email vía EmailJS
- Mensajes de agradecimiento personalizados (SweetAlert2)

### UI/UX
- Tema dark/light con transición suave
- Selector de idioma (ES, EN, PT)
- Diseño responsive completo
- Branding Worship Box integrado

## Requisitos

- Node.js 18+

## Desarrollo local

```bash
cd app
npm install
npm run dev
```

URL local esperada:

```
http://localhost:5173/worship-box/
```

## Build y preview

```bash
cd app
npm run build
npm run preview
```

## Deploy en GitHub Pages

```bash
cd app
npm run deploy
```

## Scripts útiles

- `npm run dev`: servidor local con HMR
- `npm run build`: build de producción
- `npm run preview`: prueba local del build
- `npm run deploy`: publica en `gh-pages`

## Gestión de datos

```bash
node tools/data-manager.cjs              # Menú interactivo
node tools/data-manager.cjs --export     # Exportar a Excel
node tools/data-manager.cjs --import     # Importar desde Excel
```

## Estructura del proyecto

```
worship-box/
├── README.md
├── HANDOFF.md
└── app/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tools/
    │   └── data-manager.cjs
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── i18n.js
        ├── index.css
        ├── data/
        │   ├── index.js
        │   ├── secuencias.json
        │   └── software.json
        ├── assets/
        ├── components/
        │   ├── HeaderBar.jsx
        │   ├── Sidebar.jsx
        │   ├── MainContent.jsx
        │   ├── VirtualList.jsx
        │   └── views/
        │       ├── HomeView.jsx
        │       ├── ArtistView.jsx
        │       ├── SearchResultsView.jsx
        │       ├── ResourcesView.jsx
        │       └── ContributeFormView.jsx
        ├── hooks/
        ├── utils/
        │   ├── searchIndex.js
        │   ├── downloadUtils.js
        │   ├── formValidation.js
        │   └── xlsxGenerator.js
        ├── services/
        │   └── emailService.js
        ├── workers/
        └── locales/
```

## Mantenimiento rápido

- **Datos de secuencias**: `app/src/data/secuencias.json`
- **Datos de software**: `app/src/data/software.json`
- **Tema y estilos**: `app/src/index.css`
- **Traducciones**: `app/src/locales/*/translation.json`
- **Búsqueda**: `app/src/utils/searchIndex.js`
- **Validación de URLs**: `app/src/utils/downloadUtils.js`
- **Configuración de email**: `app/src/services/emailService.js`

## Flujo de ramas

- Rama principal remota: `react-migration`
- Rama de deploy: `gh-pages`

## Handoff

Ver `HANDOFF.md` en la raíz del repo para contexto técnico completo.
