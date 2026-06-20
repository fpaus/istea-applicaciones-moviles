## ADDED Requirements

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
