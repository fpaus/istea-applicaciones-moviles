## Context

The app targets Android via Expo SDK 54 but also configures a web target in `app.json`. The web output is currently set to `"static"`, which invokes a server-side pre-rendering step in Node.js. Two libraries crash during this phase:

1. **`expo-notifications`** calls `localStorage.getItem()` at module initialization time (in `ServerRegistrationModule.web.js`). `localStorage` does not exist in Node.js.
2. A dependency in the bundle uses `import.meta`, which is ESM-only syntax and fails when Metro loads the bundle via `require()` during the Node.js pre-render phase.

The existing notification service (`src/services/notifications.ts`) already wraps the `require("expo-notifications")` in a `try/catch` and all service methods are null-safe. The resilient fallback architecture described in CONTEXT.md (§8, "Resilient Fallback on Notification Rejection") means that once the import-time crash is prevented, all downstream code already handles `Notifications === null` gracefully.

## Goals / Non-Goals

**Goals:**
- Make the app load and function in a web browser (SPA mode).
- Prevent `expo-notifications` from being imported on web, eliminating both the crash and console warnings.
- Preserve identical Android behavior — zero regressions.

**Non-Goals:**
- Implementing web push notifications via the browser Notification API.
- Adding a custom `metro.config.js` or migrating to a non-Metro bundler.
- SEO or static site generation (a task manager has no public-facing content to index).

## Decisions

### 1. Switch web output from `"static"` to `"single"`

**Decision**: Change `app.json` → `web.output` from `"static"` to `"single"`.

**Rationale**: `"static"` mode pre-renders every route in Node.js at build time, which requires all imported code to be Node-compatible. This app is a private task manager — there is no SEO benefit from static HTML. `"single"` (SPA) mode serves a single `index.html` and runs all code client-side, where browser globals like `localStorage` exist.

**Alternative considered**: Keep `"static"` and wrap all notification imports in `typeof window !== 'undefined'` guards. Rejected because this adds complexity for no benefit: the app doesn't need SSR, and `expo-notifications` has additional internal side-effects that are hard to guard against at every entry point.

### 2. Guard notification module loading by platform

**Decision**: In `src/services/notifications.ts`, add a `Platform.OS !== 'web'` check before the `require("expo-notifications")` call, so the module is never loaded on web.

**Rationale**: Even in SPA mode, `expo-notifications` emits console warnings on web (`Listening to push token changes is not yet fully supported on web`, `"shadow*" style props are deprecated`). By skipping the import entirely on web, we get a clean console. The existing null-safety in `NotificationService` (every method checks `if (!Notifications)` and returns gracefully) means no other code changes are needed.

**Alternative considered**: Dynamic `import()` with top-level `await`. Rejected because Metro's support for top-level `await` is inconsistent, and the synchronous `require()` with a guard is simpler and already proven in the codebase.

## Risks / Trade-offs

- **[Loss of static pre-rendering]** → Acceptable. The app has no public-facing content that benefits from SSR or static HTML. First load may be marginally slower than pre-rendered HTML, but the difference is negligible for an SPA with a small bundle.
- **[Notifications silently disabled on web]** → By design. Users on web will not receive push notifications; the app still functions for task management (create, edit, complete, delete). This is consistent with the existing resilient-fallback pattern (CONTEXT.md §8).
