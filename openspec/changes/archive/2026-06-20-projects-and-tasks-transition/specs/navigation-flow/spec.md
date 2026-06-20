## ADDED Requirements

### Requirement: Inline project setup and active project dashboard rendering

The system SHALL not redirect the user to a separate login or authentication route group. Instead, the application root routes directly to the dashboard screen. If no project is selected (`currentProject` is null), the dashboard screen SHALL render the project creation/selection component in place. Once a project is created or selected, the dashboard screen SHALL automatically render the active project's task list.

#### Scenario: First-time user sees project creation form
- **GIVEN** a new install with no projects in storage
- **WHEN** the application boots
- **THEN** the main dashboard screen displays the project creation form

#### Scenario: Returning user sees active project dashboard
- **GIVEN** a user with a previously selected active project
- **WHEN** the application boots
- **THEN** the main dashboard screen displays the active project's tasks list
