## ADDED Requirements

### Requirement: Optional task reminders

A task's reminder SHALL be modeled as a single optional grouped field
`notification?: { time: Time; repeats: boolean; notificationId: string | null } | null`.
A task MAY be created or saved with no reminder (a checklist item with no clock).
The active-task ordering SHALL place tasks that have a reminder first (sorted by
next upcoming time-of-day) and reminder-less tasks after them (ordered by
`createdAt`).

#### Scenario: Creating a task without a reminder

- **GIVEN** the add-task flow
- **WHEN** a task is saved with a title and no reminder
- **THEN** the task is stored with `notification` null
- **AND** no OS notification is scheduled

#### Scenario: Reminder-less tasks sort after timed tasks

- **GIVEN** an active task with a reminder and an active task without one
- **WHEN** the active list is built
- **THEN** the task with a reminder appears before the reminder-less task

### Requirement: Task editing reconciles the reminder

The task store SHALL expose `updateTask(projectId, id, patch)` that updates a
task's title/description and reconciles its reminder by diffing old versus new:
adding a reminder schedules it; changing an existing reminder cancels the old and
schedules the new; removing a reminder cancels the old; the resulting
`notificationId` is written within the same atomic update. A failed schedule or
cancellation SHALL NOT abort or partially corrupt the edit.

#### Scenario: Editing adds a reminder to a task that had none

- **GIVEN** a task with no reminder
- **WHEN** it is edited to include a reminder
- **THEN** a notification is scheduled
- **AND** its returned id is stored as the task's `notification.notificationId`

#### Scenario: Editing removes a reminder

- **GIVEN** a task with a scheduled reminder
- **WHEN** it is edited to remove the reminder
- **THEN** the scheduled notification is cancelled
- **AND** the task's `notification` becomes null

#### Scenario: Editing changes the reminder time

- **GIVEN** a task with a scheduled reminder
- **WHEN** its reminder time is changed
- **THEN** the old notification is cancelled and a new one is scheduled
- **AND** the new id is stored in the same update

#### Scenario: A failed cancellation still applies the edit

- **GIVEN** a task with a reminder whose OS cancellation will fail
- **WHEN** the task is edited to remove the reminder
- **THEN** the edit is still applied (`notification` becomes null)
- **AND** the failure does not propagate to the caller

## MODIFIED Requirements

### Requirement: Notification side-effects on task mutations

Task actions SHALL invoke the injected `NotificationService` to schedule or cancel
OS notifications and SHALL record the resulting `notificationId` into state within
a single atomic update — **only when the task has a reminder**. A task with no
reminder SHALL NOT schedule a notification. The scheduled notification title SHALL
prefix the task's title with the project's name (e.g., `[Work] Read emails`).

#### Scenario: Add with a reminder schedules a notification with project prefix

- **GIVEN** an active project named "Personal"
- **WHEN** a task is added with title "Water flowers" and a reminder
- **THEN** `NotificationService.scheduleNotification` is called with title "[Personal] Water flowers"
- **AND** the returned ID is stored as the task's `notification.notificationId` in the same update

#### Scenario: Add without a reminder schedules nothing

- **GIVEN** the add task action
- **WHEN** a task is added with no reminder
- **THEN** `NotificationService.scheduleNotification` is not called
- **AND** the task is stored with `notification` null

#### Scenario: Delete cancels the scheduled notification

- **GIVEN** a task with a non-null `notification.notificationId`
- **WHEN** the delete action runs
- **THEN** `NotificationService.cancelNotification` is called with that ID
- **AND** the task is removed from state

#### Scenario: Incoming notification clears its ID via an event bridge

- **GIVEN** a task whose scheduled notification fires
- **WHEN** the received-notification listener reports that notification ID
- **THEN** the task store scans all projects and sets the matching task's `notification.notificationId` to `null`
