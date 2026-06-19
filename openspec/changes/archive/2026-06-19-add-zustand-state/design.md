## Context

State is distributed today through two inconsistent React Context patterns
(`useProvideAuth` hook + `AuthProvider`; state-in-provider `RemindersProvider`)
and persistence is spread across the service layer: `RemindersService` and
`AuthService` are stateless transformers that read/write AsyncStorage through
`StorageService` as a side-effect, while React holds the latest snapshot.

Reminders carry OS side-effects: adding schedules a local notification (whose
returned id must be stored on the reminder), deleting/completing cancels it, and
a live listener nulls the `notificationId` when a notification fires. Per
`openspec/CONTEXT.md`, auth guards are **declarative** (`<Redirect>` in each
route group's `_layout.tsx`) and must not regress into imperative navigation.

This change consolidates state onto Zustand with persistence owned by the store.

## Goals / Non-Goals

**Goals:**

- One idiomatic, testable global-state model: `useAuthStore` + `useReminderStore`.
- Persistence/hydration owned by the stores via `persist` (AsyncStorage).
- Keep the `useAuth` / `useReminders` hook surface so screens barely change.
- Preserve declarative auth-guard behavior with a correct hydration gate.
- Make the reminder store unit-testable via an injectable `NotificationService`.

**Non-Goals:**

- Per-user scoping of reminders (storage stays global).
- Data-model/recurrence changes or `Reminder` → `Task` rename.
- Standing up the Jest / RNTL test suite (the DI seam just enables it).
- Passwordless login.

## Decisions

### Two stores, not one

`useAuthStore` and `useReminderStore` are separate. Zustand guidance favors
multiple small stores over a single global one; auth and reminders have
independent lifecycles. When per-user scoping later arrives, the reminder store
can read `useAuthStore.getState().user` — cross-store reads are trivial, so this
does not paint us into a corner. *Alternative:* single store with slices —
rejected as unnecessary coupling for two independent domains.

### Persistence via `persist` middleware (store-owned)

Each store wraps its initializer in `persist(..., { name, storage:
createJSONStorage(() => AsyncStorage), partialize })`. `partialize` excludes
transient flags (hydration/loading). This removes `StorageService` and the
service-layer persistence entirely. *Alternative:* keep services persisting and
use Zustand only as the React layer — rejected; it leaves two sources of truth
for storage and defeats the point.

### Inline dependency-injected side-effects, not an event bus

Reminder actions are async and call an **injected** `NotificationService`
inline, then commit state once (including the returned `notificationId`):

```
createReminderStore(deps = { notifications: notificationService })
  addReminder: async (data) => {
    const id = await deps.notifications.scheduleNotification(...)
    set(s => ({ reminders: [{ ...newReminder, notificationId: id }, ...s.reminders] }))
  }
```

Chosen over a fire-and-forget event bus for **testability and maintainability**:
a single synchronous-to-reason-about unit with one injection seam (pass a fake
in tests, no module mocking), a linear data flow, and no async write-back loop
for `notificationId`. Events optimize for many unknown consumers — here there is
exactly one (the OS scheduler). The factory defaults to the real singleton so
app code stays a one-liner: `export const useReminderStore = createReminderStore()`.

### Events only for the inbound direction

The store→service direction is a **call** (inline await). The OS→store direction
(a notification fires) remains **event-driven**: a thin bridge hook subscribes to
the received-notification listener and calls a store action to null the matching
`notificationId`. This keeps the one genuinely external signal decoupled.

### Hydration gate replaces the seed gate

`persist` rehydrates asynchronously. The root layout gates render on a
`hasHydrated` flag (via `onRehydrateStorage` / `persist.onFinishHydration`) so
declarative `<Redirect>` guards evaluate `isLoggedIn` against hydrated state and
a logged-in user never flashes the login screen. The current `seedMockData` gate
is removed along with seeding.

## Risks / Trade-offs

- **Storage-key migration** → `persist` uses new keys (`auth-store`,
  `reminder-store`); existing dev data under the old keys (`@auth_user`,
  `@auth_users_list`, `@notifications_reminders`) is orphaned. Acceptable: dev-only
  data, and seeding is being removed anyway.
- **No seeded accounts** → first launch is register-first; a returning user with
  empty storage cannot log in until they register. Intentional (per proposal).
- **Hydration gate done wrong** → premature redirect or permanent blank screen.
  Mitigation: gate strictly on the hydration flag from both stores; cover with the
  "no login flash" scenario when the test suite lands.
- **Behavioral parity of moved logic** → reminder sorting/active-completed split
  currently lives in `RemindersService` pure helpers. Mitigation: keep those as
  pure functions (store or a util), do not rewrite their logic in this change.
- **CONTEXT.md drift** → architecture section still says "React Context".
  Mitigation: update `openspec/CONTEXT.md` in this change (tasks include it).
