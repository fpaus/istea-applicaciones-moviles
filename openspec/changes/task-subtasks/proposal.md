## Why

Tasks are flat — a task cannot contain subtasks. Real work is hierarchical: a
task breaks into steps, and those steps may break down further. Users need to add
subtasks while editing a task, see progress at a glance, and have completion and
deletion behave sensibly across the hierarchy.

This is the second of two changes. It **depends on**
`task-editing-optional-reminders` (the optional-reminder shape, the edit flow, and
`updateTask`) and must be applied after it. Greenfield app — no migration.

## What Changes

- **Hierarchy via `parentId`:** `Task` gains `parentId?: string | null`. Storage
  stays **flat** (`tasks[projectId] = Task[]`, each row carrying its `parentId`);
  the children tree is **derived in a selector** for rendering. Arbitrary nesting
  depth is supported; roots have no `parentId`.
- **Create subtasks:** `addTask` accepts an optional `parentId` so a subtask can
  be created from the Edit screen.
- **Cascade delete:** deleting a task removes it and all its descendants and
  cancels every descendant's notification, resiliently (reusing the existing
  `safeCancel` pattern).
- **Completion invariant:** a task marked `completed` implies **all** its
  descendants are completed. All cascade/prompt rules derive from it:
  - Completing a node with incomplete descendants → confirm prompt → on confirm,
    complete the node and all descendants (cascade down); cancel = no-op.
  - Completing the **last** incomplete child → prompt to complete the parent.
  - Re-opening a node → re-open the node and all ancestors (cascade up).
  - Adding an incomplete child to a completed parent → auto re-open ancestors.
- **Re-open reschedules reminders:** a re-opened task with a reminder is
  rescheduled (repeating always; one-shot only if still in the future; past
  one-shots silently skipped). Completing a task cancels its reminder.
- **Dashboard = roots only:** Active = roots with `completed: false`, Completed =
  roots with `completed: true`. Each root shows a progress badge based on its
  **direct** children. Subtasks never appear at the top level.
- **Detail/subtree view:** a task's detail/edit view renders its subtree; every
  subtask that has its own children shows its own progress bar (direct children).
- **Subtask reminder titles:** plain task title (no prefix); root tasks keep the
  existing `[Project] Title` prefix.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `state-management`: the task store gains `parentId`, an optional `parentId` on
  `addTask`, cascade delete, a completion engine governed by the invariant
  (cascade-down complete, cascade-up re-open, reminder rescheduling), a derived
  children selector, and descendants/ancestors helpers.
- `navigation-flow`: a task's detail/edit view renders and manages its subtree.

## Non-goals

- Re-parenting / moving a subtask to another parent or project.
- Drag-to-reorder, bulk / multi-select, undo.

## Impact

- **Code:** `src/types` (`parentId`), `src/stores/task-store.ts` (`addTask`
  parentId, cascade delete, completion engine, reschedule), a pure cascade module
  (`completeTask`/`reopenTask`/`descendants`/`ancestors`), a derived children
  selector, a completion hook for the Alert prompts, dashboard root + progress
  rendering, and the detail/subtree view.
- **Rules:** stores stay decoupled; all logic/state in custom hooks (no logic or
  primitive hooks in components); UI strings in Spanish; **consistency and
  resilience are acceptance criteria** — notification failures never abort or
  partially corrupt a mutation, and cascades always keep the invariant intact.
- **Docs:** update `openspec/CONTEXT.md` (subtasks, the completion invariant,
  cascade delete, dashboard/detail rendering, reminder-title rule).
