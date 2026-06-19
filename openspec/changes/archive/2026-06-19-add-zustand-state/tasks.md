## 1. Install dependencies & test harness (prerequisite)

> Must come first: Red-Green-Refactor below depends on a working unit-test runner.

- [x] 1.1 Install runtime dep: `npx expo install zustand`; confirm `@react-native-async-storage/async-storage` stays installed (used by `persist`).
- [x] 1.2 Install missing test dependencies (align versions with Expo/React 19 via `expo install` where applicable): `jest-expo`, `jest`, `@testing-library/react-native`, `@types/jest`, `react-test-renderer`.
- [x] 1.3 Add Jest config (`preset: jest-expo`, `transformIgnorePatterns` for RN/Expo, setup file) and a `"test"` script; wire the AsyncStorage Jest mock so `persist` works under test.
- [x] 1.4 Add a trivial smoke test and run the suite to confirm the harness executes green.
- [x] 1.5 Define the store contracts: `AuthState` (user, isLoggedIn, hasHydrated, login/register/logout), `ReminderState` (reminders, hasHydrated, add/delete/markCompleted/clearAll, clearNotificationId), and the injectable `NotificationService` dependency shape.

## 2. Reminder store (Red → Green → Refactor)

- [x] 2.1 (Red) Write unit tests for `createReminderStore(deps)` with a fake `NotificationService`: add stores returned `notificationId` atomically; delete cancels by id and removes; markCompleted sets `completed` true + `notificationId` null; clearAll cancels all; clearNotificationId matches by id. Run; verify they fail.
- [x] 2.2 (Green) Implement `src/stores/reminder-store.ts` as `createReminderStore(deps = { notifications: notificationService })` wrapped in `persist` (key `reminder-store`, `createJSONStorage(() => AsyncStorage)`, `partialize` excluding `hasHydrated`). Export `useReminderStore = createReminderStore()`. Make tests pass.
- [x] 2.3 (Refactor) Keep the active/completed split + next-upcoming sort as pure helpers reused by the store; confirm no behavior change and tests stay green.

## 3. Auth store (Red → Green → Refactor)

- [x] 3.1 (Red) Write unit tests: successful login sets user with `password` stripped and `isLoggedIn` true; logout clears user; register adds a user without logging in. Run; verify they fail.
- [x] 3.2 (Green) Implement `src/stores/auth-store.ts` with `persist` (key `auth-store`, AsyncStorage, `partialize` excluding `hasHydrated`), preserving the email/password credential check. Make tests pass.
- [x] 3.3 (Refactor) Wire `hasHydrated` via `onRehydrateStorage`/`persist.onFinishHydration` in both stores; confirm transient flags are not persisted; tests stay green.

## 4. Notification bridge (Red → Green → Refactor)

