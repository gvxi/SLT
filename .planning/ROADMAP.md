# ROADMAP.md — SLT Build Phases

## Phase Overview

| Phase | Name | Depends On | Plans | Status |
|-------|------|------------|-------|--------|
| 01 | Foundation & Setup | — | 3 plans | pending |
| 02 | Database & Auth | 01 | 3 plans | pending |
| 03 | Task Management | 02 | 2 plans | pending |
| 04 | Product Catalog | 02 | 2 plans | pending |
| 05 | Invoice Management | 02, 04 | 3 plans | pending |
| 06 | Quotation Management | 05 | 2 plans | pending |
| 07 | Dashboard & Analytics | 03, 04, 05 | 2 plans | pending |
| 08 | Settings & Polish | 01-07 | 2 plans | pending |

---

### Phase 01: Foundation & Setup
**Goal:** Working Next.js app with MUI theme, i18n (AR/EN with RTL), Supabase client, layout shell (sidebar + appbar + bottom nav), and Cloudflare deployment config.

**Plans:** 3 plans
Plans:
- [ ] 01-01-PLAN.md — Next.js init, MUI theme, TypeScript config, fonts
- [ ] 01-02-PLAN.md — i18n setup (next-i18next, AR/EN, RTL/LTR switching)
- [ ] 01-03-PLAN.md — Layout shell (Sidebar, TopAppBar, BottomNav, responsive), Cloudflare config

---

### Phase 02: Database & Auth
**Goal:** Supabase schema deployed, RLS policies active, auth flow working (login/register pages), protected routes, Supabase API routes pattern established.

**Plans:** 3 plans
Plans:
- [ ] 02-01-PLAN.md — Supabase schema SQL (all tables), RLS policies, DB functions
- [ ] 02-02-PLAN.md — Next.js API route pattern for Supabase, server-side client setup
- [ ] 02-03-PLAN.md — Auth pages (login/register), auth middleware, protected routes

---

### Phase 03: Task Management
**Goal:** Working Kanban board with drag-and-drop, task CRUD, task detail drawer, filters.

**Plans:** 2 plans
Plans:
- [ ] 03-01-PLAN.md — Task API routes + hooks, task types, CRUD operations
- [ ] 03-02-PLAN.md — Kanban UI (board, columns, cards, drag-drop, detail drawer, filters)

---

### Phase 04: Product Catalog
**Goal:** Product CRUD with table/grid toggle, inline editing, category management.

**Plans:** 2 plans
Plans:
- [ ] 04-01-PLAN.md — Product API routes + hooks, product types, CRUD operations
- [ ] 04-02-PLAN.md — Product UI (table, grid view, inline edit, product form, CSV import)

---

### Phase 05: Invoice Management
**Goal:** Invoice CRUD with line items linked to products, status workflow, PDF export.

**Plans:** 3 plans
Plans:
- [ ] 05-01-PLAN.md — Invoice & client API routes + hooks, types, CRUD, auto-numbering
- [ ] 05-02-PLAN.md — Invoice UI (list, form with line items, status management)
- [ ] 05-03-PLAN.md — PDF export templates for invoices (@react-pdf/renderer)

---

### Phase 06: Quotation Management
**Goal:** Quotation CRUD, PDF export, convert-to-invoice action.

**Plans:** 2 plans
Plans:
- [ ] 06-01-PLAN.md — Quotation API routes + hooks, convert-to-invoice logic
- [ ] 06-02-PLAN.md — Quotation UI (list, form, PDF export, conversion action)

---

### Phase 07: Dashboard & Analytics
**Goal:** KPI cards, charts (tasks by status, revenue), recent activity feed.

**Plans:** 2 plans
Plans:
- [ ] 07-01-PLAN.md — Dashboard API routes (aggregation queries), analytics hooks
- [ ] 07-02-PLAN.md — Dashboard UI (KPI cards, Recharts, activity feed)

---

### Phase 08: Settings & Polish
**Goal:** Settings page, theme toggle, language preferences, final cross-cutting polish.

**Plans:** 2 plans
Plans:
- [ ] 08-01-PLAN.md — Settings page (theme, language, profile), Zustand store completion
- [ ] 08-02-PLAN.md — Final polish (loading states, error boundaries, empty states, mobile QA)
