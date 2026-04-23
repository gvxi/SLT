# AGENT.md

This file is the minimal always-on guidance for coding agents in this repository.

## Use First

- UI and frontend conventions: [.copilot/README.md](.copilot/README.md)
- Deployment platform: Vercel

## Project Snapshot

- Stack: Next.js App Router + TypeScript + MUI + React Query + Zustand + Supabase.
- i18n: Arabic/English with RTL support (`react-i18next`, locales in `public/locales`).
- Server data access is via App Router API routes in `src/app/api/**`.

## Commands Agents Should Use

- Install deps: `npm clean-install`
- Dev server: `npm run dev`
- Type-check: `npx tsc --noEmit`
- Local Next build: `npm run build`

## Repo-Specific Conventions

- Keep app routes and API routes in `src/app/**`.
- Keep auth checks in API routes via `requireAuth` from `src/lib/supabase/middleware.ts`.
- Use `apiFetch` for client-side calls to app APIs.
- Keep translation strings in locale JSON files; avoid hardcoded UI text.
- The Next request interceptor file uses the new convention: `src/proxy.ts`.

## Known Pitfalls

- Do not add `export const runtime = 'edge'` to routes unless explicitly required by platform strategy.
- `@react-pdf/renderer` is heavy and can impact bundle/runtime constraints.

## Scope Boundaries

- Keep changes focused and minimal.
- Do not rewrite architecture docs or duplicate guidance from existing docs.
- Prefer linking existing docs over embedding large policy blocks.

## Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Deployment

- Primary hosting is Vercel.
- Prefer standard Next.js behavior and Vercel-compatible changes.
- Do not introduce Cloudflare-specific deployment assumptions unless the user explicitly asks for them.

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
