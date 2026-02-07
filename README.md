<div align="center">

# 🎵 Worship Box

Biblioteca de secuencias, charts y recursos para producción musical cristiana.
Aplicación web enfocada en rendimiento, UX y accesibilidad.

[![React](https://img.shields.io/badge/React-19.2.0-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Demo en vivo](https://worshipbox.vercel.app) · [Reportar bug](https://github.com/oscarmp7/worship-box/issues) · [Solicitar feature](https://github.com/oscarmp7/worship-box/issues)

</div>

---

## Tabla de contenidos

- [Acerca del proyecto](#acerca-del-proyecto)
- [Características](#características)
- [Tecnologías y versiones](#tecnologías-y-versiones)
- [Inicio rápido](#inicio-rápido)
- [Scripts](#scripts)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Data Manager CLI](#data-manager-cli)
- [Configuración](#configuración)
- [Deploy](#deploy)
- [Contribuir](#contribuir)
- [Licencia](#licencia)
- [Contacto](#contacto)

---

## Acerca del proyecto

Worship Box es una aplicación web moderna para explorar y descargar secuencias musicales, charts y recursos de software para producción musical cristiana. Está diseñada con un enfoque en experiencia de usuario, rendimiento y accesibilidad.

## Características

- Búsqueda rápida y filtrado por artista, álbum y canción.
- Charts integrados por canción.
- Catálogo de recursos: DAWs, plugins y utilidades con múltiples servicios de descarga.
- Formulario de aportes con validación en tiempo real, control de frecuencia y notificaciones por EmailJS (sin enlaces magnet/torrent).
- Interfaz responsive, tema claro/oscuro y multilenguaje (ES/EN/PT).

## Tecnologías y versiones

> Basado en `app/package.json`.

| Área | Tecnologías | Versión |
| --- | --- | --- |
| Frontend | React, React DOM | 19.2.0 |
| Build | Vite, @vitejs/plugin-react-swc | 7.2.4, 4.2.2 |
| Estilos | TailwindCSS, PostCSS, Autoprefixer | 3.4.17, 8.5.6, 10.4.23 |
| UI | Lucide React, SweetAlert2 | 0.563.0, 11.26.18 |
| i18n | i18next, react-i18next | 23.12.2, 14.1.2 |
| Email | @emailjs/browser | 4.4.1 |
| Datos | xlsx, xlsx-js-style | 0.18.5, 1.2.0 |
| Calidad | ESLint, @eslint/js | 9.39.1, 9.39.1 |

## Inicio rápido

### Requisitos

- Node.js LTS
- npm

### Instalación

```bash
git clone https://github.com/oscarmp7/worship-box.git
cd worship-box/app
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm run deploy` | Deploy a Vercel |
| `npm run lint` | Verificar código con ESLint |

## Estructura del proyecto

```
worship-box/
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── views/
│   │   │   ├── HeaderBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MainContent.jsx
│   │   ├── data/
│   │   │   ├── secuencias.json
│   │   │   └── software.json
│   │   ├── locales/
│   │   ├── services/
│   │   ├── utils/
│   │   └── workers/
│   ├── tools/
│   │   └── data-manager.cjs
│   ├── aportes/
│   └── backups/
└── README.md
```

## Data Manager CLI

Herramienta CLI para gestionar datos desde Excel (XLSX), validar integridad y administrar aportes.

```bash
# Menú interactivo
node tools/data-manager.cjs

# Comandos directos
node tools/data-manager.cjs --export
node tools/data-manager.cjs --import
node tools/data-manager.cjs --validar
node tools/data-manager.cjs --sync-stats
node tools/data-manager.cjs --eliminar-vacios
node tools/data-manager.cjs --help
```

## Configuración

### Variables de entorno

Crear `app/.env` a partir de `app/.env.example` y configurar:

```env
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_FORM_ID=
VITE_EMAILJS_TEMPLATE_THANKS_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_TO_EMAIL=worshipbox.ministry@gmail.com
VITE_CONTRIBUTE_ENDPOINT=
VITE_EMAILJS_ATTACH_XLSX=false
```

### EmailJS

1. Crear cuenta en EmailJS.
2. Configurar el servicio de email.
3. Crear plantillas Contribution (formulario de aporte) y Thank You (agradecimiento).

## Deploy

### Vercel (recomendado)

```bash
cd app
npm run deploy
```

URL: `https://worshipbox.vercel.app`

## Contribuir

1. Fork del proyecto.
2. Crea tu rama (`git checkout -b feature/mi-feature`).
3. Commit (`git commit -m "feat: mi feature"`).
4. Push (`git push origin feature/mi-feature`).
5. Abre un Pull Request.

También puedes contribuir desde la aplicación usando el formulario de aportes.

## Licencia

MIT.

## Contacto

**Worship Box Ministry**

- Email: worshipbox.ministry@gmail.com
- Web: https://worshipbox.vercel.app