- [x] 4.1 (Red) Write a test that, given a received-notification id, the bridge invokes `clearNotificationId` on the reminder store. Run; verify it fails.
- [x] 4.2 (Green) Implement `useNotificationBridge`: subscribes to the received-notification listener and calls `clearNotificationId` (replaces `RemindersProvider`'s `useNotifications` wiring). Make the test pass.
- [x] 4.3 (Refactor) Ensure the listener is cleaned up on unmount; tests stay green. (Note: required pinning RNTL to 13.2.0 + react-test-renderer 19.1.0 for React 19.1 renderer compat.)

## 5. Hook surface — `useAuth` / `useReminders` selectors (Red → Green → Refactor)

- [x] 5.1 (Red) Write tests asserting `useAuth`/`useReminders` expose the same return shape screens already consume. Run; verify they fail.
- [x] 5.2 (Green) Reimplement `src/hooks/useAuth.ts` and `src/hooks/useReminders.ts` as thin selectors over the stores, preserving the existing shape. Make tests pass.
- [x] 5.3 (Refactor) Remove now-dead context dependencies from the hooks; tests stay green.

## 6. Hydration gate (Red → Green → Refactor)

- [x] 6.1 (Red) Write a test for a `useHydrated()` hook that returns true only once both stores report `hasHydrated`. Run; verify it fails.
- [x] 6.2 (Green) Implement `useHydrated()`; update `app/_layout.tsx` to mount `useNotificationBridge`, drop the seed gate, and render `null` until `useHydrated()` is true. Make the test pass.
- [x] 6.3 (Refactor) Verify declarative `<Redirect>` guards in `(app)/_layout.tsx` and `(auth)/_layout.tsx` evaluate against hydrated state (no login-screen flash, no imperative navigation); tests stay green. (Guards unchanged — `loading` is now `!hasHydrated`; root gates on both stores.)

## 7. Teardown, docs & validation (cleanup — non-testable)

- [x] 7.1 Delete `src/providers/auth-provider.tsx`, `src/providers/reminders-provider.tsx`, `useProvideAuth`, `src/services/storage.ts`, and `src/mock-data.ts`; strip AsyncStorage responsibilities from `AuthService`/`RemindersService` (keep notification + pure-logic concerns the stores reuse). (Both services fully absorbed by the stores → `services/auth.ts` and `services/reminders.ts` deleted entirely; only `NotificationService` remains.)
- [x] 7.2 Run the full test suite and `tsc --noEmit`; fix broken imports/types. (Do not push.) — 18 tests / 5 suites green; tsc clean.
- [x] 7.3 Update `openspec/CONTEXT.md`: Architecture (React Context → Zustand stores; `persist` owns persistence; `StorageService` removed), AsyncStorage keys table (`auth-store`, `reminder-store`), Mock-data section (seeding removed → register-first), and move global state management into "Current features".
- [x] 7.4 Run `openspec validate add-zustand-state --strict` and resolve any issues.

## 8. Hardening & coverage (Red → Green → Refactor)

- [x] 8.1 (Red) Reminder edge-case tests: add with denied permission (scheduler returns null) stores `notificationId` null; add when scheduler throws still adds (null id) and does not reject; delete/markCompleted on unknown id is a no-op with no cancel; delete a completed (null-id) reminder removes without cancelling. Run; verify failures. (4/5 already passed — confirmed existing guards; only the throw case was Red.)
- [x] 8.2 (Green) Make `addReminder` resilient: wrap the scheduler call so a thrown error is contained and the reminder persists with `notificationId` null. Confirm the existing guards make the other edge cases pass.
- [x] 8.3 (Red) Pure selector tests with deterministic time (fake timers): `selectActive` excludes completed and orders by next-upcoming time-of-day with midnight wrap-around; `selectCompleted` returns only completed and does not mutate input. Run; verify failures.
- [x] 8.4 (Green) Confirm/adjust `selectActive`/`selectCompleted` to satisfy the deterministic ordering tests; keep them pure (no input mutation). (Already pure — filter copies before sort; no change needed.)
- [x] 8.5 (Red) Auth email-normalization tests: login matches case-insensitively and trims padding; case-variant duplicate registration is rejected. Run; verify failures.
- [x] 8.6 (Green) Normalize emails (trim + lowercase) in `register` and `login`. Make tests pass.
- [x] 8.7 (Red→Green) Persistence integration tests against the AsyncStorage mock: an action writes the store key; a pre-seeded key rehydrates state and flips `hasHydrated` true.
- [x] 8.8 (Coverage) `NotificationService.scheduleNotification` tests with fake timers: DAILY trigger when repeating; one-shot DATE today vs. rolled to tomorrow by next-occurrence; returns null + schedules nothing when permission denied. Mock `expo-notifications`/`expo-device` in the harness for hermetic tests.
- [x] 8.9 Run the full suite + `tsc --noEmit` + lint on touched files; re-run `openspec validate --strict`.

## 9. Recommendations & Hardening (Refactor)

- [x] 9.1 Wrap `activeReminders` and `completedReminders` selectors in `useMemo` within `src/hooks/useReminders.ts`.
- [x] 9.2 Transition from `Date.now().toString()` to `crypto.randomUUID()` in `src/stores/reminder-store.ts` for safe unique ID generation.
- [x] 9.3 Wrap store creation in Zustand `devtools` middleware in `src/stores/auth-store.ts` and `src/stores/reminder-store.ts` for improved developer experience.
- [x] 9.4 Run the full suite + `tsc --noEmit` + `openspec validate add-zustand-state --strict` to verify everything is green.
- [x] 9.5 Memoize hook returned objects in `src/hooks/useAuth.ts` and `src/hooks/useReminders.ts` to maintain reference stability.
- [x] 9.6 Implement background/response listener in `useNotificationBridge` to clear `notificationId` when user taps on notification response.

