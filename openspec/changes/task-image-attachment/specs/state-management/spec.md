## ADDED Requirements

### Requirement: Tasks carry an optional image attachment

The `Task` and `NewTask` domain model SHALL include an optional `imageUri`
(`string | null`) holding a local device URI for a single attached image. The task
store SHALL persist `imageUri` on task creation and SHALL preserve or update it
through `updateTask`, including clearing it (setting `imageUri` to `null`) when the
image is removed. A task without an image SHALL have `imageUri` null or absent.

#### Scenario: Creating a task with an image

- **GIVEN** the task store and an active project
- **WHEN** the add task action runs with an `imageUri`
- **THEN** the created task persists that `imageUri`

#### Scenario: Updating a task's image

- **GIVEN** an existing task with an `imageUri`
- **WHEN** `updateTask` runs with a different `imageUri`
- **THEN** the task's `imageUri` is replaced with the new value

#### Scenario: Removing a task's image

- **GIVEN** an existing task with an `imageUri`
- **WHEN** `updateTask` runs clearing the image
- **THEN** the task's `imageUri` becomes null

#### Scenario: Image attachment survives restart

- **GIVEN** a task saved with an `imageUri`
- **WHEN** the app is closed and relaunched
- **THEN** the rehydrated task still has its `imageUri`

### Requirement: Image selection is resilient to permission denial and failure

Selecting an image from the gallery SHALL go through a service that requests
photo-library permission and returns a URI on success or `null` on cancellation,
permission denial, or failure. A `null` result SHALL NOT block creating or saving
the task; the task SHALL be saved with no image.

#### Scenario: User denies image permission

- **GIVEN** the user is creating a task
- **WHEN** the image permission is denied
- **THEN** no image is attached
- **AND** the task can still be saved successfully

#### Scenario: User cancels the gallery picker

- **GIVEN** the gallery picker is open
- **WHEN** the user cancels without choosing an image
- **THEN** the task's image is unchanged
