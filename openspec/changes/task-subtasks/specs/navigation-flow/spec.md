## ADDED Requirements

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
