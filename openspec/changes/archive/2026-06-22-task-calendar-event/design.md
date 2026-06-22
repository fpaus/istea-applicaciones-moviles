## Context

The previous three changes added *stored* attributes. A calendar event is
different: it is an OS side-effect with a lifecycle (create → update → delete) that
must stay consistent with the task. The app already solves exactly this shape for
notifications: `NotificationService` + inline reconciliation in task-store actions +
the `safeCancel` resilience helper + the "notificationId nulled on completion,
settings preserved" pattern. This change mirrors that design rather than inventing a
new one.

## Goals / Non-Goals

**Goals**
- Optionally mirror a task's reminder onto the device calendar as an event.
- Keep the event reconciled with the task across create/edit/complete/reopen/delete.
- Resilience: calendar failures never corrupt or abort the task mutation.

**Non-Goals**
- No calendar event without a reminder; no attendees/alarms/custom recurrence; no
  two-way sync; no web support.

## Decisions

### Domain model mirrors `notification`
Add `calendar?: { eventId: string | null } | null` to `Task` and `NewTask`:
- `calendar == null`/absent → the user does not want a calendar event.
- `calendar = { eventId }` → the user wants one; `eventId` is the current OS event
  id, or `null` when not currently scheduled (e.g. after completion).

This is intentionally the same shape as `notification` (`{ time, repeats,
notificationId }` where `notificationId` is nulled on completion but settings are
preserved). Event title/time are **derived** from the task's `title` + `notification.time`
— not duplicated into the `calendar` object — so they can't drift.

### Calendar option requires a reminder
The event's time comes from the reminder, so "Agregar al calendario" is only
enabled when the task has a reminder. If the reminder is removed, the calendar event
is removed too (the option is disabled and any existing event deleted).

### Event recurrence follows the reminder's `repeats`
The calendar event mirrors the reminder's recurrence:
- `repeats === true` (daily reminder) → a **recurring** calendar event with a daily
  recurrence rule (`recurrenceRule` of frequency "daily"), matching the `DAILY`
  notification trigger.
- `repeats === false` (one-shot reminder) → a single, non-recurring event at the
  next occurrence of the reminder time (consistent with the one-shot notification's
  next-occurrence `DATE` trigger).

When an edit flips `repeats`, the event is updated so its recurrence matches the new
value (recreating the event if the calendar API cannot mutate recurrence in place).

### Service wrapper: `CalendarService` (mirror `NotificationService`)
New `src/services/calendar.ts`:
- `requestPermission()` → boolean.
- `getWritableCalendarId()` → resolve the default/a created app calendar id, or
  `null`.
- `createEvent(title, time, repeats)` → `eventId | null`.
- `updateEvent(eventId, title, time, repeats)` → `void` (best-effort).
- `deleteEvent(eventId)` → `void` (best-effort).
All wrapped in try/catch; create returns `null` on denial/failure so the task still
saves with `calendar.eventId = null`. Matches "Resilient Fallback on Notification
Rejection".

### Lockstep reconciliation in the store (the core of this change)
Wherever `task-store` touches the notification today, it also reconciles the event,
gated on `calendar != null`:

| Action | Notification (today) | Calendar (added) |
| --- | --- | --- |
| create | schedule → `notificationId` | if `calendar`, `createEvent` → `calendar.eventId` |
| `updateTask` (title/time change) | reschedule | if `calendar`, `updateEvent` (or create if no id) |
| `updateTask` (calendar toggled off / reminder removed) | cancel | `deleteEvent`, `calendar → null` |
| `updateTask` (calendar toggled on) | (n/a) | `createEvent` → `calendar.eventId` |
| `markCompleted` (subtree) | cancel, `notificationId → null` | `deleteEvent`, `eventId → null` (keep `calendar` flag) |
| `reopenTask` | reschedule future | recreate event for future reminders |
| `deleteTask` (cascade) | cancel all | `deleteEvent` for the subtree |

A shared `safeCalendar`-style wrapper (mirroring `safeCancel`) swallows/logs failures
so a failing calendar op never aborts or partially corrupts the data mutation —
consistent with "Resilient Notification Cancellation" and "Resilient Multi-Task
Cascades" in CONTEXT.md.

### Native-only (no web guard)
Per the feature-set decision, no `Platform.OS !== 'web'` branch; resilience still
required.

## Risks / Trade-offs

- **Most complex change** — touches five store actions. Mitigated by mirroring the
  proven notification reconciliation exactly and reusing its test patterns
  (including the existing cancel/reschedule-failure resilience tests).
- **Duplicate-event risk** if create/update id bookkeeping drifts. Mitigated:
  `eventId` is the single source of truth; update-or-create keys off its presence;
  completion nulls it so reopen recreates exactly one.
- **Calendar permission/availability** varies; degrade to `calendar.eventId = null`.

## Migration Plan

Additive. Existing tasks have no `calendar`. `expo-calendar` added to deps. No data
migration.

## Open Questions

- Use the device default calendar or create a dedicated "Recurring Reminders"
  calendar? Default: reuse a writable default calendar; create a dedicated one only
  if no writable default exists.

_(Resolved)_ Daily-repeat reminders create a **recurring** calendar event (daily
recurrence rule); one-shot reminders create a single event. See "Event recurrence
follows the reminder's `repeats`" above.
