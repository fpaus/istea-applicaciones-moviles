## Context

The dashboard (`app/(app)/index.tsx`) renders `CardItem` rows whose only entry
point into a task is the "Editar" button → `edit.tsx`. `edit.tsx` is the
"Edit / Detail / Subtree" screen and is editing-oriented. We need a **read-only**
view that is the natural landing place when a user taps a task, and that the
later attribute changes (image/location/responsible/calendar) will render into.

## Goals / Non-Goals

**Goals**
- A pushed, read-only screen showing a single task's full details.
- Reachable by tapping the card body on the dashboard (and tapping a subtask).
- An "Editar" affordance to jump into the existing edit flow.

**Non-Goals**
- No editing, completing, or deleting of the task **itself** from the detail screen (those stay on the dashboard / edit). Listed subtasks, however, expose a completion control.
- No domain-model change. No new native module (this is pure navigation/UI).
- Not removing or altering the existing edit screen's subtree-management behavior.

## Decisions

### Routing: flat `detail.tsx` with params (mirror `edit.tsx`)
`edit.tsx` is a flat route reading `projectId` + `taskId` via `useLocalSearchParams`.
For consistency we add `app/(app)/detail.tsx` following the same pattern, registered
in `app/(app)/_layout.tsx` with a Spanish title ("Detalle de Tarea") and a back
affordance ("Volver"). Navigation: `router.push({ pathname: "/detail", params: { projectId, taskId } })`.

### View-model hook: `useTaskDetail`
Per CONTEXT.md ("no logic in components — encapsulate everything in custom hooks"
and "one hook per file"), a new `src/hooks/useTaskDetail.ts` selects the task by id
from the task store, derives its direct subtasks and direct-children progress
(reusing existing cascade/selector helpers), and returns `goToEdit()` and
`openSubtask(id)` navigation callbacks. The screen stays presentational.

### Card interaction model
`CardItem` gains an optional `onOpen?: (id: string) => void`. The card body
(title/description area) becomes tappable to call `onOpen`; the existing
"Editar"/"Eliminar" buttons keep their own `onPress` and must not trigger
`onOpen` (separate touch targets). When `onOpen` is undefined the card behaves
exactly as today (backward compatible — used by `edit.tsx`'s subtree rendering
which should not navigate away unexpectedly).

### Read-only task, actionable subtasks
The task's own attributes (title/description/reminder/progress) render read-only,
reusing the existing reminder-formatting and progress-bar presentation from
`CardItem` for visual consistency. Each listed subtask carries a completion
control (wired to `useTaskCompletion`, applying the same invariant/cascade) and is
otherwise tappable to open its own detail. The detail view renders only the
attributes that exist today; later changes extend it.

### Missing task guard
If the task id is not found (e.g. deleted while navigating), the screen shows a
Spanish empty/not-found state ("Tarea no encontrada") rather than crashing —
consistent with the app's resilience posture.

## Risks / Trade-offs

- **Two views into a task (detail + edit).** Mitigated: detail is read-only and
  always offers "Editar"; edit keeps subtree management. Clear separation of intent.
- **Card tap vs. button taps overlapping.** Mitigated by distinct touch targets
  (body `Pressable` vs. button `onPress`); covered by a test asserting that
  pressing "Eliminar" does not also invoke `onOpen`.

## Migration Plan

Additive only. No data migration. Existing edit flow and dashboard buttons unchanged.

## Open Questions

- Should the detail screen eventually absorb the read-only subtree currently shown
  in `edit.tsx`? Out of scope here; revisit once the attribute changes land.
