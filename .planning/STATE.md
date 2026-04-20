# STATE.md — Current Project State

## Position
- **Current Phase:** 01-foundation (not started)
- **Blockers:** None
- **Next Action:** Execute Phase 01

## Decisions
- Supabase accessed via Next.js API routes (server-side only) — not direct client calls
- MUI v6 with sx prop — no Tailwind
- Cloudflare Workers deployment via OpenNext adapter
- Bilingual: Arabic (RTL) + English (LTR) via next-i18next

## Pending User Actions
- [ ] Create Supabase project and provide URL + anon key + service role key
- [ ] Create `.env.local` with Supabase credentials
- [ ] Configure Supabase Auth email provider in dashboard
- [ ] (Optional) Cloudflare account for deployment
