## Context

`Task` today carries reminder data as three flat, always-present fields
(`time`, `repeats`, `notificationId`). The task store keys tasks by project id
(`Record<string, Task[]>`) and owns notification side-effects via an injected
`NotificationService`: `addTask` schedules inline and records the returned id in
the same update; cancellations route through a resilient `safeCancel` helper. The
create screen (`add.tsx` / `useAddTaskForm`) requires a time; there is no edit
screen. `selectActive` filters out completed tasks and sorts the rest by next
upcoming time-of-day. Stores never import one another.

## Goals / Non-Goals

**Goals:**

- Make the reminder optional on create and editable (add/change/remove) afterward.
- Add a task edit flow consistent with the create flow.
- Keep notification side-effects inline, atomic, and resilient.
- Define a deterministic sort once reminders can be absent.

**Non-Goals:**

- Subtasks/tree, completion cascades, re-open/reschedule (next change).
- Reordering; migrating old persisted data (greenfield — discarded).

## Decisions

### Reminder as a single nullable grouped object

`Task.notification?: { time: Time; repeats: boolean; notificationId: string | null } | null`.
A task with `notification` null/absent is a checklist item with no clock.
`NewTask.notification?` is optional. Grouping keeps the "scheduled-ness" of a task
in one place and makes "has a reminder" a single check.
*Alternative:* keep flat fields and add an `hasReminder` flag — rejected as
redundant state that can drift from `notificationId`.

### `updateTask` is the single edit entry point and diffs the reminder

`updateTask(projectId, id, patch)` updates title/description and reconciles the
reminder by comparing old vs new:

```
old none  + new set     → schedule, store returned notificationId
old set   + new changed  → cancel old, schedule new, store new id
old set   + new none     → cancel old, notification = null
old none  + new none     → no notification work
```

It mirrors `addTask`'s inline pattern: schedule/cancel through the injected
service, write the resulting `notificationId` in the same `set`, and route every
cancel through `safeCancel` so an OS failure never aborts the data update
(resilience is an acceptance criterion). The store stays decoupled; the screen
calls it via a `useEditTaskForm` hook.

### Edit flow mirrors create

A new edit route receives the task id, and `useEditTaskForm` pre-fills fields from
the existing task (including toggling the reminder section on when one exists).
Saving calls `updateTask`. The reminder toggle works identically to create:
turning it off on an existing task removes the reminder (cancel); turning it on
adds one (schedule). Logic lives in the hook; the screen stays presentational;
copy is Spanish.

### Sort rule for reminder-less tasks

`selectActive` orders timed tasks first by next upcoming time-of-day (unchanged),
then reminder-less tasks after them by `createdAt`. This keeps time-sensitive
work visible at the top and gives checklist items a stable order.

## Risks / Trade-offs

- **[Risk] Shape change breaks direct field reads** (`CardItem`, store, selector,
  `clearNotificationId`) → update every reader to the grouped object; covered by
  type-check + tests.
- **[Risk] Reschedule races** when editing a reminder's time → always cancel the
  old id before scheduling the new, and write the new id atomically.
- **[Risk] Removing a reminder leaves an orphaned OS notification** → `updateTask`
  cancels the old id on the set→none transition (resilient).
- **[Risk] Stale persisted data** from the old flat shape → acceptable
  (greenfield); document that storage may need clearing in dev.
