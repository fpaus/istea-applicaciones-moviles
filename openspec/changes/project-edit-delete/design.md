## Context

`project-store` today supports only `createProject` (with normalized,
case-insensitive uniqueness + auto-select), `selectProject`, and
`deselectProject`. `task-store` keys tasks by project id
(`Record<string, Task[]>`) and owns notification side-effects via an injected
`NotificationService`. A convention (CONTEXT.md) requires that **stores never
import one another** — cross-store coordination happens in hooks.

## Goals / Non-Goals

**Goals:**

- Add `renameProject` and `deleteProject` to the project store.
- Cascade deletion to the project's tasks and their notifications.
- Return to the selector when the active project is deleted.
- Keep stores decoupled; confirm before destructive actions; Spanish UI.

**Non-Goals:**

- Archiving, metadata, reordering, bulk delete, undo, moving tasks.

## Decisions

### Cascade is orchestrated by a hook, not by a store importing another

`task-store` gains `removeProjectTasks(projectId)` which cancels every task's
notification and drops the project's key from the dictionary (immutably). A new
`useProjectActions` hook orchestrates delete: call
`taskStore.removeProjectTasks(id)` then `projectStore.deleteProject(id)`.
- **Rationale**: preserves the decoupling rule and keeps each store's tests
  isolated.
- **Alternative**: have `project-store` import `task-store` and cascade directly —
  rejected (violates the no-store-imports-store convention).

### Active-project deletion clears the session

`projectStore.deleteProject(id)` removes the project and, if `currentProject?.id
=== id`, sets `currentProject = null`. The dashboard already renders the inline
`ProjectSelector` when `currentProject` is null, so the empty state is reused.

### Rename validation mirrors create

`renameProject(id, name)` trims + lowercases for the uniqueness check (excluding
the project being renamed) and stores the trimmed display name, matching
`createProject`. If the renamed project is active, `currentProject` is updated to
the new value.

### UI affordances + confirmation

The project switcher rows gain rename/delete affordances. Delete shows an
`Alert.alert` confirmation (consistent with task delete / clearAll). All copy in
Spanish. All state/logic lives in hooks (`useProjectActions` / the selector hook),
keeping components presentational.

## Risks / Trade-offs

- **[Risk] Orphaned task keys** if delete order is wrong → remove tasks before (or
  atomically with) the project; cover with a cascade test.
- **[Risk] Deleting the only/active project** mid-use → clearing `currentProject`
  routes back to the selector cleanly; verify no crash when the dictionary key is
  gone.
- **[Risk] Rename race with uniqueness** → validation excludes the project's own id
  so renaming to a different case of itself is allowed.
