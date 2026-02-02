# Worship Box - Technical Handoff

Date: 2026-02-02

## 1) Project objective
Build a fast, clean UX web app to browse a large library of music sequences.
Charts (PDF) are now integrated directly into songs - no separate section.
Focus on responsive UI, dark/light theme, and multilingual support.

## 2) Stack and tools
- React 19 + Vite 7
- Tailwind CSS + CSS variables for theming
- i18next + react-i18next for translations (ES/EN/PT)
- lucide-react for UI icons
- Web Worker for search performance
- GitHub Pages deploy via gh-pages
- xlsx-js-style for Excel data management

## 3) Current architecture (key folders/files)

```
Root:
├── README.md
├── HANDOFF.md (this file)
└── app/
    ├── index.html (meta/OG, favicon)
    ├── vite.config.js (base /worship-box/)
    ├── package.json (scripts + gh-pages)
    ├── check-links.cjs (drive link health tool)
    ├── tools/
    │   └── data-manager.cjs (Excel import/export, cleanup)
    ├── src/
    │   ├── App.jsx (global state)
    │   ├── main.jsx (entry point)
    │   ├── i18n.js (i18n config)
    │   ├── index.css (theme tokens)
    │   ├── data.json (6240 songs, 709 charts)
    │   ├── components/
    │   │   ├── HeaderBar.jsx (search + lang + theme)
    │   │   ├── Sidebar.jsx (artist list)
    │   │   ├── MainContent.jsx (view router)
    │   │   ├── VirtualList.jsx (performance)
    │   │   └── views/
    │   │       ├── HomeView.jsx (stats + featured)
    │   │       ├── ArtistView.jsx (albums + songs)
    │   │       └── SearchResultsView.jsx
    │   ├── hooks/
    │   │   └── useDebouncedValue.js
    │   ├── utils/
    │   │   └── searchIndex.js
    │   ├── workers/
    │   │   └── searchWorker.js
    │   ├── locales/ (es, en, pt)
    │   └── assets/ (logos)
    └── public/ (favicons)
```

## 4) Data structure (data.json)

```json
{
  "artists": [{
    "id": "driveId",
    "name": "Artist Name",
    "albums": [{
      "id": "driveId",
      "name": "Album Name",
      "songs": [{
        "id": "driveId",
        "name": "Song Name",
        "downloadUrl": "https://drive.google.com/...",
        "chartUrl": "https://drive.google.com/..." // optional
        "chartName": "Chart Name" // optional
      }]
    }]
  }],
  "charts": [...] // Legacy, kept for search indexing
}
```

## 5) What is finished
- Full rebrand to Worship Box
- Dark/light theme with smooth transitions
- Language selector (ES/EN/PT)
- Search optimized with debounce + index + worker
- Sidebar virtualized for large lists
- Charts integrated into songs (chartUrl field)
- Dual download buttons: Sequence (blue) + Chart (orange)
- Excel-based data management (tools/data-manager.cjs)
- Deployed to GitHub Pages

## 6) Key commands

```bash
# Development
npm run dev

# Build & Deploy
npm run build
npm run deploy

# Data management
node tools/data-manager.cjs              # Interactive menu
node tools/data-manager.cjs --export     # Export to Excel
node tools/data-manager.cjs --import     # Import from Excel
node tools/data-manager.cjs --cleanup-charts  # Simplify charts
node tools/data-manager.cjs --link-charts     # Auto-link charts

# Link health check
node check-links.cjs
```

## 7) Key technical decisions
- Vite base set to /worship-box/ for GitHub Pages
- Stats computed from data.json (not from data.stats)
- Dark theme logos are separate SVGs (no CSS invert)
- Charts simplified: 1 chart per song, linked via chartUrl
- Charts section removed from sidebar (simplified UX)
- Songs with charts show 2 buttons: Sequence + Chart

## 8) Conventions used
- Comments explain intent and UX decisions
- Tailwind for layout, CSS variables for theming
- React.memo + useCallback to reduce re-renders
- data.json is the single source of truth

## 9) Known issues
- Build warning about large chunk (can optimize with manualChunks)
- Favicon caching in browsers (requires hard refresh)

## 10) Recommended next steps
1. Run `npm run build && npm run deploy` to publish changes
2. (Optional) Add manualChunks for bundle splitting
3. (Optional) Add more favicons for max browser compatibility

## Repo and deploy
- Repo: https://github.com/Oscarmp7/worship-box
- Branch: react-migration
- Deploy: gh-pages
- Live: https://oscarmp7.github.io/worship-box/

