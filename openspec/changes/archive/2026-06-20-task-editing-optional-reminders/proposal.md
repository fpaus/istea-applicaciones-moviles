## Why

Two gaps block real task management:

1. **Reminders are mandatory.** A task can only be created with a time — yet many
   tasks are plain checklist items that don't need to ring. Forcing a clock on
   every task is friction.
2. **Tasks can't be edited.** Once created, a task is immutable
   (`openspec/CONTEXT.md` lists "No task edit flow" as a known limitation). A
   typo, a wrong time, or a reminder you no longer want is permanent.

This is the foundation change of two: it makes the reminder optional and adds a
real edit flow (including adding **or removing** a task's reminder). The next
change (`task-subtasks`) builds the subtask tree on top of it.

## What Changes

- **Task shape:** replace the flat `time`, `repeats`, `notificationId` fields with
  a single optional grouped object
  `notification?: { time: Time; repeats: boolean; notificationId: string | null } | null`.
  `NewTask` makes the reminder optional too.
- **Create flow:** the reminder section becomes optional via a toggle
  ("Agregar recordatorio"). Save requires only a title when no reminder is set;
  the time inputs are required only when the toggle is on.
- **Edit flow (new):** an edit route for an existing task, a `useEditTaskForm`
  hook, and a new store action `updateTask(projectId, id, patch)` that edits the
  title/description and **adds, changes, or removes** the reminder.
- **Sort rule:** `selectActive` keeps timed tasks first (by next upcoming
  time-of-day) and places reminder-less tasks after them, ordered by `createdAt`.
- **Card rendering:** `CardItem` omits the clock/time line when a task has no
  reminder.
- **BREAKING (internal):** the `Task` shape changes. Greenfield app — no
  migration; any stale persisted task data is discarded.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `state-management`: the task store's `addTask` accepts an optional reminder, a
  new `updateTask` action edits a task and diffs its reminder
  (schedule / reschedule / cancel), and `selectActive` defines ordering for
  reminder-less tasks.
- `navigation-flow`: a new edit route is reachable from a task on the dashboard.

## Non-goals

- Subtasks / tree / `parentId` and completion-cascade changes — these belong to
  the follow-up `task-subtasks` change.
- Task reordering or drag-and-drop.

## Impact

- **Code:** `src/types` (Task/NewTask shape), `src/stores/task-store.ts`
  (optional reminder in `addTask`, new `updateTask`, sort rule),
  `src/hooks/useAddTaskForm.ts` (optional reminder), new `useEditTaskForm` hook
  and edit route, `src/components/CardItem.tsx` (no-reminder rendering).
- **Rules:** stores stay decoupled; all logic/state in custom hooks (no logic or
  primitive hooks in components); UI strings in Spanish; **consistency and
  resilience are acceptance criteria** — notification scheduling/cancellation
  failures must never abort or partially corrupt the task data mutation, and the
  edit flow must behave consistently with create.
- **Docs:** update `openspec/CONTEXT.md` (task features: optional reminder + edit;
  store actions; remove the "no task edit flow" limitation).
