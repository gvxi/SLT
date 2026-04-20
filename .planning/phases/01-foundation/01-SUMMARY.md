---
phase: 01-foundation
plan: 01-03
subsystem: core-foundation
tags: [nextjs, mui, i18n, rtl, layout, cloudflare, zustand]
dependency_graph:
  requires: []
  provides: [nextjs-app, mui-theme, i18n-system, layout-shell, cloudflare-config, type-definitions, zustand-store]
  affects: [all-modules]
tech_stack:
  added: [next@16.2.4, mui@6, zustand, react-query, i18next, emotion, dnd-kit, react-pdf, recharts, zod, react-hook-form, supabase-js, opennextjs-cloudflare, wrangler]
  patterns: [app-router, route-groups, client-components, zustand-persist, emotion-rtl-cache]
key_files:
  created:
    - src/theme/theme.ts
    - src/theme/rtlCache.ts
    - src/types/index.ts
    - src/store/uiStore.ts
    - src/lib/i18n.ts
    - src/components/providers/AppProviders.tsx
    - src/components/layout/Sidebar.tsx
    - src/components/layout/TopAppBar.tsx
    - src/components/layout/BottomNav.tsx
    - src/components/layout/PageWrapper.tsx
    - src/components/shared/LangToggle.tsx
    - src/app/(app)/layout.tsx
    - public/locales/en/common.json
    - public/locales/ar/common.json
    - open-next.config.ts
    - wrangler.jsonc
  modified:
    - package.json
    - tsconfig.json
    - next.config.ts
    - .gitignore
    - src/app/layout.tsx
decisions:
  - Used route group (app) for authenticated layout instead of nested dashboard layout
  - Client-side i18n via i18next-http-backend (not next-i18next SSR) for App Router compatibility
  - MUI v6 slotProps API for component customization (not deprecated *Props)
  - Zustand persist middleware for language/theme preferences
metrics:
  duration: "21 minutes"
  completed: "2026-04-20"
  tasks: 6
  files: 25
---

# Phase 01: Foundation & Setup Summary

**JWT auth with MUI Deep Indigo theme, bilingual RTL/LTR support, responsive SaaS layout, and Cloudflare Workers deployment config**

## What Was Built

### Plan 01-01: Project Init
- Next.js 16.2.4 with App Router, TypeScript strict, src/ directory
- MUI v6 theme with Deep Indigo (#3F51B5), 8px border radius, Inter/Cairo fonts
- All dependencies installed (MUI, Zustand, React Query, DnD Kit, React PDF, etc.)
- Core TypeScript interfaces for all 9 database entities
- Emotion RTL cache for Arabic support

### Plan 01-02: i18n & State
- Zustand UI store (language, themeMode, sidebarOpen) with localStorage persistence
- i18next configured with HTTP backend loading JSON translation files
- Complete EN/AR translations for nav, common, auth, tasks, products, invoices, quotations, settings
- AppProviders component wiring: CacheProvider → ThemeProvider → CssBaseline → QueryClientProvider

### Plan 01-03: Layout & Cloudflare
- Responsive sidebar (240px, collapsible to 64px icon-only mode)
- TopAppBar with hamburger, dynamic page title, language toggle, avatar
- BottomNavigation for mobile (<900px) with 4 items
- PageWrapper composing sidebar + appbar + content + bottom nav
- LangToggle component switching EN/AR with visual state
- All route placeholders under (app) route group
- Cloudflare Workers config: wrangler.jsonc, open-next.config.ts, preview/deploy scripts

## Commits

| Hash | Message |
|------|---------|
| 3ee52e9 | feat(01-01): initialize Next.js project with MUI theme and TypeScript |
| d3bc4f6 | feat(01-02): add i18n (AR/EN), RTL/LTR switching, Zustand UI store |
| ea75d4a | feat(01-03): responsive layout shell and Cloudflare deployment config |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm naming restriction — uppercase "SLT" not allowed**
- **Found during:** Plan 01-01 Task 1
- **Issue:** `create-next-app` refused project name "SLT" due to npm uppercase restriction
- **Fix:** Used `npm init -y` (creates lowercase "slt") then installed dependencies manually
- **Files modified:** package.json

**2. [Rule 1 - Bug] MUI v6 removed primaryTypographyProps**
- **Found during:** Plan 01-03 Task 1
- **Issue:** MUI v6 uses `slotProps.primary.sx` instead of deprecated `primaryTypographyProps`
- **Fix:** Updated Sidebar.tsx to use `slotProps={{ primary: { sx: {...} } }}`
- **Files modified:** src/components/layout/Sidebar.tsx

**3. [Rule 1 - Bug] Missing @types/stylis**
- **Found during:** Plan 01-01 Task 2
- **Issue:** stylis module had no type declarations, causing strict TS error
- **Fix:** Installed @types/stylis as devDependency
- **Files modified:** package.json

## Verification

- `npm run dev` → Server starts on localhost:3000 (Ready in 652ms)
- `npx tsc --noEmit` → Passes with zero errors
- `.dev.vars` detected by wrangler during dev
- All route group pages accessible

## Self-Check: PASSED
