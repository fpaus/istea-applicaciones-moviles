# Navigation Flow Spec

## Purpose

TBD – Navigation and screen-rendering logic for project setup and dashboard display.
## Requirements
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

### Requirement: Active project shown and switchable from the header

When a project is active, the header SHALL display the active project's name and
SHALL expose it as a tappable affordance that opens the project switcher.
Selecting a different project from the switcher SHALL activate it instantly and
update the dashboard in place, without a full-screen navigation.

#### Scenario: Header shows the active project

- **GIVEN** an active project named "Trabajo"
- **WHEN** the dashboard is shown
- **THEN** the header displays "Trabajo"

#### Scenario: Switching project from the header

- **GIVEN** the header switcher is open
- **WHEN** the user taps another project
- **THEN** that project becomes active
- **AND** the dashboard shows that project's tasks without leaving the screen

### Requirement: The (app) route group uses header navigation, not a drawer

The `(app)` route group SHALL use header-based navigation (native stack / header)
rather than a Drawer navigator. There SHALL be no drawer chrome and no in-drawer
project switcher.

#### Scenario: No drawer is present

- **WHEN** the dashboard is shown with an active project
- **THEN** there is no drawer to open
- **AND** project switching is available from the header

### Requirement: New projects can be created from the header switcher

The header project switcher SHALL offer a "Nuevo Proyecto" affordance so a new
project can be created without leaving the dashboard. Creating a project SHALL
activate it immediately and close the switcher.

#### Scenario: Creating a project from the switcher

- **GIVEN** the header switcher is open and at least one project already exists
- **WHEN** the user chooses "Nuevo Proyecto", enters a name and confirms
- **THEN** the new project is created and becomes active
- **AND** the switcher closes and the dashboard shows the new project

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

### Requirement: The dashboard lists root tasks with subtask progress

The dashboard SHALL list only root tasks (no `parentId`). Active = roots with
`completed: false`; Completed = roots with `completed: true`. A root task that has
children SHALL show a progress indicator based on its direct children. Subtasks
SHALL NOT appear at the top level.

#### Scenario: Subtasks do not appear on the dashboard

- **GIVEN** a root task with two subtasks
- **WHEN** the dashboard is shown
- **THEN** only the root task is listed
- **AND** the subtasks are not listed at the top level

#### Scenario: A root task shows its direct-children progress

- **GIVEN** a root task with 3 direct children, 1 completed
- **WHEN** the dashboard is shown
- **THEN** the root task shows progress for 1 of 3 direct children

### Requirement: A task's detail view renders and manages its subtree

A task SHALL have a detail/edit view that renders its subtree and lets the user
add subtasks under it. Every subtask that has its own children SHALL show its own
direct-children progress indicator.

#### Scenario: Adding a subtask from the detail view

- **GIVEN** a task's detail/edit view
- **WHEN** the user adds a subtask
- **THEN** the new subtask appears under that task in the subtree

#### Scenario: Nested progress is shown per node

- **GIVEN** a subtask that itself has children
- **WHEN** the subtree is rendered
- **THEN** that subtask shows its own direct-children progress indicator

