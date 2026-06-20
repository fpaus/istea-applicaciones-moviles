## 1. Task shape — optional reminder

- [x] 1.1 Update `Task` and `NewTask` in `src/types` to a single optional `notification?: { time: Time; repeats: boolean; notificationId: string | null } | null`; remove the flat `time`/`repeats`/`notificationId` fields.
- [x] 1.2 Update every direct reader of the old fields to the grouped object: `task-store` (`addTask`, `deleteTask`, `markCompleted`, `clearAll`, `removeProjectTasks`, `clearNotificationId`), `selectActive`/`selectCompleted`, and `CardItem`. Keep `tsc` green.

## 2. Store — optional reminder on create + sort rule (Red → Green)

- [x] 2.1 (Red) Tests: `addTask` with no reminder stores `notification: null` and does NOT call the scheduler; `addTask` with a reminder still schedules with the `[Project]` prefix and stores the id.
- [x] 2.2 (Green) Implement optional-reminder handling in `addTask`.
- [x] 2.3 (Red) Tests for `selectActive`: timed tasks sort first by next time-of-day; reminder-less tasks come after, ordered by `createdAt`.
- [x] 2.4 (Green) Implement the sort rule in `selectActive`.

## 3. Store — updateTask with reminder reconciliation (Red → Green)

- [x] 3.1 (Red) Tests for `updateTask(projectId, id, patch)`: edits title/description; none→set schedules + stores id; set→changed cancels old + schedules new; set→none cancels + nulls notification; a failing cancel still applies the edit (resilient via `safeCancel`).
- [x] 3.2 (Green) Implement `updateTask` in `src/stores/task-store.ts` (inline, atomic, resilient) and add it to `TaskState`.

## 4. Create flow — optional reminder UI

- [x] 4.1 Add a reminder toggle to `useAddTaskForm` (validation: title required always; time required only when the reminder is on) and emit the optional `notification`.
- [x] 4.2 Update `add.tsx` to show/hide the reminder section behind the toggle (Spanish copy); stays presentational.

## 5. Edit flow (new)

- [x] 5.1 (Red) Tests for `useEditTaskForm`: pre-fills fields + reminder toggle from an existing task; saving calls `updateTask` with the diffed patch and navigates back.
- [x] 5.2 (Green) Implement `src/hooks/useEditTaskForm.ts` (all logic in the hook).
- [x] 5.3 Add the edit route/screen (presentational, reuses the form inputs) and an edit affordance on the task (e.g. from `CardItem`); wire navigation.

## 6. Card rendering

- [x] 6.1 `CardItem` omits the time/clock line when the task has no reminder; shows it (with repeats wording) when it does.

## 7. Docs & validation

- [x] 7.1 Update `openspec/CONTEXT.md`: task features (optional reminder + edit), store actions (`updateTask`), and remove the "No task edit flow" limitation.
- [x] 7.2 Run the full Jest suite, `tsc --noEmit`, and lint; run `openspec validate task-editing-optional-reminders --strict`.
