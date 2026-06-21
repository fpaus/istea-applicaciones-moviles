## ADDED Requirements

### Requirement: Tasks carry an optional responsible person

The `Task` and `NewTask` domain model SHALL include an optional `responsible`
(`{ name: string; contactId?: string; phone?: string } | null`) holding a snapshot
of the chosen contact. The task store SHALL persist `responsible` on creation and
SHALL preserve or update it through `updateTask`, including clearing it (setting
`responsible` to `null`). A task without a responsible SHALL have `responsible` null
or absent.

#### Scenario: Creating a task with a responsible

- **GIVEN** the task store and an active project
- **WHEN** the add task action runs with a `responsible`
- **THEN** the created task persists that `responsible` snapshot

#### Scenario: Clearing a task's responsible

- **GIVEN** an existing task with a `responsible`
- **WHEN** `updateTask` runs clearing the responsible
- **THEN** the task's `responsible` becomes null

#### Scenario: Responsible survives restart and contact changes

- **GIVEN** a task saved with a `responsible` snapshot
- **WHEN** the app is relaunched and the underlying device contact is later changed or deleted
- **THEN** the task still displays the responsible snapshot it was assigned

### Requirement: Responsible selection is resilient to permission denial and failure

Picking a responsible SHALL go through a service that requests contacts permission
and returns a contact snapshot on success or `null` on denial, cancellation, or
failure. A `null` result SHALL NOT block creating or saving the task; the task SHALL
be saved with no responsible.

#### Scenario: User denies contacts permission

- **GIVEN** the user is creating a task
- **WHEN** contacts permission is denied
- **THEN** no responsible is attached
- **AND** the task can still be saved successfully

#### Scenario: User cancels the contact picker

- **GIVEN** the contact picker is open
- **WHEN** the user cancels without choosing a contact
- **THEN** the task's responsible is unchanged
