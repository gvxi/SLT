---
phase: "03-task-management"
plan: "01"
subsystem: "task-management"
tags: ["kanban", "drag-and-drop", "dnd-kit", "tasks", "checklists", "react-query"]
dependency_graph:
  requires: ["02-03"]
  provides: ["tasks-ui", "kanban-board", "task-crud"]
  affects: ["types/index.ts", "locales"]
tech_stack:
  added: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
  patterns: ["DndContext + useDroppable + useSortable", "URL param filters", "optimistic checklist updates"]
key_files:
  created:
    - src/components/tasks/KanbanBoard.tsx
    - src/components/tasks/KanbanColumn.tsx
    - src/components/tasks/TaskCard.tsx
    - src/components/tasks/TaskDrawer.tsx
    - src/components/tasks/TaskFilters.tsx
    - src/app/(app)/tasks/[id]/page.tsx
    - src/app/api/tasks/[id]/checklists/route.ts
    - src/app/api/tasks/[id]/checklists/[itemId]/route.ts
    - src/app/api/profiles/route.ts
    - src/hooks/useProfiles.ts
  modified:
    - src/app/(app)/tasks/page.tsx
    - src/types/index.ts
    - public/locales/en/common.json
    - public/locales/ar/common.json
decisions:
  - "Drawer state lifted to TasksPage (not inside KanbanBoard) for clean separation"
  - "Drag activationConstraint: distance 8px to allow clicks without triggering drag"
  - "Optimistic updates on checklist toggle; revert on API failure"
  - "Profiles list API at /api/profiles for assignee selector"
  - "closestCenter collision detection handles both column and card drop targets"
metrics:
  duration: "~45min"
  completed: "2026-04-20"
  tasks_completed: 2
  files_created: 10
  files_modified: 4
---

# Phase 03 Plan 01: Task Management Summary

Kanban board with @dnd-kit drag-and-drop, full CRUD via right-side drawer, checklist management, and bilingual URL-param filters.

## What Was Built

**Kanban Board** (`KanbanBoard.tsx`): `DndContext` wraps 4 `KanbanColumn` droppable zones. `PointerSensor` with 8px activation distance to preserve click-to-open. `DragOverlay` renders floating `TaskCard` during drag. On `dragEnd`, resolves drop target to column or sibling card's column and calls `useUpdateTask` to persist status.

**Kanban Column** (`KanbanColumn.tsx`): `useDroppable(status)` + `SortableContext`. Shows task count chip, empty state, skeleton loading, and bottom "Add task" button. Background transitions on `isOver`.

**Task Card** (`TaskCard.tsx`): `useSortable`. Shows title, priority chip (color-coded, outlined, 8px radius), due date, assignee avatar. `isDragOverlay` prop bypasses ref/listeners for the floating overlay version.

**Task Filters** (`TaskFilters.tsx`): Priority and assignee selects write to URL search params via `router.replace`. `KanbanBoard` reads params via `useSearchParams` and passes to `useTasks()`.

**Task Drawer** (`TaskDrawer.tsx`): Right-side MUI Drawer, 480px wide (full width mobile). RHF + Zod. Fields: title, description, status, priority, assignee (profiles dropdown with avatars), due date. Checklist section (edit mode only): optimistic toggle, add on Enter/button, delete with revert. Delete with Dialog confirmation.

**Task Detail Page** (`tasks/[id]/page.tsx`): Same form in full-page layout, back button to /tasks, same checklist management.

**New API Routes:**
- `POST /api/tasks/[id]/checklists` — create checklist item
- `PATCH /api/tasks/[id]/checklists/[itemId]` — toggle done / update label  
- `DELETE /api/tasks/[id]/checklists/[itemId]` — remove item
- `GET /api/profiles` — list all profiles for assignee selector

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Typography `fontWeight` prop incompatible with MUI v6 strict types**
- **Found during:** TypeScript check
- **Issue:** `<Typography fontWeight={600}>` fails strict TS — must use `sx={{ fontWeight: 600 }}`
- **Fix:** Changed all instances to `sx` prop
- **Files modified:** KanbanColumn, TaskDrawer, tasks/page.tsx, tasks/[id]/page.tsx

**2. [Rule 1 - Bug] `@mui/icons-material/DeleteOutline` does not exist**
- **Found during:** TypeScript check
- **Issue:** Icon path wrong
- **Fix:** Changed to `@mui/icons-material/Delete`
- **Files modified:** TaskDrawer.tsx, tasks/[id]/page.tsx

**3. [Rule 1 - Bug] MUI v6 Drawer uses `slotProps.paper` not `PaperProps`**
- **Found during:** TypeScript check
- **Fix:** `PaperProps={{sx:...}}` → `slotProps={{ paper: { sx: ... } }}`
- **Files modified:** TaskDrawer.tsx

**4. [Rule 1 - Bug] Zod `.optional().default("")` creates `string | undefined` resolver mismatch**
- **Found during:** TypeScript check
- **Fix:** Changed `z.string().optional().default("")` → `z.string()` (required), kept `defaultValues` in useForm
- **Files modified:** TaskDrawer.tsx, tasks/[id]/page.tsx

**5. [Rule 2 - Missing] Phase 01 bugfixes (SplashScreen, PageWrapper, i18n) never committed**
- **Found during:** `git status` review
- **Fix:** Included in this commit as they were complete but unstaged
- **Files modified:** SplashScreen.tsx, PageWrapper.tsx, i18n.ts

## Self-Check: PASSED

- ✅ `src/components/tasks/KanbanBoard.tsx` exists
- ✅ `src/components/tasks/TaskDrawer.tsx` exists
- ✅ `src/app/api/profiles/route.ts` exists
- ✅ Commit `8cd9c6b` confirmed in git log
