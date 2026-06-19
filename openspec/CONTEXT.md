# Project Context — Recurring Reminders

> Authoritative description of what this app **is**, how it is built, what it
> does **today**, and where it is **headed**. Read this before proposing or
> implementing any change that touches business behavior, domain terminology,
> authorization, workflow rules, architecture, or data-model semantics.
> Keep it current: changes to those areas must update this file in the same change.

## 1. What the app is

**Recurring Reminders** is a React Native + Expo (TypeScript) mobile app for
creating reminders that fire **local device notifications** at a chosen
time of day. A reminder can optionally **repeat daily**. The app ships with a
local (on-device) email/password authentication flow and seeded mock data so it
is usable immediately without a backend.

There is **no remote server or API**. All state lives on the device via
`AsyncStorage`.

## 2. Tech stack

| Area | Choice |
| --- | --- |
| Runtime | Expo SDK 54, React 19, React Native 0.81 |
| Language | TypeScript (~5.9) |
| Routing | `expo-router` ~6 (file-based, route groups) |
| Navigation UI | `@react-navigation/drawer`, bottom-tabs, native stack |
| Notifications | `expo-notifications` (local scheduling + permissions) |
| Persistence | `@react-native-async-storage/async-storage` |
| Tooling | ESLint (`eslint-config-expo`), Prettier |

> Note: the project is named `recurring-remainders` (a typo for "reminders") —
> this is the repo/package name, not the domain term. The domain term is
> **reminder**.

## 3. Architecture

Layered, with Zustand stores for global state and persistence. Dependencies
point downward only.

```
UI  (app/* — Expo Router screens & layouts)
  │
hooks  (useAuth, useReminders, useNotificationBridge, useHydrated)  ← components consume only these
  │
stores  (Zustand: useAuthStore, useReminderStore)
  │   persist middleware ─► AsyncStorage         (state + persistence)
  │   reminder actions ─► NotificationService (injected dependency)
  │
services  (NotificationService — OS side-effects only) ─► expo-notifications
  │
types  (src/types/index.ts: Reminder, Time, User, NewReminder)
```

### Conventions (enforced)

- **Declarative auth guards.** Each route group's `_layout.tsx` returns
  `<Redirect>` based on `useAuth()` — never imperative `router.replace()` in an
  effect. (This avoids the "navigate before Root Layout mounted" crash.)
- **Persistence is owned by the stores.** Each Zustand store uses the `persist`
  middleware (AsyncStorage) — never call AsyncStorage directly from hooks,
  components, or services.
- **Stores own state + orchestration.** Side-effects (notifications) are called
  inline from store actions via an **injected** `NotificationService`, keeping the
  store unit-testable. The OS→store direction (a fired notification) is wired by
  the `useNotificationBridge` event hook.
- **Stores expose a tiny testable seam.** Each store is built by a factory over a
  state initializer (`createReminderState` / `createAuthState`) so tests construct
  a non-persisted store with fakes; the app wraps it in `persist`.
- **Hooks hold logic; components stay presentational.** Components consume hooks
  (`useReminders`, `useAuth`), which are thin selectors over the stores — not the
  stores or services directly.

## 4. Domain model

```ts
interface Time   { hour: number; minute: number; }          // 24h, 0–23 / 0–59

interface Reminder {
  id: string;                 // Date.now().toString()
  title: string;
  description: string;
  time: Time;                 // time of day to fire
  repeats: boolean;           // true → repeats daily; false → one-shot
  notificationId: string | null; // scheduled OS notification id (null once fired/completed)
  completed: boolean;
  createdAt: number;          // epoch ms
}

interface User   { email: string; password?: string; }      // password omitted in stored session
```

`NewReminder` (input to create) = `{ title, description, time, repeats }`.

### AsyncStorage keys

Written by each store's `persist` middleware (JSON-serialized store state):

| Key | Holds |
| --- | --- |
| `auth-store` | `{ user, users }` — session user (password stripped) + the on-device registry (email + password) |
| `reminder-store` | `{ reminders }` — array of `Reminder` |

## 5. Current features (as built)

### Authentication (local, on-device)
- **Register** (`useAuthStore.register`): rejects duplicate email; appends to the
  store's `users` registry.
- **Login** (`useAuthStore.login`): validates email + password against `users`;
  sets the session `user` (password stripped).
- **Logout**: clears the session `user` (keeps the registry).
- Session restored on launch by the auth store's `persist` rehydration.
- Screens: `(auth)/login.tsx`, `(auth)/register.tsx`. Register auto-logs-in.

### Reminders
- **Create** (`add.tsx`): title, optional description, time (hour 0–23 / minute
  0–59 via `NumberInput`), and a **"Repeat Daily"** switch. Save is disabled
  until title + hour + minute are provided.
