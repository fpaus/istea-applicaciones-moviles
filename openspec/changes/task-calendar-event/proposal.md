## Why

A reminder fires a notification, but users also want the task to appear on their
device **calendar** as an event they can see alongside everything else. This is the
last and most involved of the attribute features: unlike image/location/responsible
(stored fields), a calendar event has a create/update/delete **lifecycle** tied to
the reminder — closely mirroring the existing notification reconciliation in the
task store.

## What Changes

- Add the option to also place a task's **reminder on the device calendar** as an
  event, via `expo-calendar`. The event uses the task's title and the reminder's
  time. The calendar option is only available when the task has a reminder.
- New `CalendarService` wrapping `expo-calendar` (permission, resolve/create a
  writable calendar, create/update/delete event) — modeled on `NotificationService`,
  with the same try/catch resilience: a denied permission or a failed calendar
  operation never blocks saving the task.
- The task store **reconciles the calendar event in lockstep with the
  notification**: creating, editing (title/time), completing, reopening, and
  deleting a task create/update/delete its calendar event exactly where the same
  actions already schedule/cancel/reschedule its notification.
- The detail view shows whether the task is on the calendar; the card indicates it.
- **Native-only**: web is out of scope and not guarded.

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `state-management`: the `Task`/`NewTask` model gains an optional `calendar` object; the store creates/updates/deletes the calendar event in lockstep with notification reconciliation across create/updateTask/markCompleted/reopen/delete.
- `navigation-flow`: the create and edit forms expose an "Agregar al calendario" option (enabled only with a reminder); the detail view and card show calendar status.

## Impact

- **Dependency**: add `expo-calendar`.
- **`src/types/index.ts`**: add `calendar?: { eventId: string | null } | null` to `Task` and `NewTask` (presence = user wants an event; `eventId` = current OS event id, `null` when unscheduled/completed — mirrors the `notification.notificationId` pattern).
- **New service**: `src/services/calendar.ts` (`CalendarService`): permission, resolve/create writable calendar, `createEvent` / `updateEvent` / `deleteEvent`.
- **Store**: `task-store` create / `updateTask` / `markCompleted` / `reopenTask` / `deleteTask` reconcile the event alongside the notification, via a resilient `safeCalendar`-style helper (mirror `safeCancel`).
- **Hooks/UI**: `useAddTaskForm` / `useEditTaskForm` add an "add to calendar" toggle gated on the reminder; `detail.tsx` + `CardItem.tsx` show status.
- **Specs**: `state-management`, `navigation-flow`. **CONTEXT.md** updated.
- Spanish UI; resilience and lockstep reconciliation per CONTEXT.md; no logic in components.

## Non-goals

- No standalone calendar events without a reminder, no editing arbitrary calendar
  fields (attendees, alarms, recurrence beyond the reminder's daily repeat).
- No reading back / two-way sync from the calendar into tasks.
- No web support.
