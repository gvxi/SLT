# AGENTS.md

Always-on guidance for AI coding agents in this repository.

## Quick Start

- **Framework**: Next.js 16 with App Router + TypeScript
- **UI**: MUI v6 + Emotion — `sx` prop only (no Tailwind, no inline styles)
- **State**: Zustand (UI/local) + React Query (server data)
- **i18n**: `react-i18next` — Arabic/English with full RTL support
- **DB**: Supabase (Postgres + Auth + Storage)
- **Deploy**: Vercel — avoid `export const runtime = 'edge'` unless required

## Essential Commands

```bash
npm clean-install          # Install (reproducible builds)
npm run dev                # Dev server (port 3000)
npm run build --webpack    # Production build
npx tsc --noEmit           # Type checking — run before committing
```

## Critical Constraints

1. **TypeScript strict only** — no `.js` files, no `any` types
2. **No hardcoded text** — use `t('namespace.key')` from `react-i18next`
3. **RTL support required** — components must work in Arabic direction
4. **MUI only** — use `sx` prop or `styled()`; no custom CSS frameworks
5. **Forms**: React Hook Form + Zod schemas co-located with the form component
6. **Supabase queries** belong in custom hooks (`src/hooks/`), never in page components
7. **Mobile-first** — test bottom nav behavior at < 900px
8. **Import alias**: `@/*` maps to `src/*`

## Source Layout

```
src/
  app/           # App Router pages + API routes (src/app/api/**)
  components/    # Reusable UI; PDF templates in components/documents/
  hooks/         # React Query + Supabase data hooks
  lib/           # Shared utilities (see Key Utilities below)
  store/         # Zustand: uiStore.ts (theme/lang), toastStore.ts
  types/         # Shared TypeScript interfaces (src/types/index.ts)
  theme/         # MUI theme + RTL Emotion cache (rtlCache.ts)
```

## Key Utilities

| Utility | Path | Purpose |
|---------|------|---------|
| `apiFetch` | `src/lib/api.ts` | Authenticated client-side API calls |
| `requireAuth` | `src/lib/supabase/middleware.ts` | Protect API routes — returns `{ user }` or `NextResponse` 401 |
| `createServerSupabaseClient` | `src/lib/supabase/server.ts` | Service-role Supabase client for API routes |
| `logActivity` | `src/lib/logActivity.ts` | Log mutations to activity_logs table |
| `queryKeys` | `src/lib/queryKeys.ts` | TanStack Query key factories — always use, never hardcode keys |
| `toast` | `src/store/toastStore.ts` | Global toast: `toast('message', 'success')` |

## API Route Pattern

```ts
export async function POST(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;                          // 401 NextResponse
  const body = await request.json();               // validate with Zod
  const supabase = createServerSupabaseClient();   // service-role client
  // ...query, then call logActivity()
}
```

## Gotchas

- `@react-pdf/renderer` is heavy — keep PDF components in `src/components/documents/`
- Invoice/Quotation numbers are auto-generated server-side via Supabase trigger — never generate client-side
- Arabic fields (`name_ar`, `notes_ar`) are optional in DB but **must render when present**
- Kanban drag-and-drop must optimistically update local state before the Supabase mutation
- Bilingual naming convention: `name_en` / `name_ar`, `notes` / `notes_ar`
- Cron job: `/api/cron/alerts` runs daily at 09:00 UTC (configured in `vercel.json`)

## Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # server-only, never expose to client
```

## Reference

For deeper patterns and conventions:

- **Frontend & MUI patterns**: [.copilot/FRONTEND_SKILLS.md](.copilot/FRONTEND_SKILLS.md)
- **UI/UX guidelines**: [.copilot/UI_UX_GUIDELINES.md](.copilot/UI_UX_GUIDELINES.md)
- **Business module patterns**: [.copilot/PROJECT_SPECIFICS.md](.copilot/PROJECT_SPECIFICS.md)
- **i18n locale keys**: `public/locales/en/common.json`
- **Type definitions**: `src/types/index.ts`
- **DB schema**: `supabase/schema.sql`