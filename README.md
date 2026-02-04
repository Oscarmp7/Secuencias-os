# Worship Box

Biblioteca web de secuencias, charts musicales y recursos para produccion musical cristiana.

## Descripcion

Worship Box es una aplicacion React + Vite para explorar artistas, buscar canciones, descargar secuencias/charts y acceder a recursos de software para produccion musical.

El proyecto esta optimizado para desktop y mobile, con tema dark/light e internacionalizacion completa (ES, EN, PT).

## Caracteristicas principales

### Biblioteca Musical
- Catalogo extenso: **767 artistas**, **5,796 secuencias** y **703 charts**
- Busqueda optimizada con debounce + indice Fuse.js + Web Worker
- Sidebar virtualizado para listas extensas (react-window)
- Charts integrados directamente en canciones

### Recursos y Software
- Seccion de recursos: DAWs, Plugins y Utilidades
- Sistema de categorias con filtros
- Soporte para multiples servicios de descarga:
  - Google Drive, MEGA, TeraBox, MediaFire, Dropbox, OneDrive

### Formulario de Aportes
- Contribucion de secuencias, software y sugerencias
- Validacion de URLs de multiples servicios
- Soporte para archivos adjuntos (.zip, .rar hasta 20MB)
- Sistema anti-spam (cooldown de 1 minuto)
- Notificaciones por email via **EmailJS**
- Mensajes de agradecimiento personalizados (SweetAlert2)
- **Boton "Hacer otro aporte"** para flujo continuo de contribuciones

### Sistema de Gestion de Datos (data-manager)
- Exportacion/importacion JSON <-> Excel
- Gestion de aportes de la comunidad
- Validacion de integridad de datos
- Limpieza de duplicados y albumes vacios
- Backup automatico con rotacion

### UI/UX
- Tema dark/light con transicion suave
- Selector de idioma (Espanol, English, Portugues)
- Diseno responsive completo (optimizado para moviles 360px+)
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

## Deploy

### GitHub Pages
```bash
cd app
npm run deploy
```

### Vercel
El proyecto esta listo para deploy en Vercel:
1. Importar repositorio en Vercel
2. Configurar:
   - **Framework Preset**: Vite
   - **Root Directory**: `app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

## Scripts utiles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor local con HMR |
| `npm run build` | Build de produccion |
| `npm run preview` | Prueba local del build |
| `npm run deploy` | Publica en gh-pages |
| `npm run lint` | ESLint check |

## Gestion de datos (data-manager)

```bash
# Menu interactivo
node tools/data-manager.cjs

# Comandos directos
node tools/data-manager.cjs --export              # Exportar a Excel
node tools/data-manager.cjs --import              # Importar desde Excel
node tools/data-manager.cjs --eliminar-vacios     # Eliminar albumes vacios
node tools/data-manager.cjs --eliminar-duplicados-tonos  # Eliminar duplicados de tonos
node tools/data-manager.cjs --sync-stats          # Sincronizar estadisticas
node tools/data-manager.cjs --validar             # Validar integridad
node tools/data-manager.cjs --help                # Ver todas las opciones
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
    │   └── data-manager.cjs      # CLI de gestion de datos
    ├── aportes/                  # Aportes de la comunidad
    │   ├── secuencias/
    │   └── software/
    ├── data/                     # Excel generados
    ├── backups/                  # Backups automaticos
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── i18n.js
        ├── index.css
        ├── data/
        │   ├── index.js
        │   ├── secuencias.json
        │   └── software.json
        ├── components/
        │   ├── views/
        │   │   ├── HomeView.jsx
        │   │   ├── ArtistView.jsx
        │   │   ├── SearchResultsView.jsx
        │   │   ├── ResourcesView.jsx
        │   │   └── ContributeFormView.jsx
        │   ├── HeaderBar.jsx
        │   ├── Sidebar.jsx
        │   └── MainContent.jsx
        ├── utils/
        │   ├── searchIndex.js
        │   ├── downloadUtils.js
        │   ├── formValidation.js
        │   └── xlsxGenerator.js
        ├── services/
        │   └── emailService.js
        ├── workers/
        └── locales/
            ├── es/translation.json
            ├── en/translation.json
            └── pt/translation.json
```

## Mantenimiento rapido

| Archivo | Proposito |
|---------|-----------|
| `app/src/data/secuencias.json` | Datos de artistas y canciones |
| `app/src/data/software.json` | Datos de software/recursos |
| `app/src/index.css` | Tema y estilos CSS |
| `app/src/locales/*/translation.json` | Traducciones i18n |
| `app/src/services/emailService.js` | Configuracion EmailJS |
| `app/tools/data-manager.cjs` | CLI de gestion |

## Configuracion de EmailJS

El sistema de aportes usa EmailJS para notificaciones:

1. Crear cuenta en [EmailJS](https://www.emailjs.com/)
2. Agregar servicio de email (Gmail recomendado)
3. Crear dos templates:
   - `template_contribution`: Notificacion de nuevo aporte
   - `template_thankyou`: Agradecimiento al usuario
4. Configurar en `app/src/services/emailService.js`

## Flujo de ramas

- Rama principal: `react-migration`
- Rama de deploy: `gh-pages`

## Licencia

MIT

---

**Worship Box** - Recursos para la adoracion

Ver `HANDOFF.md` para contexto tecnico completo.
