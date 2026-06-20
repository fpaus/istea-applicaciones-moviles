## ADDED Requirements

### Requirement: Tasks are editable from the dashboard

A task SHALL be editable through a dedicated edit route reachable from the
dashboard. The edit screen SHALL pre-fill the task's current title, description,
and reminder (with the reminder section enabled when the task has one). Saving
SHALL apply the edit and return to the dashboard.

#### Scenario: Opening a task's edit screen

- **GIVEN** a task on the dashboard
- **WHEN** the user opens that task's edit affordance
- **THEN** the edit screen shows the task's current title, description, and reminder state

#### Scenario: Saving an edit returns to the dashboard

- **GIVEN** the edit screen for a task
- **WHEN** the user saves a valid change
- **THEN** the change is applied
- **AND** the app returns to the dashboard
