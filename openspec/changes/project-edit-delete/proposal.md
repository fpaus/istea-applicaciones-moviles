## Why

Projects can currently only be **created** — never renamed or deleted. A typo in
a project name is permanent, the project list only grows, and there is no way to
remove a project the user is done with (or its tasks). Project lifecycle
management is the first wall real users hit.

## What Changes

- Add **rename project**: change a project's name, enforcing the same
  normalized, case-insensitive uniqueness used at creation.
- Add **delete project**, which **cascades**: the project is removed, its tasks
  are removed and their scheduled notifications cancelled, and if it was the
  active project the dashboard returns to the project selector.
- Add UI affordances in the project switcher to rename/delete a project
  (e.g. per-row edit/delete), with a **confirmation step** before deletion.
- Keep the stores **decoupled**: the cascade is orchestrated by a hook that calls
  the task store and the project store in turn (no store imports another store).

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `state-management`: the project store gains `renameProject` and `deleteProject`
  actions; the task store gains a way to drop a project's tasks (cancelling their
  notifications). Deleting the active project clears `currentProject`.

## Non-goals

- Project archiving, color/metadata, or reordering.
- Multi-select / bulk delete, and undo for deletion.
- Moving tasks between projects.

## Impact

- **Code:** `src/stores/project-store.ts` (rename/delete), `src/stores/task-store.ts`
  (remove-project-tasks + cancel notifications), a `useProjectActions` hook to
  orchestrate the cascade, and `ProjectSelector` UI affordances.
- **Rules:** stores stay decoupled (cascade via a hook); no logic/primitive hooks
  in components; UI strings in Spanish; confirmation before destructive actions —
  per `openspec/CONTEXT.md`.
- **Docs:** update `openspec/CONTEXT.md` (project features, store actions,
  known-limitation note that delete is now supported).
