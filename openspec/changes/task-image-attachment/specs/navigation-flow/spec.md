## ADDED Requirements

### Requirement: Tasks can capture an image in create and edit forms

The create (`add`) and edit (`edit`) task forms SHALL let the user attach an image
selected from the device gallery, replace it, and remove it. The forms SHALL NOT
offer camera capture. The chosen image SHALL be previewed in the form before saving.
Saving SHALL persist the current image selection (including its removal) with the
task.

#### Scenario: Attaching an image while creating a task

- **GIVEN** the create task form
- **WHEN** the user attaches an image
- **THEN** the form shows a preview of the image
- **AND** saving the task persists that image

#### Scenario: Removing an image while editing a task

- **GIVEN** the edit form for a task that has an image
- **WHEN** the user removes the image and saves
- **THEN** the task no longer has an image

### Requirement: A task's image is displayed read-only

When a task has an image, its detail view SHALL display the image, and its
dashboard card SHALL display a thumbnail. When a task has no image, neither surface
SHALL show an image and their layout SHALL be unaffected.

#### Scenario: Detail view shows the attached image

- **GIVEN** a task with an attached image
- **WHEN** its detail view is shown
- **THEN** the image is displayed

#### Scenario: Dashboard card shows a thumbnail

- **GIVEN** a task with an attached image
- **WHEN** the dashboard lists it
- **THEN** the card shows an image thumbnail

#### Scenario: Tasks without an image render unchanged

- **GIVEN** a task with no image
- **WHEN** its detail view and dashboard card are shown
- **THEN** no image is displayed on either surface