- **List / dashboard** (`(app)/index.tsx`): `SectionList` split into
  **Active** (not completed, sorted by next upcoming time-of-day) and
  **Completed**. FAB routes to the add screen.
- **Complete** (`markCompleted`): marks done and cancels its scheduled
  notification (`notificationId → null`).
- **Delete**: removes the reminder and cancels its notification.
- **Clear all** (`clearAll`): wipes reminders and cancels all notifications.

### Notifications (local)
- Permission requested on demand; Android uses a `"reminders"` channel
  (HIGH importance, vibration, sound).
- **Scheduling** (`NotificationService.scheduleNotification`):
  - `repeats === true` → `DAILY` trigger at `time.hour:time.minute`.
  - `repeats === false` → one-shot `DATE` trigger at the next occurrence of
    that time (today if still in the future, else tomorrow).
- A received-notification listener (`useNotificationBridge`, subscribed via
  `NotificationService.addNotificationReceivedListener`) clears the
  `notificationId` of the matching reminder when it fires.

### Global state (Zustand)
- Two persisted stores: `useAuthStore` (session `user` + `users` registry) and
  `useReminderStore` (`reminders` + add/delete/markCompleted/clearAll).
- Each uses the `persist` middleware (AsyncStorage), syncing on every change and
  rehydrating on launch. Reminder actions call an **injected** `NotificationService`
  inline and write the returned `notificationId` back in the same update.
- Built via factories over a state initializer (`createAuthState` /
  `createReminderState`) for unit-testability; `useAuth` / `useReminders` are thin
  selectors over the stores.

### App bootstrap
- No mock seeding. The app starts empty; a user must **register before they can
  log in**.
- `app/_layout.tsx` mounts `useNotificationBridge` and renders nothing until
  `useHydrated()` reports both stores have rehydrated (the hydration gate).

### Routing structure
```
app/_layout.tsx          hydration gate (useHydrated) + useNotificationBridge → Stack
  (app)/_layout.tsx      Drawer; <Redirect href="/login"> if not logged in
    index.tsx            dashboard (Active / Completed) + FAB
    add.tsx              create reminder (hidden from drawer)
  (auth)/_layout.tsx     Stack; <Redirect href="/"> if already logged in
    login.tsx
    register.tsx
```

### UI building blocks (current)
- `src/components/ui/`: `Button`, `Card`, `Input`, `NumberInput`, `Typography`.
- `src/components/CardItem.tsx`: a reminder row.
- `src/constants/theme.ts`: `Colors`, `Utility` (spacing scale).

## 6. MVP limitations (important, intentional for now)

These are **known shortcuts**, not bugs. Call them out in proposals when a change
touches the affected area:

- **Recurrence is binary.** `repeats` is a boolean meaning "daily." There is no
  weekly / custom-interval / specific-days / end-date recurrence yet.
- **Auth is local (no backend).** Credentials live on-device in `AsyncStorage`;
  there is no remote server, token, or session expiry. The current password
  field is **planned for removal** (see Planned features) — login will become
  email-only — so hardening password security (hashing, etc.) is **not** a goal.
- **No edit flow.** Reminders can be created, completed, or deleted — not edited.
- **Test coverage is partial.** A Jest + React Native Testing Library harness is in
  place (`npm test`) with unit tests for the stores and hooks; screen/integration
  coverage is not built out yet. Note: RNTL is pinned to `13.2.0` with
  `react-test-renderer@19.1.0` to match Expo SDK 54's `react@19.1.0` (RNTL 14
  requires `react@19.2`).
- **No seeded data.** The app starts empty (seeding was removed); first use
  requires registering an account before logging in.

## 7. Planned / future features (intended direction)

> Direction, not commitments. Refine as the roadmap firms up. When any of these
> lands, move it into "Current features" and update the relevant sections above.

- **Richer recurrence engine** — weekly, custom intervals, specific weekdays,
  optional end date; this will expand the `Reminder` data model beyond the
  `repeats: boolean` field.
- **Edit reminders** — update title/description/time/recurrence and reschedule
  the underlying notification.
- **Passwordless login (intended design)** — remove the password field from the
  login/register screens and drop `password` from the `User` model; authenticate
  by email only. This is a deliberate design choice, **not** a security hardening
  of the current password flow.
- **Atomic Design component structure** — reorganize UI into
  `Components/Atoms`, `Components/Molecules`, `Components/Organisms`.
- **Broader test coverage** — the Jest + RNTL harness and store/hook unit tests
  now exist; extend toward screen/integration coverage, continuing the TDD/BDD
  (Red-Green-Refactor) workflow per the project rules.
