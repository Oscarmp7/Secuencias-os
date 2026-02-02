# Worship Box

Biblioteca web de secuencias y charts musicales.

## Descripcion

Worship Box es una app React + Vite para explorar artistas, buscar canciones y descargar charts.
El proyecto esta optimizado para desktop y mobile, con tema dark/light e internacionalizacion.

## Caracteristicas principales

- Catalogo grande (artistas, secuencias y charts)
- Busqueda optimizada (debounce + indice + Web Worker)
- Sidebar virtualizado para listas extensas
- Tema dark/light con transicion suave
- Selector de idioma (ES, EN, PT)
- Branding Worship Box integrado
  - `logo.svg` en la cabecera del sidebar
  - `logo-icon.svg` centrado en Home
  - variantes `logo-dark.svg` y `logo-icon-dark.svg` para mejor contraste en dark
- UI responsive enfocada en UX/UI

## Requisitos

- Node.js 18+

## Desarrollo local

```bash
cd app
npm install
npm run dev
```

URL local esperada:

```text
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

## Scripts utiles

- `npm run dev`: servidor local con HMR
- `npm run build`: build de produccion
- `npm run preview`: prueba local del build
- `npm run deploy`: publica en `gh-pages`

## Estructura

```text
worship-box/
|-- README.md
`-- app/
    |-- index.html
    |-- package.json
    |-- vite.config.js
    `-- src/
        |-- App.jsx
        |-- i18n.js
        |-- index.css
        |-- data.json
        |-- assets/
        |   |-- logo.svg
        |   |-- logo-dark.svg
        |   |-- logo-icon.svg
        |   `-- logo-icon-dark.svg
        |-- components/
        |-- hooks/
        |-- locales/
        |-- utils/
        `-- workers/
```

## Mantenimiento rapido

- Datos principales: `app/src/data.json`
- Tema: `app/src/index.css`
- Traducciones: `app/src/locales/*/translation.json`
- Busqueda: `app/src/utils/searchIndex.js` y `app/src/workers/searchWorker.js`

## Flujo de ramas actual

- Rama principal remota: `react-migration`
- Rama de deploy: `gh-pages`
