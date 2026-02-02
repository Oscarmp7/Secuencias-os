# Worship Box - Technical Handoff

Date: 2026-02-02

## 1) Project objective
Build a fast, clean UX web app to browse a large library of sequences and music charts.
Focus on responsive UI, dark/light theme, and multilingual support.

## 2) Stack and tools
- React 19 + Vite 7
- Tailwind CSS + CSS variables for theming
- i18next + react-i18next for translations (ES/EN/PT)
- lucide-react for UI icons
- Web Worker for search performance
- GitHub Pages deploy via gh-pages

## 3) Current architecture (key folders/files)
Root:
- README.md
- HANDOFF.md (this file)

App:
- app/index.html (meta/OG, favicon setup)
- app/vite.config.js (base /worship-box/, asset naming)
- app/package.json (scripts + gh-pages deploy)
- app/src/App.jsx (global state + orchestration)
- app/src/components/HeaderBar.jsx (search + language + theme)
- app/src/components/Sidebar.jsx (sidebar + brand logo)
- app/src/components/MainContent.jsx (view routing)
- app/src/components/views/HomeView.jsx (stats cards + featured artists)
- app/src/utils/searchIndex.js + app/src/workers/searchWorker.js
- app/src/i18n.js (i18n config)
- app/src/index.css (theme tokens + global styles)
- app/src/locales/*/translation.json
- app/src/data.json (source of truth for library)
- app/src/assets/ (logo variants)
- app/public/ (favicons)
- app/check-links.cjs (drive link health tool)

## 4) What is finished
- Full rebrand to Worship Box (meta, assets, docs)
- Dark/light theme with smooth transitions
- Language selector (ES/EN/PT) + mobile control panel UX
- Logos wired for light/dark variants
- Search optimized with debounce + index + worker
- Sidebar virtualized for large lists
- Deployed to GitHub Pages (gh-pages)

## 5) What is pending
- Optional: add favicon PNG/ICO for max browser compatibility
- Optional: split JS bundle (warning about large chunk)

## 6) Key technical decisions
- Vite base set to /worship-box/ for GitHub Pages
- Stats shown on cards are computed from data.json (not from data.stats)
- Dark theme logos are separate SVGs (no CSS invert)
- Favicons served from app/public for reliable build output

## 7) Conventions used
- Comments explain intent and UX decisions
- Tailwind for layout, CSS variables for theming
- React.memo + useCallback to reduce re-renders
- data.json is the single source of truth for library

## 8) Known issues / fragile points
- Favicon caching in browsers (requires hard refresh after updates)
- Build warning about large chunk (not breaking, but could be optimized)
- data.stats is no longer authoritative (kept for legacy, ignored)

## 9) Recommended next steps (ordered)
1. (Optional) Add favicon.ico and 32x32 png to app/public and update index.html.
2. (Optional) Add manualChunks or dynamic imports to reduce bundle size.
3. Add a small script/test to compare data.json counts vs UI stats.

## Repo and deploy
- Repo: https://github.com/Oscarmp7/worship-box
- Main remote branch: react-migration
- Deploy branch: gh-pages
- Live URL: https://oscarmp7.github.io/worship-box/

