# AGENTS.md

Minimal guidance for OpenCode agents working in this repository.

## Quick Start

- **Framework**: Next.js 16 with App Router + TypeScript
- **UI**: MUI v6 + Emotion styling (`sx` prop only)
- **State**: Zustand (client) + React Query (server)
- **i18n**: React-i18next with Arabic/English RTL support
- **DB**: Supabase

## Essential Commands

```bash
# Install (use clean-install for reproducible builds)
npm clean-install

# Development
npm run dev          # Start dev server (port 3000)

# Verification
npx tsc --noEmit     # Type checking
```

## Critical Constraints

- **TypeScript strict mode only** - no `.js` files, no `any` types
- **No hardcoded text** - always use `t('translation.key')` 
- **RTL support required** - components must handle Arabic direction
- **MUI components only** - no custom CSS frameworks
- **Forms**: React Hook Form + Zod validation
- **Mobile-first** - test responsive behavior

## Architecture Notes

- **Routes**: App Router in `src/app/**`
- **Components**: Reusable in `src/components/`
- **API**: App Router API routes (`src/app/api/**`)
- **Auth**: Supabase middleware in `src/lib/supabase/`
- **Theming**: MUI theme with RTL support
- **PDF**: `@react-pdf/renderer` for document generation

## Gotchas

- Avoid `export const runtime = 'edge'` unless explicitly required
- `@react-pdf/renderer` is heavy - be mindful of bundle size
- Arabic content fields are optional but must be rendered when present
- Kanban drag-and-drop uses optimistic updates

## Testing

- Always run type checking (`npx tsc --noEmit`) before committing
- Follow existing component testing patterns

## Reference

- UI conventions: [.copilot/README.md](.copilot/README.md)
- Component patterns: Check existing components in `src/components/`
- Form patterns: Look at existing form implementations
- API patterns: Check `src/app/api/` routes