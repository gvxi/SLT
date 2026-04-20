# AGENT.md — Task & Product Management Web App

## Project Overview

A bilingual (Arabic / English) all-in-one business management web app covering:
- Task management with Kanban board & job status workflow
- Product catalog & inventory management
- Invoice & quotation management (with PDF export)
- Dashboard & analytics
- Full RTL/LTR support (AR/EN)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, file-based routing) |
| Language | TypeScript |
| UI Library | MUI (Material UI) v6 |
| Styling | MUI `sx` prop + `theme.ts` (no Tailwind) |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + magic link) |
| State Management | Zustand (client state) + React Query (server state) |
| PDF Export | `@react-pdf/renderer` |
| i18n | `next-i18next` (AR + EN, RTL/LTR switching) |
| Forms | React Hook Form + Zod |
| Drag & Drop (Kanban) | `@dnd-kit/core` |
| Charts | Recharts |

---

## Visual Style

- **Vibe:** Corporate & Professional
- **Theme:** Light mode primary, optional dark mode toggle
- **Primary color:** Deep Indigo `#3F51B5` (MUI default — can be overridden in `theme.ts`)
- **Typography:** `Inter` (LTR), `Cairo` (RTL/Arabic)
- **Border radius:** `8px` globally
- **Density:** Comfortable (MUI `dense` tables, compact cards)

---

## Layout & Navigation

### Desktop (≥ 900px) — SaaS Layout
```
┌──────────────┬───────────────────────────────────┐
│   Sidebar    │         Top AppBar                │
│  (240px)     │  [Page Title]   [Search] [Avatar] │
│  collapsible ├───────────────────────────────────┤
│              │                                   │
│  Nav Items:  │         Page Content              │
│  - Dashboard │                                   │
│  - Tasks     │                                   │
│  - Products  │                                   │
│  - Invoices  │                                   │
│  - Quotation │                                   │
│  - Settings  │                                   │
└──────────────┴───────────────────────────────────┘
```

### Mobile (< 900px) — Google Bottom Navigation Style
```
┌────────────────────────────────────┐
│         Top AppBar                 │
│  [Hamburger]  [Title]  [Avatar]    │
├────────────────────────────────────┤
│                                    │
│           Page Content             │
│                                    │
├────────────────────────────────────┤
│  🏠 Home │ ✅ Tasks │ 📦 Products │ 🧾 Docs │
└────────────────────────────────────┘
```
- Bottom nav uses MUI `BottomNavigation` component
- Sidebar is hidden on mobile; top AppBar has a hamburger for a Drawer

---

## Pages & Routes

```
/                        → Redirect to /dashboard
/dashboard               → KPI cards + charts overview
/tasks                   → Kanban board (by status)
/tasks/[id]              → Task detail / edit
/products                → Product catalog grid/table
/products/[id]           → Product detail / edit
/invoices                → Invoice list (status filter)
/invoices/new            → Create invoice
/invoices/[id]           → View / edit / export PDF
/quotations              → Quotation list
/quotations/new          → Create quotation
/quotations/[id]         → View / edit / export PDF / convert to invoice
/settings                → App settings, language, theme
/auth/login              → Login page
/auth/register           → Register page
```

---

## Module Specifications

### 1. Dashboard (`/dashboard`)
- KPI cards: Open Tasks, Total Products, Unpaid Invoices, Pending Quotations
- Bar chart: Tasks by status (weekly)
- Line chart: Revenue from invoices (monthly)
- Recent activity feed

### 2. Task Management (`/tasks`)
- Kanban columns: `Backlog → In Progress → Review → Done`
- Each card shows: title, assignee avatar, priority badge, due date, linked product (optional)
- Drag & drop between columns via `@dnd-kit`
- Task detail drawer/modal: description, checklist, attachments, linked invoice/quotation
- Filter by: status, priority, assignee, date range

### 3. Product Catalog (`/products`)
- Table + Card grid toggle view
- Fields: SKU, name (AR/EN), category, unit price, stock qty, status (active/inactive)
- Quick inline edit for price & stock
- Bulk import via CSV
- Link products to tasks, invoices, quotations

### 4. Invoice Management (`/invoices`)
- Statuses: `Draft → Sent → Paid → Overdue → Cancelled`
- Fields: invoice number (auto), client info, line items (linked from products), tax %, discount, total
- PDF export using `@react-pdf/renderer` — branded template
- Duplicate invoice action
- Filter by status, date, client

### 5. Quotation Management (`/quotations`)
- Statuses: `Draft → Sent → Accepted → Rejected → Expired`
- Same structure as invoices
- "Convert to Invoice" one-click action
- PDF export with separate quotation template
- Link to tasks

---

## Supabase Schema (Core Tables)

