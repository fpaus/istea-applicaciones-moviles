## ADDED Requirements

### Requirement: Tasks carry an optional location

The `Task` and `NewTask` domain model SHALL include an optional `location`
(`{ latitude: number; longitude: number; label?: string } | null`). The task store
SHALL persist `location` on creation and SHALL preserve or update it through
`updateTask`, including clearing it (setting `location` to `null`). A task without a
location SHALL have `location` null or absent.

#### Scenario: Creating a task with a location

- **GIVEN** the task store and an active project
- **WHEN** the add task action runs with a `location`
- **THEN** the created task persists that `location`

#### Scenario: Clearing a task's location

- **GIVEN** an existing task with a `location`
- **WHEN** `updateTask` runs clearing the location
- **THEN** the task's `location` becomes null

#### Scenario: Location survives restart

- **GIVEN** a task saved with a `location`
- **WHEN** the app is closed and relaunched
- **THEN** the rehydrated task still has its `location`

### Requirement: Location capture is resilient to permission denial and failure

Capturing the current location SHALL go through a service that requests permission
and returns coordinates on success or `null` on denial, timeout, or failure. A
`null` result SHALL NOT block creating or saving the task; the task SHALL be saved
with no location.

#### Scenario: User denies location permission

- **GIVEN** the user is creating a task
- **WHEN** location permission is denied
- **THEN** no location is attached
- **AND** the task can still be saved successfully

#### Scenario: Location fix fails or times out

- **GIVEN** the user requests the current location
- **WHEN** the device cannot produce a fix
- **THEN** no location is attached
- **AND** the task can still be saved successfully
