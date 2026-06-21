## ADDED Requirements

### Requirement: Tasks can capture the current location in create and edit forms

The create (`add`) and edit (`edit`) task forms SHALL let the user capture the
device's current location ("Usar ubicación actual") and clear it. The captured
location SHALL be shown in the form before saving. Saving SHALL persist the current
location selection (including its removal) with the task.

#### Scenario: Capturing location while creating a task

- **GIVEN** the create task form
- **WHEN** the user captures the current location
- **THEN** the form shows the captured location
- **AND** saving the task persists that location

#### Scenario: Clearing location while editing a task

- **GIVEN** the edit form for a task that has a location
- **WHEN** the user clears the location and saves
- **THEN** the task no longer has a location

### Requirement: A task's location is displayed read-only

When a task has a location, its detail view SHALL display the location (coordinates
and/or label) and its dashboard card SHALL indicate that a location is attached.
When a task has no location, neither surface SHALL show location information.

#### Scenario: Detail view shows the location

- **GIVEN** a task with a location
- **WHEN** its detail view is shown
- **THEN** the location is displayed

#### Scenario: Tasks without a location render unchanged

- **GIVEN** a task with no location
- **WHEN** its detail view and dashboard card are shown
- **THEN** no location information is displayed on either surface
