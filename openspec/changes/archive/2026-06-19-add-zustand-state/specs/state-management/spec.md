## ADDED Requirements

### Requirement: Global auth state store

The system SHALL expose a global authentication store holding the current
logged-in `User` (password stripped) and a derived `isLoggedIn` flag. Login,
logout, and register actions SHALL update this store, and components SHALL read
auth state exclusively through it (via the existing `useAuth` hook surface).

#### Scenario: Successful login updates global state

- **GIVEN** a registered user
- **WHEN** the login action succeeds
- **THEN** the store holds that user with `password` omitted
- **AND** `isLoggedIn` becomes `true`

#### Scenario: Logout clears global state

- **GIVEN** a logged-in user
- **WHEN** the logout action runs
- **THEN** the store's `user` becomes `null`
- **AND** `isLoggedIn` becomes `false`

### Requirement: Global reminder state store

The system SHALL expose a global reminder store holding the array of
`Reminder` objects and actions to add, delete, mark completed, and clear all.
Components SHALL read and mutate reminders exclusively through it (via the
existing `useReminders` hook surface).

#### Scenario: Adding a reminder updates the list

- **GIVEN** the reminder store
- **WHEN** the add action completes
- **THEN** the new reminder appears at the head of the store's `reminders` array

#### Scenario: Completing a reminder marks it done

- **WHEN** the mark-completed action runs for a reminder id
- **THEN** that reminder's `completed` becomes `true`
- **AND** its `notificationId` becomes `null`

### Requirement: AsyncStorage-backed persistence and hydration

Each store SHALL persist its state to AsyncStorage via Zustand's `persist`
middleware, writing automatically on every state change and rehydrating on app
launch. The store SHALL NOT persist transient flags (e.g. loading/hydration
state). Persistence SHALL be the store's responsibility; the previous
`StorageService` abstraction and service-layer persistence SHALL be removed.

#### Scenario: State survives app restart

- **GIVEN** a logged-in user with saved reminders
- **WHEN** the app is closed and relaunched
- **THEN** the stores rehydrate the same user and reminders from AsyncStorage

#### Scenario: Mutations persist automatically

- **WHEN** any store action changes persisted state
- **THEN** the updated state is written to AsyncStorage without an explicit save call

### Requirement: Notification side-effects on reminder mutations

Reminder actions SHALL invoke the injected `NotificationService` to schedule or
cancel OS notifications and SHALL record the resulting `notificationId` into
state within a single atomic update. The `NotificationService` dependency SHALL
be injectable into the reminder store to keep it unit-testable.

#### Scenario: Add schedules a notification and stores its id

- **WHEN** the add action runs
- **THEN** `NotificationService.scheduleNotification` is called
- **AND** the returned id is stored as the reminder's `notificationId` in the same update

#### Scenario: Delete cancels the scheduled notification

- **GIVEN** a reminder with a non-null `notificationId`
- **WHEN** the delete action runs
- **THEN** `NotificationService.cancelNotification` is called with that id
- **AND** the reminder is removed from state

#### Scenario: Incoming notification clears its id via an event bridge

- **GIVEN** a reminder whose scheduled notification fires
- **WHEN** the received-notification listener reports that notification id
- **THEN** the matching reminder's `notificationId` is set to `null`

### Requirement: Hydration gate for auth redirects

The root layout SHALL wait until the stores have finished rehydrating before
rendering route groups, so declarative auth redirects evaluate `isLoggedIn`
against hydrated state. This replaces the previous mock-seed gate.

#### Scenario: No login flash for a logged-in user

- **GIVEN** a previously logged-in user
- **WHEN** the app launches
- **THEN** the root layout renders nothing until rehydration completes
- **AND** the user is not briefly redirected to the login screen

### Requirement: No mock seeding on launch

The application SHALL NOT seed mock users or reminders on launch; `seedMockData`
and `src/mock-data.ts` SHALL be removed. The app SHALL start with empty state.

#### Scenario: Fresh install starts empty and requires registration

- **GIVEN** a fresh install with no persisted state
- **WHEN** the app launches
- **THEN** no users or reminders exist
- **AND** a user must register before they can log in

### Requirement: Reminder creation is resilient to notification failures

Creating a reminder SHALL persist the reminder even when its OS notification
cannot be scheduled (permission denied or the scheduler throws). In that case
the reminder's `notificationId` SHALL be `null` and the error SHALL NOT propagate
to the caller, so user data is never lost to a notification failure.

#### Scenario: Permission denied still saves the reminder

- **GIVEN** the scheduler returns `null` (permission denied)
- **WHEN** the add action runs
- **THEN** the reminder is added with `notificationId` `null`

#### Scenario: Scheduler error is contained

- **GIVEN** the scheduler throws
- **WHEN** the add action runs
- **THEN** the reminder is still added with `notificationId` `null`
- **AND** the add action resolves without throwing

### Requirement: Reminder mutations tolerate missing or already-cleared targets

Delete and mark-completed actions SHALL be safe no-ops when the target id does
not exist, and SHALL NOT attempt to cancel a notification for a reminder that has
no scheduled `notificationId`.

#### Scenario: Operating on an unknown id does nothing

- **WHEN** delete or mark-completed runs for an id not in the list
- **THEN** the reminder list is unchanged
- **AND** no notification cancellation is attempted

#### Scenario: Deleting a completed reminder does not cancel

- **GIVEN** a completed reminder whose `notificationId` is already `null`
- **WHEN** the delete action runs
- **THEN** the reminder is removed
- **AND** no notification cancellation is attempted

### Requirement: Email matching is normalized

Registration and login SHALL normalize emails by trimming surrounding whitespace
and lowercasing, so accounts match case-insensitively and duplicates differing
only by case or whitespace are rejected.

#### Scenario: Login succeeds regardless of case or padding

- **GIVEN** a user registered as `john@example.com`
- **WHEN** logging in with `  John@Example.com `
- **THEN** authentication succeeds

#### Scenario: Case-variant duplicate registration is rejected

- **GIVEN** a user registered as `john@example.com`
- **WHEN** registering `JOHN@example.com`
- **THEN** registration is rejected as a duplicate
