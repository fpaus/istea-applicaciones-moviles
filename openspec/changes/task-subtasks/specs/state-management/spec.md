## ADDED Requirements

### Requirement: Tasks form a hierarchy via parentId

A `Task` SHALL carry an optional `parentId` (null/absent for roots). Tasks SHALL
remain stored flat per project (`tasks[projectId] = Task[]`); the children tree
SHALL be derived (not stored nested). Arbitrary nesting depth SHALL be supported.
`addTask` SHALL accept an optional `parentId` so a subtask can be created under an
existing task.

#### Scenario: Creating a subtask links it to its parent

- **GIVEN** an existing task "Mudanza"
- **WHEN** a task "Embalar" is added with `parentId` set to "Mudanza"'s id
- **THEN** "Embalar" is stored as a child of "Mudanza"
- **AND** it does not appear among the project's root tasks

#### Scenario: Children are derived for rendering

- **GIVEN** tasks stored flat with `parentId` links
- **WHEN** the children selector runs for a task id
- **THEN** it returns that task's direct children

### Requirement: Deleting a task cascades to its descendants

Deleting a task SHALL remove the task and all of its descendants, and SHALL cancel
each removed task's scheduled notification. A failed cancellation SHALL NOT abort
the deletion.

#### Scenario: Deleting a parent removes the whole subtree

- **GIVEN** a task with nested subtasks, some with reminders
- **WHEN** the parent task is deleted
- **THEN** the parent and every descendant are removed
- **AND** each removed task's notification is cancelled

### Requirement: Completion preserves the descendants invariant

A task marked `completed` SHALL imply that all of its descendants are `completed`.
Completing a task whose descendants are not all completed SHALL require an explicit
confirmation; on confirmation the task and all its descendants SHALL be marked
completed (and their reminders cancelled). Declining SHALL leave everything
unchanged.

#### Scenario: Completing a task with open subtasks cascades on confirm

- **GIVEN** a task with two incomplete subtasks
- **WHEN** the user completes the task and confirms
- **THEN** the task and both subtasks become completed
- **AND** their scheduled notifications are cancelled

#### Scenario: Declining the confirmation changes nothing

- **GIVEN** a task with an incomplete subtask
- **WHEN** the user completes the task and cancels the confirmation
- **THEN** the task and its subtask are unchanged

#### Scenario: Completing the last open subtask prompts to complete the parent

- **GIVEN** a parent whose only remaining incomplete child is being completed
- **WHEN** that child is marked completed
- **THEN** the user is prompted to also complete the parent
- **AND** the parent is completed only if the user confirms

### Requirement: Re-opening a task cascades up and reschedules its reminder

Re-opening (un-completing) a task SHALL re-open the task and all of its ancestors,
preserving the invariant. Adding an incomplete child to a completed task SHALL
re-open its ancestors. A re-opened task that has a reminder SHALL be rescheduled:
repeating reminders always; one-shot reminders only when their time is still in
the future; past one-shot reminders SHALL be skipped.

#### Scenario: Re-opening a subtask re-opens its ancestors

- **GIVEN** a completed parent whose subtask is also completed
- **WHEN** the subtask is re-opened
- **THEN** the subtask and the parent are both no longer completed

#### Scenario: Re-opening reschedules a repeating reminder

- **GIVEN** a completed task with a repeating reminder (notification cancelled)
- **WHEN** the task is re-opened
- **THEN** its reminder is rescheduled
- **AND** the new notification id is stored

#### Scenario: Re-opening skips a past one-shot reminder

- **GIVEN** a completed task with a one-shot reminder whose time has passed
- **WHEN** the task is re-opened
- **THEN** no notification is scheduled
- **AND** the task's `notification.notificationId` stays null

## MODIFIED Requirements

### Requirement: Notification side-effects on task mutations

Task actions SHALL invoke the injected `NotificationService` to schedule or cancel
OS notifications and SHALL record the resulting `notificationId` into state within
a single atomic update, only when the task has a reminder. A task with no reminder
SHALL NOT schedule a notification. The scheduled notification title SHALL prefix a
**root** task's title with the project's name (e.g., `[Work] Read emails`); a
**subtask**'s reminder SHALL use the plain task title (no prefix).

#### Scenario: Root task reminder uses the project prefix

- **GIVEN** an active project named "Personal" and a root task "Water flowers" with a reminder
- **WHEN** the reminder is scheduled
- **THEN** `NotificationService.scheduleNotification` is called with title "[Personal] Water flowers"

#### Scenario: Subtask reminder uses the plain title

- **GIVEN** a subtask "Cocina" with a reminder
- **WHEN** the reminder is scheduled
- **THEN** `NotificationService.scheduleNotification` is called with title "Cocina"

#### Scenario: Delete cancels the scheduled notification

- **GIVEN** a task with a non-null `notification.notificationId`
- **WHEN** the delete action runs
- **THEN** `NotificationService.cancelNotification` is called with that ID
- **AND** the task (and any descendants) are removed from state

#### Scenario: Incoming notification clears its ID via an event bridge

- **GIVEN** a task whose scheduled notification fires
- **WHEN** the received-notification listener reports that notification ID
- **THEN** the task store scans all tasks across projects and sets the matching task's `notification.notificationId` to `null`
