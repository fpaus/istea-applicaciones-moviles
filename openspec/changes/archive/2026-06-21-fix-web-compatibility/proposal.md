## Why

The app currently crashes on web with two fatal errors: `Uncaught SyntaxError: import.meta may only appear in a module` in the browser console and `localStorage.getItem is not a function` in the Metro terminal. The root cause is the `"output": "static"` setting in `app.json`, which triggers server-side pre-rendering in Node.js — an environment where browser globals (`localStorage`, `import.meta`) don't exist. Since `expo-notifications` accesses `localStorage` at module initialization time, the pre-render phase crashes before any client code can execute. The app works perfectly on Android because it never goes through this SSR path.

## What Changes

- Switch web output mode from `"static"` (SSR/pre-rendered) to `"single"` (SPA) in `app.json`, eliminating the Node.js pre-render phase entirely.
- Add `Platform.OS` guards in the notification service so `expo-notifications` is never loaded on web, suppressing console warnings about unsupported web features.

## Non-goals

- Adding web push notification support (browser Notification API). Notifications remain a native-only feature; on web they gracefully degrade to no-ops.
- Migrating to a different bundler or adding a custom `metro.config.js`.
- Changing any business logic, domain model, or store behavior.

## Capabilities

### New Capabilities

- `web-platform-support`: Configuration and platform guards enabling the app to load and run in a web browser alongside Android.

### Modified Capabilities

_(none — no spec-level behavior changes; notification service already returns graceful no-ops when the module fails to load)_

## Impact

- **`app.json`**: web output mode changes from `static` to `single`.
- **`src/services/notifications.ts`**: notification module loading guarded by `Platform.OS !== 'web'` to prevent importing `expo-notifications` on web entirely.
- **No breaking changes.** Android behavior is completely unaffected. Notification graceful-degradation already exists (null `notificationId` fallback); this change just prevents the import-time crash on web.
