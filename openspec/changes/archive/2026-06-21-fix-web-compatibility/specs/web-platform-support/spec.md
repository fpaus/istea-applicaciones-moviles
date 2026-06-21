## ADDED Requirements

### Requirement: Web output uses SPA mode
The Expo web build SHALL use `"single"` (Single Page Application) output mode so that all application code executes exclusively in the browser environment, avoiding any Node.js server-side pre-rendering phase.

#### Scenario: App.json configures SPA output
- **WHEN** the `app.json` file is read by the Expo build system
- **THEN** `expo.web.output` SHALL be `"single"`

#### Scenario: Web app loads without SSR errors
- **WHEN** a user opens the app URL in a web browser
- **THEN** the app SHALL load without `import.meta` syntax errors or `localStorage` reference errors in the browser console

---

### Requirement: Notification module is not loaded on web
The notification service SHALL NOT import `expo-notifications` when running on the `web` platform, preventing module-level side-effects that are incompatible with browser environments.

#### Scenario: Platform guard prevents web import
- **WHEN** the notification service module is initialized on `Platform.OS === 'web'`
- **THEN** the `expo-notifications` module SHALL NOT be required or imported
- **AND** the `Notifications` reference SHALL remain `null`

#### Scenario: Notification service degrades gracefully on web
- **WHEN** any `NotificationService` method is called on web (e.g., `scheduleNotification`, `requestPermission`, `cancelNotification`)
- **THEN** the method SHALL return its null/no-op fallback value (`null`, `false`, or `void`) without throwing

#### Scenario: Android notification behavior is unchanged
- **WHEN** the notification service module is initialized on `Platform.OS === 'android'`
- **THEN** `expo-notifications` SHALL be loaded and configured with the existing notification handler
- **AND** all scheduling, permission, and listener functionality SHALL work identically to the current implementation

---

### Requirement: App loads and renders on web
The full application (hydration gate, project selection, task dashboard) SHALL load and render correctly in a web browser.

#### Scenario: Hydration completes on web
- **WHEN** the app is opened in a web browser
- **THEN** both persisted stores (project-store, task-store) SHALL rehydrate from storage
- **AND** the root layout SHALL render the app stack

#### Scenario: Core task management works on web
- **WHEN** a user interacts with the app in a web browser
- **THEN** creating, editing, completing, re-opening, and deleting tasks SHALL function correctly
- **AND** project creation, selection, renaming, and deletion SHALL function correctly
