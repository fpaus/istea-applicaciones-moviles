## Why

Tapping a task today only ever reaches the **edit** screen — there is no way to
simply *read* a task's full details without entering an editing flow. This change
adds a read-only task detail view. It is also the **foundation** for the next four
changes (image, location, responsible, calendar event): the detail view is the
canvas where each new attribute is displayed, so it must exist first.

## What Changes

- Add a **read-only task detail screen** reachable by tapping a task card on the dashboard.
- The detail screen displays the task's title, description, reminder, and (if it has children) its direct-children subtask progress — all read-only.
- The detail screen lists the task's direct subtasks read-only; tapping a subtask opens that subtask's detail view.
- The detail screen exposes an **"Editar"** affordance that navigates to the existing edit screen.
- The existing per-row "Editar"/"Eliminar" buttons on the dashboard card remain unchanged; this change adds tapping the card body as the gesture that opens read mode.
- No domain-model change, no new native module, no new dependency.

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `navigation-flow`: a task opens in a dedicated read-only detail view from the dashboard, distinct from the edit screen.

## Impact

- **New route**: `app/(app)/detail.tsx` (pushed screen, reads `projectId` + `taskId` via `useLocalSearchParams`, consistent with `edit.tsx`).
- **New hook**: `src/hooks/useTaskDetail.ts` (view-model: selects the task + its direct-children progress, exposes navigation to edit).
- **`src/components/CardItem.tsx`**: card body becomes tappable to open detail (`onOpen`), preserving existing button actions.
- **`app/(app)/_layout.tsx`**: register the `detail` screen in the Stack.
- **Spec**: `navigation-flow`.
- Spanish UI strings throughout; no business-logic in components (logic lives in `useTaskDetail`), per `openspec/CONTEXT.md`.
