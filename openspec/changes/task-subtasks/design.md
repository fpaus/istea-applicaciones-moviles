## Context

After `task-editing-optional-reminders`, a `Task` has an optional grouped
`notification`, and the store exposes `addTask` and `updateTask` (inline, atomic,
resilient via `safeCancel`). Tasks are stored flat per project
(`tasks[projectId] = Task[]`) and completion is a one-way flag flip. There is no
hierarchy. Stores never import one another; cross-cutting orchestration with
confirmation dialogs lives in hooks (e.g. `useTaskActions`, `useProjectActions`).

## Goals / Non-Goals

**Goals:**

- Represent arbitrary-depth subtasks without abandoning the flat store.
- Make completion and deletion behave correctly and predictably across the tree.
- Keep cascade logic pure and testable; keep prompts in hooks; keep UI in Spanish.

**Non-Goals:**

- Re-parenting, reordering, bulk ops, undo.

## Decisions

### Flat storage + `parentId`, tree derived in a selector

Tasks remain a flat array per project; each carries `parentId?: string | null`
(roots are null). This preserves today's O(1)-ish array ops and keeps
`clearNotificationId`, persistence, and find-by-id flat — a subtask is just
another row. A selector derives the children tree (`groupBy(parentId)`) for
rendering, and pure helpers compute `descendants(id)` / `ancestors(id)` by walking
`parentId` links.
*Alternative:* store a literal nested `children: Task[]` tree — rejected because
every deep update would have to immutably rebuild the path to the node, and
notification scanning would need to recurse.

### One invariant governs completion

> **A task marked `completed` ⟹ all of its descendants are `completed`.**

All rules restore this invariant:

```
complete node w/ open descendants  → confirm → completeTask(node)  (node + descendants)
re-open node                       → reopenTask(node)              (node + ancestors)
complete last open child           → invariant allows parent → PROMPT to complete parent
add open child to completed parent → reopen ancestors (auto)
```

`completeTask(tasks, id)` and `reopenTask(tasks, id)` are **pure transforms** over
the flat list (returning a new list). The store actions apply them; the
**Alert prompts live in a hook** (e.g. `useTaskCompletion`) that decides which
transform to run based on the tree state. Cancel on the "complete anyway" prompt
is a no-op.

### Completion and re-open reconcile reminders

Completing a node cancels its reminder (sets `notification.notificationId` null),
as today, for the node and every descendant completed in the cascade — via
`safeCancel`. Re-opening a node **reschedules** its reminder when present:
repeating reminders always; one-shot reminders only if their time is still in the
future; past one-shots are silently skipped. All scheduling/cancellation is inline
and resilient (a failure never aborts the data mutation).

### Cascade delete scoped to a subtree

Deleting a task removes the node and all `descendants(id)` and cancels each one's
notification (`safeCancel`) — effectively `removeProjectTasks` scoped to a
subtree. Orchestrated by the existing delete hook so stores stay decoupled.

### Dashboard shows roots; subtrees live in detail

The dashboard lists only root tasks: Active = roots with `completed: false`,
Completed = roots with `completed: true` (the invariant keeps this honest). Each
root shows a progress badge from its **direct** children. A task's detail/edit
view renders its subtree, and every subtask that has children shows its own
direct-children progress bar.

### Reminder titles

Root-task reminders keep the `[Project] Title` prefix; subtask reminders use the
plain title (a subtask is already contextual within its parent). Scheduling picks
the prefix based on whether the task has a `parentId`.

## Risks / Trade-offs

- **[Risk] Invariant drift** (e.g. completed parent gains an open child) → the
  add path auto-reopens ancestors; covered by tests on the pure transforms.
- **[Risk] Reschedule-on-reopen edge cases** (past one-shots) → explicit rule:
  reschedule repeats always, future one-shots only, skip past one-shots.
- **[Risk] Deep trees and recursion cost** → flat storage keeps writes cheap;
  recursion is confined to rendering and the pure descendants/ancestors walks.
- **[Risk] Orphaned notifications on cascade delete** → cancel every descendant's
  notification via `safeCancel` before/with removal.
