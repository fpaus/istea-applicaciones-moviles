## ADDED Requirements

### Requirement: Tasks carry an optional calendar event tied to the reminder

The `Task` and `NewTask` domain model SHALL include an optional `calendar`
(`{ eventId: string | null } | null`). `calendar` absent/null means the user does
not want a calendar event; `calendar = { eventId }` means they do, where `eventId`
is the current OS event id or `null` when not currently scheduled. The event's
title, time, and recurrence SHALL be derived from the task's title and reminder (not
duplicated into `calendar`): a **daily** reminder (`repeats === true`) SHALL produce
a recurring event with a daily recurrence rule, and a one-shot reminder
(`repeats === false`) SHALL produce a single non-recurring event. A calendar event
SHALL only exist when the task has a reminder; if the reminder is removed, the
calendar event SHALL be removed and `calendar` set to null.

#### Scenario: Creating a task with a calendar event

- **GIVEN** a new task with a reminder and the calendar option enabled
- **WHEN** the add task action runs
- **THEN** a calendar event is created from the task title and reminder time
- **AND** the returned event id is stored in `calendar.eventId`

#### Scenario: A daily reminder creates a recurring event

- **GIVEN** a new task with a daily-repeating reminder and the calendar option enabled
- **WHEN** the add task action runs
- **THEN** the created calendar event has a daily recurrence rule

#### Scenario: A one-shot reminder creates a single event

- **GIVEN** a new task with a non-repeating reminder and the calendar option enabled
- **WHEN** the add task action runs
- **THEN** the created calendar event is a single, non-recurring event

#### Scenario: Removing the reminder removes the calendar event

- **GIVEN** an existing task that has a reminder and a calendar event
- **WHEN** `updateTask` removes the reminder
- **THEN** the calendar event is deleted
- **AND** the task's `calendar` becomes null

#### Scenario: Calendar selection survives restart

- **GIVEN** a task saved with a calendar event
- **WHEN** the app is closed and relaunched
- **THEN** the rehydrated task still has its `calendar` with the event id

### Requirement: The calendar event is reconciled in lockstep with the notification

The task store SHALL create, update, and delete a task's calendar event in the same
actions and in lockstep with the way it schedules, reschedules, and cancels the
task's notification, gated on the task wanting a calendar event:

- Editing the title or reminder time SHALL update the existing event (or create one
  if none exists yet).
- Toggling the calendar option on SHALL create the event; toggling it off SHALL
  delete it and set `calendar` to null.
- Completing a task SHALL delete its calendar event and set `eventId` to null while
  preserving the `calendar` preference; the rule SHALL apply across the completed
  subtree.
- Reopening a task SHALL recreate the calendar event for future reminders.
- Deleting a task SHALL delete the calendar events of the task and all of its
  descendants.

#### Scenario: Editing the reminder time updates the event

- **GIVEN** a task with a reminder and a calendar event
- **WHEN** `updateTask` changes the reminder time
- **THEN** the calendar event is updated to the new time

#### Scenario: Completing a task removes its calendar event

- **GIVEN** a completed-bound task with a calendar event
- **WHEN** the mark-completed action runs for the task
- **THEN** the calendar event is deleted
- **AND** `calendar.eventId` becomes null while the calendar preference is preserved

#### Scenario: Reopening a task recreates a future event

- **GIVEN** a completed task whose calendar preference is set and whose reminder is in the future
- **WHEN** the reopen action runs
- **THEN** a calendar event is recreated for that reminder

#### Scenario: Deleting a task removes its subtree's events

- **GIVEN** a task with subtasks that have calendar events
- **WHEN** the task is deleted
- **THEN** the calendar events of the task and all descendants are deleted

### Requirement: Calendar operations are resilient and never abort the task mutation

All calendar operations SHALL go through a service that requests permission and
returns an event id on creation success or `null` on denial/failure, and that
swallows/logs failures on update and delete. A calendar failure SHALL NOT abort or
partially corrupt the task mutation: the task SHALL always be created/updated, with
`calendar.eventId` left null when an event could not be created.

#### Scenario: Calendar permission denied during create

- **GIVEN** a new task with a reminder and the calendar option enabled
- **WHEN** calendar permission is denied
- **THEN** the task is still created successfully
- **AND** its `calendar.eventId` is null

#### Scenario: A failing calendar delete does not abort completion

- **GIVEN** a task with a calendar event whose deletion will fail
- **WHEN** the task is completed
- **THEN** the completion still succeeds and the task state updates
- **AND** the failure is logged rather than thrown
