# HANDOFF.md - Worship Box

Documento de contexto tecnico para retomar el desarrollo rapidamente.

---

## Resumen del proyecto

Worship Box es una app React 18 + Vite con:
- Catalogo de secuencias musicales (767 artistas, 5,796 secuencias, 703 charts)
- Seccion de recursos/software (DAWs, Plugins, Utilidades)
- Formulario de aportes comunitarios con EmailJS
- Tema dark/light
- i18n (ES, EN, PT)
- Busqueda indexada + Web Worker
- Deploy en GitHub Pages / Vercel

---

## Arquitectura

```
app/src/
├── data/
│   ├── index.js           # Exporta artistas, canciones, software
│   ├── secuencias.json    # Artistas y canciones (767 artistas, 5796 secuencias)
│   └── software.json      # DAWs, Plugins, Utilidades
├── components/
│   ├── views/
│   │   ├── HomeView.jsx           # Dashboard con stats
│   │   ├── ArtistView.jsx         # Vista de artista individual
│   │   ├── SearchResultsView.jsx  # Resultados de busqueda
│   │   ├── ResourcesView.jsx      # Software y recursos
│   │   └── ContributeFormView.jsx # Formulario de aportes
│   ├── HeaderBar.jsx
│   ├── Sidebar.jsx
│   └── MainContent.jsx
├── utils/
│   ├── searchIndex.js      # Indice Fuse.js
│   ├── downloadUtils.js    # Validacion multi-servicio
│   ├── formValidation.js   # Validacion del formulario
│   └── xlsxGenerator.js    # Generacion de Excel
├── services/
│   └── emailService.js     # Integracion EmailJS
├── hooks/
├── workers/
└── locales/
    ├── es/translation.json
    ├── en/translation.json
    └── pt/translation.json
```

---

## Servicios de descarga soportados

El sistema valida URLs de multiples servicios en `downloadUtils.js`:

| Servicio     | Dominios                                      |
|--------------|-----------------------------------------------|
| Google Drive | drive.google.com                              |
| MEGA         | mega.nz, mega.co.nz                           |
| TeraBox      | terabox.com, terabox.app, teraboxapp.com      |
| MediaFire    | mediafire.com                                 |
| Dropbox      | dropbox.com                                   |
| OneDrive     | onedrive.live.com, 1drv.ms                    |

---

## Configuracion de EmailJS

El servicio de email se configura via variables de entorno en `app/.env`:

```
VITE_EMAILJS_SERVICE_ID=service_whwzteo
VITE_EMAILJS_TEMPLATE_FORM_ID=template_et8q3ei
VITE_EMAILJS_TEMPLATE_THANKS_ID=template_y8pgi2k
VITE_EMAILJS_PUBLIC_KEY=b0HcaxplK26PFy40Q
VITE_EMAILJS_TO_EMAIL=worshipbox.ministry@gmail.com

# Opcional: endpoint seguro (serverless/backend)
VITE_CONTRIBUTE_ENDPOINT=https://tu-endpoint/submit

# Opcional: desactivar adjunto XLSX en EmailJS
VITE_EMAILJS_ATTACH_XLSX=false
```

### Templates de EmailJS:
1. **template_et8q3ei**: Notifica al admin de nuevo aporte (contribution)
2. **template_y8pgi2k**: Agradecimiento al usuario (thankyou)

### Variables disponibles en templates:

**Contribution (template_et8q3ei):**
- `{{to_email}}`, `{{fecha_envio}}`, `{{tipo_aporte}}`
- `{{nombre_recurso}}`, `{{artista}}`, `{{album}}`
- `{{tonalidad}}`, `{{bpm}}`, `{{compas}}`, `{{subcategoria}}`
- `{{descripcion}}`, `{{url_descarga}}`
- `{{servicio_descarga}}`, `{{id_descarga}}`
- `{{nombre_donante}}`, `{{email_donante}}`, `{{sugerencias}}`

**Thank You (template_y8pgi2k):**
- `{{to_email}}`, `{{saludo}}`, `{{nombre}}`
- `{{tipo_aporte}}`, `{{mensaje}}`

---

## Data Manager CLI

Herramienta CLI para gestion de datos ubicada en `tools/data-manager.cjs`:

```bash
# Menu interactivo (19 opciones)
node tools/data-manager.cjs

# Comandos principales
--export                     # Exportar JSONs a Excel
--import                     # Importar desde Excel
--eliminar-vacios            # Eliminar albumes vacios
--eliminar-duplicados-tonos  # Eliminar duplicados de tonos
--sync-stats                 # Sincronizar estadisticas
--validar                    # Validar integridad de datos
--find-duplicates            # Buscar duplicados (solo ver)
--help                       # Ver ayuda completa
```

### Estructura del menu:

```
--- DATOS (JSON <-> XLSX) ---
 1. [>] Exportar JSONs a Excel
 2. [<] Importar cambios desde Excel

--- APORTES DE SECUENCIAS ---
 3. [+] Agregar aporte(s) de secuencia
 4. [=] Combinar aportes (crear archivo madre)
 5. [?] Revisar aportes (ver duplicados)
 6. [v] Aprobar y transferir al JSON
 7. [x] Limpiar aportes procesados

--- APORTES DE SOFTWARE ---
 8-12. (Mismo flujo para software)

--- UTILIDADES ---
13. [#] Limpiar numeracion de nombres
14. [~] Sincronizar estadisticas
15. [!] Validar integridad de datos
16. [*] Buscar duplicados (solo ver)
17. [S] Crear backup manual
18. [X] Eliminar albumes vacios
19. [D] Eliminar duplicados de tonos
```

### Carpetas de aportes:
- `app/aportes/secuencias/` - Aportes de secuencias pendientes
- `app/aportes/software/` - Aportes de software pendientes

---

## Flujo del formulario de aportes

1. Usuario selecciona tipo: Secuencia | Software | Sugerencia
2. Formulario se renderiza condicionalmente segun tipo
3. Validacion en tiempo real de campos y URLs
4. URL de descarga obligatoria (sin adjuntos)
5. Anti-spam: cooldown de 60 segundos entre envios
6. Al enviar exitosamente:
   - Se notifica al admin via EmailJS
   - Se muestra SweetAlert2 de agradecimiento
   - Usuario puede elegir "Hacer otro aporte" o "Aceptar"
   - Si elige otro aporte, formulario se resetea (mantiene nombre/email)

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

### Responsive Design
- Breakpoints optimizados para moviles 360px+
- HomeView con justify-start para evitar scroll en pantallas pequenas
- Botones y cards adaptados para touch

---

## Scripts npm

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor local (puerto 5173) |
| `npm run build` | Build de produccion |
| `npm run preview` | Preview del build |
| `npm run deploy` | Deploy a GitHub Pages |
| `npm run lint` | ESLint check |

---

## Dependencias clave

| Paquete | Uso |
|---------|-----|
| react 18.3 | UI Framework |
| react-i18next | Internacionalizacion |
| fuse.js | Busqueda difusa |
| xlsx-js-style | Import/export Excel con estilos |
| sweetalert2 | Notificaciones UI |
| @emailjs/browser | Envio de emails |
| react-window | Virtualizacion de listas |
| tailwindcss | Estilos utilitarios |

---

## Flujo de deploy

### GitHub Pages
1. `npm run build` genera `/dist`
2. `npm run deploy` publica en rama `gh-pages`
3. GitHub Pages sirve desde `/worship-box/`

Base URL: `https://oscarmp7.github.io/worship-box/`

### Vercel
1. Importar repositorio
2. Configurar Root Directory: `app`
3. Framework: Vite
4. Build: `npm run build`
5. Output: `dist`

---

## Estado actual del proyecto

### Completado:
- [x] Migracion completa a React + Vite
- [x] Sistema de busqueda optimizado
- [x] Formulario de aportes con EmailJS (configurado y funcionando)
- [x] i18n completo (ES, EN, PT)
- [x] Tema dark/light
- [x] Data Manager CLI con 19 funciones
- [x] Limpieza de datos (albumes vacios, duplicados de tonos)
- [x] Responsive design para moviles
- [x] Deploy en GitHub Pages
- [x] Branding Worship Box (logos SVG con variantes dark/light)
- [x] Favicons adaptivos segun tema del navegador

### Estadisticas actuales:
- 767 artistas
- 5,796 secuencias
- 703 charts
- 3 categorias de software

---

## Proximos pasos sugeridos

1. **Deploy en Vercel** para mejor performance y SSL automatico
2. **Service Worker** para cache offline
3. **Analytics** para tracking de uso
4. **PWA** para instalacion en dispositivos
5. **Optimizacion de imagenes** con lazy loading
6. **Tests** con Vitest

---

## Contacto

Email del proyecto: worshipbox.ministry@gmail.com

