## Why

The app distributes state through two inconsistent React Context patterns
(`useProvideAuth` hook vs. state-in-provider) and spreads AsyncStorage
persistence across the service layer. Consolidating onto Zustand gives one
idiomatic, testable global-state model with built-in persistence, and is the
foundation the upcoming schema and feature churn (richer recurrence, edit flow,
passwordless login) will build on.

## What Changes

- Add `zustand` and adopt **two persisted stores**: `useAuthStore`
  (logged-in user) and `useReminderStore` (reminders).
- Each store uses the **`persist` middleware** backed by AsyncStorage —
  persistence becomes the store's responsibility, **synced automatically** on
  every change and **hydrated** on launch.
- Reminder actions call `NotificationService` **inline (dependency-injected)**
  to schedule/cancel and write the returned `notificationId` back into state in
  a single atomic update. The incoming-notification listener stays event-driven
  as a thin bridge hook.
- **BREAKING (internal):** remove `AuthProvider`, `RemindersProvider`,
  `useProvideAuth`, and the `StorageService` abstraction. Components consume the
  stores via the existing `useAuth` / `useReminders` hook names (now thin
  selectors), so screen code is largely untouched.
- Add a **hydration gate** at the root so auth redirects wait for stores to
  rehydrate (prevents a login-screen flash for logged-in users), replacing the
  current seed gate.
- **Remove `seedMockData`** and `src/mock-data.ts` (the data schema is about to
  change significantly). The app starts empty: users must register before they
  can log in.
- Update `openspec/CONTEXT.md` (architecture, persistence keys, mock-data
  sections) in this change, per project rules.

## Capabilities

### New Capabilities
- `state-management`: app-wide global state for the logged-in user and the
  user's reminders, with AsyncStorage-backed persistence/hydration and the
  notification side-effect contract for reminder mutations.

### Modified Capabilities
<!-- None — no existing specs. -->

## Non-goals

- **Per-user scoping** of reminders — storage stays global for now; namespacing
  by user is deferred.
- Renaming `Reminder` → `Task` or any data-model/recurrence changes.
- Setting up the Jest / RNTL test suite (separate planned work), though the new
  DI seam is designed to make stores unit-testable.
- Passwordless login (tracked separately).

## Impact

- **Dependencies:** add `zustand`. AsyncStorage retained (used by `persist`).
- **Removed:** `src/providers/*`, `src/services/storage.ts`,
  `src/mock-data.ts`, `useProvideAuth`.
- **Added:** `src/stores/auth-store.ts`, `src/stores/reminder-store.ts`,
  a notification-bridge hook, hydration gate in `app/_layout.tsx`.
- **Behavior change:** no seeded accounts → register-first.
- **Docs:** `openspec/CONTEXT.md` updated.
