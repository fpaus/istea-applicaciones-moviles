## 1. Dependency & domain model

- [ ] 1.1 Add `expo-calendar` (`npx expo install expo-calendar`)
- [ ] 1.2 Add `calendar?: { eventId: string | null } | null` to `Task` and `NewTask` in `src/types/index.ts`

## 2. CalendarService (TDD)

- [ ] 2.1 Write `src/services/__tests__/calendar.test.ts`: `requestPermission` resolves boolean; `getWritableCalendarId` resolves an id or `null`; `createEvent` returns an id on success and `null` on denial/failure; `createEvent` with `repeats === true` passes a daily `recurrenceRule` and with `repeats === false` passes none; `updateEvent`/`deleteEvent` swallow failures (no throw escapes)
- [ ] 2.2 Implement `src/services/calendar.ts` (`CalendarService` + singleton) wrapping `expo-calendar` with try/catch, modeled on `NotificationService` (native-only, no web guard); `repeats === true` → recurring event with a daily `recurrenceRule`, `repeats === false` → single non-recurring event at the next occurrence; reuse/create a writable calendar

## 3. Store lockstep reconciliation (TDD) — the core

- [ ] 3.1 Add a `safeCalendar`-style resilient helper (mirror `safeCancel`) and inject `CalendarService` into the store factory like `NotificationService`
- [ ] 3.2 Write task-store tests for each lockstep path: create-with-calendar; `updateTask` title/time → updateEvent (create if missing); calendar toggled on/off; reminder removed → delete event + `calendar=null`; `markCompleted` → deleteEvent + `eventId=null` (preference kept) across subtree; `reopenTask` → recreate future event; `deleteTask` → delete subtree events
- [ ] 3.3 Write resilience tests: permission denied on create → task still created with `eventId=null`; failing delete during completion/delete → mutation still succeeds, failure logged
- [ ] 3.4 Implement the reconciliation in `task-store` create / `updateTask` / `markCompleted` / `reopenTask` / `deleteTask`, gated on `calendar != null`, in lockstep with existing notification handling

## 4. Form integration (TDD)

- [ ] 4.1 Extend `useAddTaskForm` / `useEditTaskForm` tests: calendar toggle is disabled without a reminder; enabling it includes `calendar` in the payload/patch; disabling it/removing the reminder clears `calendar`
- [ ] 4.2 Implement the calendar toggle state (gated on the reminder) in both hooks
- [ ] 4.3 Add the "Agregar al calendario" toggle to `add.tsx` and `edit.tsx` (enabled only with a reminder; presentational only)

## 5. Display

- [ ] 5.1 Show calendar status read-only in `app/(app)/detail.tsx` when present
- [ ] 5.2 Show a calendar indicator in `CardItem.tsx` when present (layout unchanged when absent)

## 6. Verification

- [ ] 6.1 `npm test`, `npx tsc --noEmit`, `npx expo lint` all clean
- [ ] 6.2 `openspec validate task-calendar-event --strict` passes
- [ ] 6.3 Manual on device: create task + reminder + calendar → event appears; edit time → event moves; complete → event removed; reopen → event returns; delete → event gone; deny permission → task still saves

## 7. Documentation

- [ ] 7.1 Update `openspec/CONTEXT.md`: domain model gains `calendar`, new `CalendarService`, the lockstep-with-notifications reconciliation decision and `safeCalendar` resilience helper, and calendar status in features
