## 1. Hierarchy in the model

- [x] 1.1 Add `parentId?: string | null` to `Task` in `src/types`; allow an optional `parentId` on `addTask` / `NewTask` creation path.
- [x] 1.2 (Red→Green) `addTask` with a `parentId` stores the task as a child; roots remain `parentId`-less. Tests in the store suite.

## 2. Pure cascade engine (Red → Green)

- [x] 2.1 (Red) Tests for pure helpers over the flat list: `descendants(tasks, id)`, `ancestors(tasks, id)`, `childrenOf(tasks, id)`.
- [x] 2.2 (Green) Implement the helpers (a pure module; no store/notification coupling).
- [x] 2.3 (Red) Tests for `completeTask(tasks, id)` (node + all descendants completed) and `reopenTask(tasks, id)` (node + all ancestors re-opened) as pure transforms.
- [x] 2.4 (Green) Implement `completeTask` / `reopenTask`.

## 3. Store — cascade delete & completion reminders (Red → Green)

- [x] 3.1 (Red) Tests: deleting a task removes it + all descendants and cancels each notification (resilient via `safeCancel`).
- [x] 3.2 (Green) Implement subtree cascade delete in the task store.
- [x] 3.3 (Red) Tests: completing cancels reminders for the node + cascaded descendants; re-opening reschedules (repeats always; future one-shot only; past one-shot skipped); failures never abort the mutation.
- [x] 3.4 (Green) Wire the pure transforms into store actions with inline, resilient reminder reconciliation; add `parentId`-aware reminder title (root = `[Project]` prefix, subtask = plain title).

## 4. Completion prompts hook (Red → Green)

- [x] 4.1 (Red) Tests for the completion hook: completing a node with open descendants surfaces a confirm and only cascades on confirm; completing the last open child prompts to complete the parent; adding an incomplete child to a completed parent re-opens ancestors.
- [x] 4.2 (Green) Implement the completion hook (Alerts in Spanish) orchestrating `completeTask`/`reopenTask`; keep stores decoupled and components presentational.

## 5. UI — dashboard roots + detail subtree

- [x] 5.1 Dashboard lists root tasks only; Active/Completed split by the root's `completed`; each root shows a direct-children progress indicator.
- [x] 5.2 Task detail/edit view renders the subtree, lets the user add subtasks, and shows a per-node direct-children progress indicator; wire delete (cascade) and complete/re-open through the hooks. Spanish copy.

## 6. Docs & validation

- [x] 6.1 Update `openspec/CONTEXT.md`: subtasks (`parentId`, derived tree), the completion invariant + cascade/re-open rules, cascade delete, dashboard-roots/detail-subtree rendering, and the reminder-title rule.
- [x] 6.2 Run the full Jest suite, `tsc --noEmit`, and lint; run `openspec validate task-subtasks --strict`.
