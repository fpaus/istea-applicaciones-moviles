## MODIFIED Requirements

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

Task actions SHALL invoke the injected `NotificationService` to schedule or cancel OS notifications and SHALL record the resulting `notificationId` into state within a single atomic update. The scheduled notification title SHALL prefix the task's title with the project's name (e.g., `[Work] Read emails`).

#### Scenario: Add schedules a notification with project prefix
- **GIVEN** an active project named "Personal"
- **WHEN** a task is added with title "Water flowers"
- **THEN** `NotificationService.scheduleNotification` is called with title "[Personal] Water flowers"
- **AND** the returned ID is stored as the task's `notificationId` in the same update

#### Scenario: Delete cancels the scheduled notification
- **GIVEN** a task with a non-null `notificationId`
- **WHEN** the delete action runs
- **THEN** `NotificationService.cancelNotification` is called with that ID
- **AND** the task is removed from state

#### Scenario: Incoming notification clears its ID via an event bridge
- **GIVEN** a task whose scheduled notification fires
- **WHEN** the received-notification listener reports that notification ID
- **THEN** the task store scans all projects and sets the matching task's `notificationId` to `null`


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


### Requirement: Hydration gate for project redirects

The root layout SHALL wait until the stores have finished rehydrating before rendering route groups, so declarative redirects evaluate `currentProject` against hydrated state.

#### Scenario: No project selection screen flash for active project
- **GIVEN** a previously selected active project
- **WHEN** the app launches
- **THEN** the root layout renders nothing until rehydration completes
- **AND** the user is not briefly redirected to the project selector screen


## REMOVED Requirements

### Requirement: Email matching is normalized
**Reason**: Passwords and email-based registry are removed in favor of simple on-device project names.
**Migration**: Replace with project name uniqueness validation.
