## ADDED Requirements

### Requirement: Tasks open in a read-only detail view from the dashboard

Tapping a task's card body on the dashboard SHALL navigate to a dedicated
read-only detail screen for that task. The detail screen SHALL display the task's
title, description, and reminder (when present) without any editing controls, and
SHALL expose an "Editar" affordance that navigates to the existing edit screen for
that task. The per-row "Editar" and "Eliminar" buttons on the dashboard card SHALL
continue to work and SHALL NOT trigger navigation to the detail screen.

#### Scenario: Tapping a task opens its read-only detail

- **GIVEN** a task listed on the dashboard
- **WHEN** the user taps the task's card body
- **THEN** the app navigates to that task's detail screen
- **AND** the screen shows the task's title, description, and reminder read-only
- **AND** no editing, completing, or deleting controls are shown for the task itself

#### Scenario: Editing from the detail screen

- **GIVEN** a task's detail screen
- **WHEN** the user taps "Editar"
- **THEN** the app navigates to that task's edit screen

#### Scenario: Card action buttons do not open the detail view

- **GIVEN** a task on the dashboard
- **WHEN** the user taps the card's "Eliminar" (or "Editar") button
- **THEN** the corresponding action runs
- **AND** the app does not navigate to the read-only detail screen

### Requirement: The detail view lists subtasks with completion and navigation

When a task has direct subtasks, its detail screen SHALL show its direct-children
progress indicator and SHALL list those subtasks. Each listed subtask SHALL expose
a completion control that marks it done or reopens it, applying the same completion
invariant and cascade behavior as the rest of the app. Tapping a listed subtask
outside its completion control SHALL open that subtask's own detail screen.

#### Scenario: Detail view shows direct-children progress

- **GIVEN** a task with 3 direct children, 1 completed
- **WHEN** its detail screen is shown
- **THEN** the screen shows progress for 1 of 3 direct children

#### Scenario: Completing a subtask from the detail view

- **GIVEN** a task's detail screen listing an incomplete subtask
- **WHEN** the user toggles that subtask's completion control
- **THEN** that subtask becomes completed

#### Scenario: Opening a subtask from the detail view

- **GIVEN** a task's detail screen listing its subtasks
- **WHEN** the user taps a subtask outside its completion control
- **THEN** the app navigates to that subtask's detail screen

### Requirement: The detail view tolerates a missing task

The detail screen SHALL render a Spanish not-found state instead of crashing when
it is opened for a task id that no longer exists (for example, a task that was
deleted).

#### Scenario: Opening detail for a deleted task

- **GIVEN** a detail screen opened for a task id that is not in the store
- **WHEN** the screen renders
- **THEN** it shows a "Tarea no encontrada" state
- **AND** the app does not crash
