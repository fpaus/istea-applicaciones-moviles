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

Layered, with dependency injection at the service layer and React Context for
state distribution. Dependencies point downward only.

```
UI  (app/* — Expo Router screens & layouts)
  │
hooks  (useAuth, useReminders, useNotifications)   ← components consume only these
  │
providers  (React Context: AuthProvider, RemindersProvider)
  │
services  (singletons, constructor-injected)
  │   AuthService ─┐
  │   RemindersService ─┼─► StorageService (AsyncStorage)
  │   NotificationService ─► expo-notifications
  │
types  (src/types/index.ts: Reminder, Time, User)
```

### Conventions (enforced)

- **Declarative auth guards.** Each route group's `_layout.tsx` returns
  `<Redirect>` based on `useAuth()` — never imperative `router.replace()` in an
  effect. (This avoids the "navigate before Root Layout mounted" crash.)
- **Services are classes** with constructor injection, exported as ready-made
  **singletons** (e.g. `export const remindersService = new RemindersService(...)`).
- **All persistence goes through `StorageService`** — never call AsyncStorage
  directly from providers, hooks, or components.
- **Hooks hold logic; components stay presentational.** Components consume hooks
  (`useReminders`, `useAuth`, `useNotifications`), not services directly.

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

| Key | Holds |
| --- | --- |
| `@auth_users_list` | array of registered `User` (email + password) |
| `@auth_user` | current session `User` (password stripped) |
| `@notifications_reminders` | array of `Reminder` |

## 5. Current features (as built)

### Authentication (local, on-device)
- **Register** (`AuthService.register`): rejects duplicate email; appends to
  `@auth_users_list`.
- **Login** (`AuthService.login`): validates email + password against the list;
  stores the session (password stripped) under `@auth_user`.
- **Logout**: clears `@auth_user`.
- Session restored on launch via `useProvideAuth` → `AuthService.getUser`.
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
- A received-notification listener (`RemindersProvider` → `useNotifications`)
  clears the `notificationId` of the matching reminder when it fires.

### Mock data / bootstrap
- On launch, `app/_layout.tsx` runs `seedMockData()` and blocks render until done.
- Seeds **10 mock users** (e.g. `admin@example.com` / `admin`; others use
  `password123`) and **25 mock reminders** (mixed completed / recurring) only
  when storage is empty.

### Routing structure
```
app/_layout.tsx          seed gate → AuthProvider → RemindersProvider → Stack
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
- **No tests yet.** No Jest / React Native Testing Library setup is in place
  despite the test-first philosophy (see config rules); establishing it is
  early planned work.
- **Mock seeding always runs on first launch** and gates the UI.

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
- **Test suite** — Jest + React Native Testing Library, driving a TDD/BDD
  (Red-Green-Refactor) workflow per the project rules.
