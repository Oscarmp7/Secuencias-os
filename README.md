# Secuencias OS

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

Tu biblioteca de secuencias y charts musicales.

## Descripcion

Secuencias OS es una aplicacion web para explorar y descargar secuencias musicales y charts de una biblioteca extensa. La UI esta optimizada para desktop y mobile, con soporte para tema claro/oscuro e idioma.

## Caracteristicas

- 776 artistas con su catalogo completo
- 2,154 albumes organizados por artista
- 6,289 secuencias disponibles para descarga
- 9,787 charts en formato PDF
- Busqueda optimizada (debounce + indice precalculado + Web Worker)
- Sidebar virtualizada para listas grandes
- Tema oscuro y claro con transicion suave
- Selector de idioma (ES/EN/PT)
- Diseno 100% responsive

## Inicio rapido

Requisitos:
- Node.js v18 o superior

Instalacion:

```bash
cd app
npm install
npm run dev
```

La aplicacion quedara disponible en:
```
http://localhost:5173/Secuencias-os/
```

Build de produccion:

```bash
cd app
npm run build
npm run preview
```

Deploy (GitHub Pages):

```bash
cd app
npm run deploy
```

## Stack tecnologico

| Tecnologia | Proposito |
|-----------|-----------|
| React 19 | UI con hooks modernos |
| Vite 7 | Bundler con HMR |
| Tailwind CSS 3 | Estilos utility-first |
| Lucide React | Iconografia |
| i18next + react-i18next | Internacionalizacion |
| ESLint | Linting |

## Estructura del proyecto

```
Secuencias pagina/
├── README.md
└── app/
    ├── index.html
    ├── src/
    │   ├── App.jsx
    │   ├── i18n.js
    │   ├── index.css
    │   ├── main.jsx
    │   ├── data.json
    │   ├── hooks/
    │   │   └── useDebouncedValue.js
    │   ├── utils/
    │   │   └── searchIndex.js
    │   ├── workers/
    │   │   └── searchWorker.js
    │   ├── components/
    │   └── locales/
    ├── public/
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

## Scripts utiles

- `npm run dev`: desarrollo con HMR
- `npm run build`: build optimizado para produccion
- `npm run preview`: previsualizacion del build
- `npm run deploy`: publica en GitHub Pages (gh-pages)

## Notas para mantenimiento

- Los datos viven en `app/src/data.json`.
- El tema (dark/light) se controla por variables CSS en `app/src/index.css`.
- Las traducciones viven en `app/src/locales/*`.
- La busqueda usa un indice precalculado y, si esta disponible, un Web Worker.
- El historial de artistas recientes se guarda en `localStorage`.

## Contribuir

1. Haz fork del repositorio
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m "Agregar nueva caracteristica"`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request
