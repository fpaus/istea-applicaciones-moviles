## ADDED Requirements

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
