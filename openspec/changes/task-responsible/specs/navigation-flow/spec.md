## ADDED Requirements

### Requirement: Tasks can pick a responsible in create and edit forms

The create (`add`) and edit (`edit`) task forms SHALL let the user pick a
responsible from the device contacts, change it, and clear it. The selected
responsible SHALL be shown in the form before saving. Saving SHALL persist the
current responsible selection (including its removal) with the task.

#### Scenario: Assigning a responsible while creating a task

- **GIVEN** the create task form
- **WHEN** the user picks a contact as responsible
- **THEN** the form shows the selected responsible
- **AND** saving the task persists that responsible

#### Scenario: Clearing the responsible while editing a task

- **GIVEN** the edit form for a task that has a responsible
- **WHEN** the user clears the responsible and saves
- **THEN** the task no longer has a responsible

### Requirement: A task's responsible is displayed read-only

When a task has a responsible, its detail view SHALL display the responsible's name
(and phone when present) and its dashboard card SHALL indicate a responsible is
assigned. When a task has no responsible, neither surface SHALL show responsible
information.

#### Scenario: Detail view shows the responsible

- **GIVEN** a task with a responsible
- **WHEN** its detail view is shown
- **THEN** the responsible's name is displayed

#### Scenario: Tasks without a responsible render unchanged

- **GIVEN** a task with no responsible
- **WHEN** its detail view and dashboard card are shown
- **THEN** no responsible information is displayed on either surface
