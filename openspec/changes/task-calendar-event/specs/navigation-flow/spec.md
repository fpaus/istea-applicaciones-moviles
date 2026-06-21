## ADDED Requirements

### Requirement: Tasks can opt into a calendar event in create and edit forms

The create (`add`) and edit (`edit`) task forms SHALL expose an "Agregar al
calendario" option that is enabled only when the task has a reminder. Toggling it on
SHALL request that a calendar event be created on save; toggling it off SHALL remove
any existing event on save. When the reminder is disabled, the calendar option SHALL
be disabled as well.

#### Scenario: Enabling the calendar option requires a reminder

- **GIVEN** the create task form with no reminder set
- **WHEN** the user looks at the calendar option
- **THEN** the calendar option is disabled
- **AND** enabling the reminder enables the calendar option

#### Scenario: Adding a task to the calendar from the create form

- **GIVEN** the create form with a reminder set and the calendar option enabled
- **WHEN** the user saves the task
- **THEN** the task is created with a calendar event

#### Scenario: Turning off the calendar option while editing

- **GIVEN** the edit form for a task that has a calendar event
- **WHEN** the user disables the calendar option and saves
- **THEN** the task's calendar event is removed

### Requirement: A task's calendar status is displayed read-only

When a task has a calendar event, its detail view SHALL indicate the task is on the
calendar and its dashboard card SHALL show a calendar indicator. When a task has no
calendar event, neither surface SHALL show calendar information.

#### Scenario: Detail view shows calendar status

- **GIVEN** a task with a calendar event
- **WHEN** its detail view is shown
- **THEN** it indicates the task is on the calendar

#### Scenario: Tasks without a calendar event render unchanged

- **GIVEN** a task with no calendar event
- **WHEN** its detail view and dashboard card are shown
- **THEN** no calendar information is displayed on either surface