```sql
-- Users handled by Supabase Auth (auth.users)

profiles          (id, full_name, avatar_url, role, lang_preference)
products          (id, sku, name_en, name_ar, category, unit_price, stock_qty, status, created_at)
tasks             (id, title, description, status, priority, assignee_id, due_date, product_id, created_at)
task_checklists   (id, task_id, label, is_done)
clients           (id, name_en, name_ar, email, phone, address)
invoices          (id, invoice_number, client_id, status, issue_date, due_date, tax_pct, discount, notes_en, notes_ar, created_by)
invoice_items     (id, invoice_id, product_id, description, qty, unit_price)
quotations        (id, quotation_number, client_id, status, issue_date, expiry_date, tax_pct, discount, notes_en, notes_ar, created_by, converted_invoice_id)
quotation_items   (id, quotation_id, product_id, description, qty, unit_price)
```

---

## i18n & RTL

- Language toggle: AR ↔ EN stored in user profile + `localStorage`
- When AR is active:
  - `dir="rtl"` on `<html>`
  - MUI `CacheProvider` with `rtlPlugin` (`stylis-plugin-rtl`)
  - Font switches to `Cairo`
- All user-facing strings go through `useTranslation()` — no hardcoded text
- Translation files: `public/locales/en/common.json` and `public/locales/ar/common.json`

---

## Project Structure

```
/app
  /dashboard/page.tsx
  /tasks/page.tsx
  /tasks/[id]/page.tsx
  /products/page.tsx
  /products/[id]/page.tsx
  /invoices/page.tsx
  /invoices/new/page.tsx
  /invoices/[id]/page.tsx
  /quotations/...
  /settings/page.tsx
  /auth/login/page.tsx
  layout.tsx              ← Root layout (ThemeProvider, i18n, QueryClient)

/components
  /layout
    Sidebar.tsx
    TopAppBar.tsx
    BottomNav.tsx         ← Mobile only
    PageWrapper.tsx
  /dashboard
    KpiCard.tsx
    RevenueChart.tsx
    TaskStatusChart.tsx
  /tasks
    KanbanBoard.tsx
    KanbanColumn.tsx
    TaskCard.tsx
    TaskDrawer.tsx
  /products
    ProductTable.tsx
    ProductGrid.tsx
    ProductForm.tsx
  /documents             ← Shared for invoices & quotations
    DocumentForm.tsx
    LineItemsTable.tsx
    PdfTemplate.tsx
    StatusChip.tsx
  /shared
    ConfirmDialog.tsx
    SearchBar.tsx
    LangToggle.tsx
    EmptyState.tsx

/lib
  supabaseClient.ts
  queryKeys.ts
  pdfExport.ts

/hooks
  useTasks.ts
  useProducts.ts
  useInvoices.ts
  useQuotations.ts
  useAuth.ts

/store
  uiStore.ts             ← Zustand: sidebar open, lang, theme mode

/theme
  theme.ts               ← MUI theme (light/dark, palette, typography)
  rtlCache.ts

/types
  index.ts               ← Shared TS interfaces

/public/locales
  /en/common.json
  /ar/common.json
```

---

## Cloudflare Deployment

This project deploys to **Cloudflare Workers** via the OpenNext adapter.

> **Agent instruction:** On first project open, check if `wrangler.jsonc` or `open-next.config.ts` are missing. If so, follow **`CLOUDFLARE_SETUP.md`** at the project root and execute all steps automatically before doing anything else.

Deployment commands:
```bash
npm run preview   # Test locally in Workers runtime
npm run deploy    # Build + deploy to Cloudflare
```

---

## Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Cloudflare Deployment Setup

> **Agent:** On first project open, check if `wrangler.jsonc` exists at the root.
> - If **missing** → execute all steps in `CLOUDFLARE_SETUP.md` automatically before doing anything else.
> - If **present** → skip setup and proceed normally.

See [`CLOUDFLARE_SETUP.md`](./CLOUDFLARE_SETUP.md) for the full automated setup instructions.

---

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

---

## Key Constraints for the Agent

1. **TypeScript only** — never create `.js` or `.jsx` files. All files must use `.ts` or `.tsx`. Enable `strict: true` in `tsconfig.json`. No use of `any` type unless absolutely unavoidable and explicitly commented.
2. **Never hardcode text** — always use `t('key')` from `next-i18next`.
2. **All MUI components** must respect the active theme (light/dark) and direction (RTL/LTR).
3. **Supabase queries** go inside custom hooks (`/hooks`), never directly in page components.
4. **Forms** use React Hook Form + Zod schemas co-located with the form component.
5. **PDF templates** are separate components in `/components/documents/` using `@react-pdf/renderer`.
6. **Mobile-first** for all new components — test bottom nav behavior on < 900px.
7. **No inline styles** — use MUI `sx` prop or `styled()` only.
8. **Kanban drag-and-drop** must optimistically update local state before Supabase mutation.
9. **Invoice / Quotation numbers** are auto-generated server-side via a Supabase function or trigger.
10. **Arabic content fields** (name_ar, notes_ar) are always optional but the UI must render them when present.
