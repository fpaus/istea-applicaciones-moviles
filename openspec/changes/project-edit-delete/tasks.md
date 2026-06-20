## 1. Project store — rename (Red → Green)

- [ ] 1.1 (Red) Tests for `renameProject`: updates name; rejects case-insensitive duplicate; updates `currentProject` when the active project is renamed; allows renaming a project to a different case of its own name.
- [ ] 1.2 (Green) Implement `renameProject(id, name)` in `src/stores/project-store.ts` (normalized uniqueness excluding own id).

## 2. Project store — delete + task cascade (Red → Green)

- [ ] 2.1 (Red) Tests for `deleteProject`: removes from list; clears `currentProject` when the deleted project was active; leaves others intact.
- [ ] 2.2 (Green) Implement `deleteProject(id)` in `src/stores/project-store.ts`.
- [ ] 2.3 (Red) Tests for `task-store.removeProjectTasks(projectId)`: cancels each task's notification and drops the project's key immutably.
- [ ] 2.4 (Green) Implement `removeProjectTasks` in `src/stores/task-store.ts` (uses the injected scheduler; stays decoupled).

## 3. Cascade orchestration hook (Red → Green)

- [ ] 3.1 (Red) Tests for `useProjectActions.deleteProject`: calls `removeProjectTasks(id)` then `projectStore.deleteProject(id)`; surfaces an `Alert` confirmation and only deletes on confirm.
- [ ] 3.2 (Green) Implement `src/hooks/useProjectActions.ts` orchestrating the cascade with a Spanish confirmation dialog.

## 4. UI affordances

- [ ] 4.1 Add rename/delete affordances to the project switcher rows (presentational; logic in hooks; Spanish copy).
- [ ] 4.2 Wire rename input + delete confirmation through `useProjectActions` / the selector hook.

## 5. Docs & validation

- [ ] 5.1 Update `openspec/CONTEXT.md`: project features (rename/delete), store actions, and remove the "projects can only be created" limitation.
- [ ] 5.2 Run the full Jest suite, `tsc --noEmit`, and lint; run `openspec validate project-edit-delete --strict`.
