# PROJECT.md — SLT Business Management Web App

## Overview
Bilingual (Arabic/English) all-in-one business management web app covering task management (Kanban), product catalog, invoice/quotation management with PDF export, dashboard analytics, and full RTL/LTR support.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict)
- **UI:** MUI v6 (sx prop, no Tailwind)
- **Backend/DB:** Supabase (PostgreSQL) — accessed via Next.js API routes (not direct client calls)
- **Auth:** Supabase Auth (email/password + magic link)
- **State:** Zustand (client) + React Query (server)
- **PDF:** @react-pdf/renderer
- **i18n:** next-i18next (AR + EN, RTL/LTR)
- **Forms:** React Hook Form + Zod
- **DnD:** @dnd-kit/core
- **Charts:** Recharts
- **Deploy:** Cloudflare Workers via OpenNext adapter

## Architecture Decision
All Supabase queries go through Next.js API routes (`/app/api/...`). Client components call these routes via React Query hooks. This keeps the Supabase service key server-side and provides a clean API layer.

## Key Constraints
1. TypeScript only — no .js/.jsx files
2. No hardcoded text — always use t('key') from next-i18next
3. MUI components must respect active theme and direction
4. Supabase queries in API routes, consumed by custom hooks
5. Forms use React Hook Form + Zod
6. Mobile-first, responsive design
7. No inline styles — MUI sx prop or styled() only
