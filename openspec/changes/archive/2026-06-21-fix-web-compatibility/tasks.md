## 1. Configuration

- [x] 1.1 Change `app.json` → `expo.web.output` from `"static"` to `"single"`

## 2. Platform Guard for Notifications

- [x] 2.1 Add `Platform.OS !== 'web'` guard around the `require("expo-notifications")` call in `src/services/notifications.ts`, so the module is never loaded on web
- [x] 2.2 Update the existing unit tests for `NotificationService` to verify the web platform guard (ensure methods return null/no-op on web)

## 3. Verification

- [x] 3.1 Run existing test suite (`npm test`) and confirm all tests pass
- [x] 3.2 Start the dev server (`npm run start`), open in web browser, and confirm the app loads without console errors (`import.meta`, `localStorage`)
- [x] 3.3 Verify core task management works on web: create a project, add a task, complete it, delete it
- [x] 3.4 Verify Android continues to work: notifications schedule and fire correctly

## 4. Documentation

- [x] 4.1 Update `openspec/CONTEXT.md` to reflect that the app now supports web (SPA mode) and that notifications are native-only with graceful degradation on web
