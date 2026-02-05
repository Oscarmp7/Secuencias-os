<div align="center">

# 🎵 Worship Box

**Biblioteca de secuencias, charts y recursos para producción musical cristiana**

[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Demo en Vivo](https://oscarmp7.github.io/worship-box/) · [Reportar Bug](https://github.com/oscarmp7/worship-box/issues) · [Solicitar Feature](https://github.com/oscarmp7/worship-box/issues)

</div>

---

## 📋 Tabla de Contenidos

- [Acerca del Proyecto](#-acerca-del-proyecto)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Data Manager CLI](#-data-manager-cli)
- [Configuración](#-configuración)
- [Deploy](#-deploy)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 🎯 Acerca del Proyecto

Worship Box es una aplicación web moderna para explorar y descargar secuencias musicales, charts y recursos de software para producción musical cristiana. Diseñada con un enfoque en la experiencia de usuario, rendimiento y accesibilidad.

### 📊 Estadísticas Actuales

| Contenido | Cantidad |
|-----------|----------|
| 🎤 Artistas | **767** |
| 🎼 Secuencias | **5,796** |
| 📄 Charts | **703** |
| 💿 DAWs | **5** |
| 🎛️ Plugins | **35** |
| 🔧 Utilidades | **5** |

---

## ✨ Características

### 🎵 Biblioteca Musical
- **Búsqueda inteligente** con índice Fuse.js + Web Worker para rendimiento óptimo
- **Sidebar virtualizado** con react-window para listas extensas
- **Charts integrados** directamente en cada canción
- **Filtrado por artista, álbum y canción**

### 💾 Recursos y Software
- Catálogo organizado: **DAWs**, **Plugins** y **Utilidades**
- Soporte multi-servicio de descarga:
  - Google Drive, MEGA, TeraBox, MediaFire
  - Dropbox, OneDrive, ufile.io
  - Enlaces magnet, Blogspot, y más

### 📝 Sistema de Aportes
- Formulario de contribución para secuencias, software y sugerencias
- Validación de URLs en tiempo real
- Sistema anti-spam con cooldown
- Notificaciones automáticas vía **EmailJS**
- Mensajes de agradecimiento personalizados

### 🎨 UI/UX
- **Tema dark/light** con transición suave
- **Multilenguaje**: Español, English, Português
- **Diseño responsive** optimizado para móviles (360px+)
- Branding consistente con favicons adaptativos

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnologías |
|-----------|-------------|
| **Frontend** | React 18, Vite 6, TailwindCSS 3 |
| **Búsqueda** | Fuse.js, Web Workers |
| **UI** | Lucide React, SweetAlert2 |
| **i18n** | react-i18next |
| **Email** | EmailJS |
| **Datos** | xlsx-js-style |
| **Performance** | react-window (virtualización) |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/oscarmp7/worship-box.git
cd worship-box

# Instalar dependencias
cd app
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173/worship-box/`

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm run deploy` | Deploy a GitHub Pages |
| `npm run lint` | Verificar código con ESLint |

---

## 📁 Estructura del Proyecto

```
worship-box/
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── views/           # Vistas principales
│   │   │   │   ├── HomeView.jsx
│   │   │   │   ├── ArtistView.jsx
│   │   │   │   ├── SearchResultsView.jsx
│   │   │   │   ├── ResourcesView.jsx
│   │   │   │   └── ContributeFormView.jsx
│   │   │   ├── HeaderBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MainContent.jsx
│   │   ├── data/
│   │   │   ├── secuencias.json  # Artistas y canciones
│   │   │   └── software.json    # DAWs, Plugins, Utilidades
│   │   ├── utils/               # Utilidades
│   │   ├── services/            # Servicios (EmailJS)
│   │   ├── locales/             # Traducciones (es, en, pt)
│   │   └── workers/             # Web Workers
│   ├── tools/
│   │   └── data-manager.cjs     # CLI de gestión
│   ├── aportes/                 # Aportes pendientes
│   └── backups/                 # Backups automáticos
└── gh-pages-deploy/             # Build de producción
```

---

## 🔧 Data Manager CLI

Herramienta CLI completa para gestión de datos con menú interactivo de 19 opciones.

```bash
# Menú interactivo
node tools/data-manager.cjs

# Comandos directos
node tools/data-manager.cjs --export              # Exportar a Excel
node tools/data-manager.cjs --import              # Importar desde Excel
node tools/data-manager.cjs --validar             # Validar integridad
node tools/data-manager.cjs --sync-stats          # Sincronizar estadísticas
node tools/data-manager.cjs --eliminar-vacios     # Eliminar álbumes vacíos
node tools/data-manager.cjs --help                # Ver todas las opciones
```

### Funcionalidades Principales

| Categoría | Funciones |
|-----------|-----------|
| **Datos** | Export/Import JSON ↔ Excel |
| **Aportes** | Agregar, combinar, revisar, aprobar |
| **Utilidades** | Validar, limpiar duplicados, backups |

---

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `app/.env`:

```env
# EmailJS (requerido para formulario de aportes)
VITE_EMAILJS_SERVICE_ID=tu_service_id
VITE_EMAILJS_TEMPLATE_FORM_ID=tu_template_form
VITE_EMAILJS_TEMPLATE_THANKS_ID=tu_template_thanks
VITE_EMAILJS_PUBLIC_KEY=tu_public_key
VITE_EMAILJS_TO_EMAIL=tu@email.com

# Opcionales
VITE_CONTRIBUTE_ENDPOINT=https://tu-endpoint/submit
VITE_EMAILJS_ATTACH_XLSX=false
```

### Configuración de EmailJS

1. Crear cuenta en [EmailJS](https://www.emailjs.com/)
2. Agregar servicio de email (Gmail recomendado)
3. Crear templates:
   - **Contribution**: Notifica al admin de nuevos aportes
   - **Thank You**: Agradecimiento automático al usuario

---

## 🌐 Deploy

### GitHub Pages

```bash
cd app
npm run deploy
```

URL: `https://oscarmp7.github.io/worship-box/`

### Vercel

1. Importar repositorio en [Vercel](https://vercel.com)
2. Configurar:
   - **Framework**: Vite
   - **Root Directory**: `app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

---

## 🤝 Contribuir

Las contribuciones son bienvenidas y apreciadas.

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

También puedes contribuir directamente desde la aplicación usando el **formulario de aportes** para agregar secuencias, software o sugerencias.

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

---

## 📧 Contacto

**Worship Box Ministry**

- Email: worshipbox.ministry@gmail.com
- Web: [worship-box](https://oscarmp7.github.io/worship-box/)

---

<div align="center">

**Worship Box** — Recursos para la adoración 🙏

</div>
