# State Management Spec

## Purpose
Global state management and persistence architecture using Zustand and AsyncStorage.
## Requirements
### Requirement: Global project state store

The system SHALL expose a global project store holding the active `Project` and a list of configured `projects`. Actions to select a project, create a project, and deselect a project SHALL update this store, and components/hooks SHALL read project state exclusively through it (via the `useProjects` / `useProject` hook surface).

#### Scenario: Successful project creation adds to list and auto-selects

- **GIVEN** the project store
- **WHEN** the create project action runs with a name
- **THEN** the project is added to the list of projects
- **AND** it is assigned a unique ID
- **AND** it becomes the `currentProject` in the store

#### Scenario: Selecting a project updates the active project

- **GIVEN** a configured project
- **WHEN** the select project action runs
- **THEN** `currentProject` is set to that project

#### Scenario: Deselecting a project clears the active project

- **GIVEN** an active project
- **WHEN** the deselect action runs
- **THEN** `currentProject` becomes `null`

### Requirement: Global task state store

The system SHALL expose a global task store holding a dictionary of `Task` arrays keyed by project ID (`tasks: Record<string, Task[]>`) and actions to add, delete, mark completed, and clear all for a specific project. Components/hooks SHALL read and mutate tasks exclusively through it (via the `useTasks` hook surface).

#### Scenario: Adding a task updates the project's task list

- **GIVEN** the task store and an active project
- **WHEN** the add task action runs for that project ID
- **THEN** the new task appears at the head of that project's task array

#### Scenario: Completing a task marks it done

- **GIVEN** a task with a scheduled notification
- **WHEN** the mark-completed action runs for the task ID
- **THEN** that task's `completed` becomes `true`
- **AND** its `notificationId` becomes `null`

### Requirement: AsyncStorage-backed persistence and hydration

Each store SHALL persist its state to AsyncStorage via Zustand's `persist` middleware, writing automatically on every state change and rehydrating on app launch. The store SHALL NOT persist transient flags (e.g. loading/hydration state). The task store SHALL customize its `merge` function to properly restore the project-grouped task structure.

#### Scenario: State survives app restart

- **GIVEN** an active project with saved tasks
- **WHEN** the app is closed and relaunched
- **THEN** the stores rehydrate the active project, the project registry, and all tasks from AsyncStorage

#### Scenario: Mutations persist automatically

- **WHEN** any store action changes persisted state
- **THEN** the updated state is written to AsyncStorage without an explicit save call

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

### Requirement: Hydration gate for project redirects

The root layout SHALL wait until the stores have finished rehydrating before rendering route groups, so declarative redirects evaluate `currentProject` against hydrated state.

#### Scenario: No project selection screen flash for active project

- **GIVEN** a previously selected active project
- **WHEN** the app launches
- **THEN** the root layout renders nothing until rehydration completes
- **AND** the user is not briefly redirected to the project selector screen

### Requirement: Task creation is resilient to notification failures

Creating a task SHALL persist the task even when its OS notification cannot be scheduled (permission denied or the scheduler throws). In that case the task's `notificationId` SHALL be `null` and the error SHALL NOT propagate to the caller.

#### Scenario: Permission denied still saves the task

- **GIVEN** the scheduler returns `null`
- **WHEN** the add action runs
- **THEN** the task is added with `notificationId` `null`

#### Scenario: Scheduler error is contained

- **GIVEN** the scheduler throws
- **WHEN** the add action runs
- **THEN** the task is still added with `notificationId` `null`
- **AND** the add action resolves without throwing

### Requirement: Task mutations tolerate missing or already-cleared targets

Delete and mark-completed actions SHALL be safe no-ops when the target ID does not exist, and SHALL NOT attempt to cancel a notification for a task that has no scheduled `notificationId`.

#### Scenario: Operating on an unknown ID does nothing

- **WHEN** delete or mark-completed runs for an ID not in the list
- **THEN** the task list is unchanged
- **AND** no notification cancellation is attempted

#### Scenario: Deleting a completed task does not cancel

- **GIVEN** a completed task whose `notificationId` is already `null`
- **WHEN** the delete action runs
- **THEN** the task is removed
- **AND** no notification cancellation is attempted

### Requirement: Project renaming

The project store SHALL expose a `renameProject(id, name)` action that updates a
project's name. The new name SHALL be normalized (trimmed) and validated for
case-insensitive uniqueness against other projects; a duplicate SHALL be rejected.
If the renamed project is the active project, `currentProject` SHALL reflect the
new name.

#### Scenario: Rename updates the project and active session

- **GIVEN** an active project named "Trabajo"
- **WHEN** it is renamed to "Personal"
- **THEN** the project's name becomes "Personal"
- **AND** `currentProject.name` is "Personal"

#### Scenario: Rename to an existing name is rejected

- **GIVEN** projects "Trabajo" and "Personal"
- **WHEN** "Trabajo" is renamed to "personal"
- **THEN** the rename is rejected as a duplicate
- **AND** the project names are unchanged

### Requirement: Project deletion cascades to its tasks

Deleting a project SHALL remove it from the project list, remove all of its tasks,
and cancel those tasks' scheduled notifications. If the deleted project was the
active project, `currentProject` SHALL become `null`. Stores SHALL remain
decoupled: the cascade is orchestrated by a hook calling the task store and the
project store (no store imports another store).

#### Scenario: Deleting a project removes its tasks and notifications

- **GIVEN** a project with two scheduled tasks
- **WHEN** the project is deleted
- **THEN** the project is removed from the list
- **AND** its tasks are removed
- **AND** each task's notification is cancelled

#### Scenario: Deleting the active project returns to the selector

- **GIVEN** the active project is deleted
- **WHEN** the deletion completes
- **THEN** `currentProject` becomes `null`
- **AND** the dashboard shows the project selector

### Requirement: Deletion requires confirmation

The UI SHALL require an explicit confirmation step before a project is deleted.

#### Scenario: Cancelling the confirmation keeps the project

- **GIVEN** the delete confirmation dialog is shown
- **WHEN** the user cancels
- **THEN** the project and its tasks are unchanged

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

