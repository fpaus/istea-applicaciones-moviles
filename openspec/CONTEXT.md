# Project Context — Recurring Reminders

> Authoritative description of what this app **is**, how it is built, what it
> does **today**, and where it is **headed**. Read this before proposing or
> implementing any change that touches business behavior, domain terminology,
> authorization, workflow rules, architecture, or data-model semantics.
> Keep it current: changes to those areas must update this file in the same change.

## 1. What the app is

**Recurring Reminders** is a React Native + Expo (TypeScript) mobile app for
creating tasks that fire **local device notifications** at a chosen
time of day. A task can optionally **repeat daily**. The app ships with a
local (on-device) project selection flow so it is usable immediately without a backend or remote servers.

There is **no remote server or API**. All state lives on the device via
`AsyncStorage`.

## 2. Tech stack

| Area | Choice |
| --- | --- |
| Runtime | Expo SDK 54, React 19, React Native 0.81 |
| Language | TypeScript (~5.9) |
| Routing | `expo-router` ~6 (file-based, route groups) |
| Navigation UI | `expo-router` native stack with a custom header |
| Notifications | `expo-notifications` (local scheduling + permissions) |
| Persistence | `@react-native-async-storage/async-storage` |
| Tooling | ESLint (`eslint-config-expo`), Prettier |

> Note: the project is named `recurring-remainders` (a typo for "reminders") —
> this is the repo/package name, not the domain term. The domain term is
> **task**.

## 3. Architecture

Layered, with Zustand stores for global state and persistence. Dependencies
point downward only.

```
UI  (app/* — Expo Router screens & layouts)
  │
hooks  (view-model: useDashboard, useAddTaskForm, useProjectSelector, useNotificationPermission;
        data/actions: useProject, useActiveTasks, useCompletedTasks, useTaskActions;
        app-wiring: useNotificationBridge, useHydrated)  ← components consume only these
  │
stores  (Zustand: useProjectStore, useTaskStore)
  │   persist middleware ─► AsyncStorage         (state + persistence)
  │   task actions ─► NotificationService (injected dependency)
  │
services  (NotificationService — OS side-effects only) ─► expo-notifications
  │
utils  (src/utils/uuid.ts — generateUUID environment-agnostic UUIDs)
  │
types  (src/types/index.ts: Task, Time, Project, NewTask)
```

### Conventions (enforced)

- **Declarative auth/project guards.** Each route group's `_layout.tsx` returns
  `<Redirect>` based on `useProject()` — never imperative `router.replace()` in an
  effect. (This avoids the "navigate before Root Layout mounted" crash.)
- **Persistence is owned by the stores.** Each Zustand store uses the `persist`
  middleware (AsyncStorage) — never call AsyncStorage directly from hooks,
  components, or services. Both stores are additionally wrapped in the `devtools`
  middleware (named `ProjectStore` / `TaskStore`) for Redux DevTools inspection;
  it is a no-op in production when no DevTools backend is attached.
- **Stores own state + orchestration.** Side-effects (notifications) are called
  inline from store actions via an **injected** `NotificationService`, keeping the
  store unit-testable. The OS→store direction (a fired notification) is wired by
  the `useNotificationBridge` event hook.
- **Stores expose a tiny testable seam.** Each store is built by a factory over a
  state initializer (`createTaskState` / `createProjectState`) so tests construct
  a non-persisted store with fakes; the app wraps it in `persist`.
- **No logic in components — encapsulate everything in custom hooks.** Components
  are presentational only: they MUST NOT contain business logic, side-effects, or
  **React primitive hooks** (`useState`, `useEffect`, `useMemo`, `useCallback`,
  `useRef`, `useReducer`). All of that lives in custom hooks under `src/hooks/`.
  A screen/component consumes exactly the custom hook(s) it needs (e.g.
  `useDashboard`, `useAddTaskForm`, `useProjectSelector`, `useNotificationPermission`)
  plus library hooks that only return data/navigation (`useRouter`,
  `useSafeAreaInsets`). View-model hooks may compose other hooks
  (e.g. `useDashboard` composes `useActiveTasks` + `useCompletedTasks` +
  `useTaskActions` + `useNotificationPermission`).
- **One hook per file.** Each hook lives in its own `src/hooks/<hookName>.ts`
  module (e.g. `useActiveTasks`, `useCompletedTasks`, `useTaskActions` are
  separate files, not a shared barrel).
- **UI text is always in Spanish.** All user-facing strings (labels, buttons,
  placeholders, titles, alerts, empty/error states, notification copy) MUST be in
  Spanish. Code identifiers, comments, store/notification IDs, and log messages
  stay in English.
- **Stores stay decoupled.** A store MUST NOT import another store. Values from
  one domain needed by another are passed in as action arguments by the calling
  hook (e.g. `useTaskActions` passes the active `projectName` into
  `taskStore.addTask(projectId, projectName, data)`), so each store's unit tests
  are fully isolated.

## 4. Domain model

```ts
interface Time   { hour: number; minute: number; }          // 24h, 0–23 / 0–59

interface Project {
  id: string;                 // generateUUID() (RFC4122 v4)
  name: string;
}

interface Task {
  id: string;                 // generateUUID() (RFC4122 v4)
  title: string;
  description: string;
  time: Time;                 // time of day to fire
  repeats: boolean;           // true → repeats daily; false → one-shot
  notificationId: string | null; // scheduled OS notification id (null once fired/completed)
  completed: boolean;

  createdAt: number;          // epoch ms
}
```

`NewTask` (input to create) = `{ title, description, time, repeats }`.

### AsyncStorage keys

Written by each store's `persist` middleware (JSON-serialized store state):

| Key | Holds |
| --- | --- |
| `project-store` | `{ currentProject, projects }` — active project session + list of on-device registered projects |
| `task-store` | `{ tasks }` — record of `{ [projectId: string]: Task[] }` |

## 5. Current features (as built)

### Project Selection (local, on-device)
- **Create Project** (`useProjectStore.createProject`): rejects duplicate project names (case-insensitive), appends to the store's `projects` list, and automatically selects it as the active `currentProject`.
- **Select Project** (`useProjectStore.selectProject`): sets the active `currentProject` in the store.
- **Switch Project**: The dashboard header shows the active project name; tapping it (`<HeaderProjectSwitcher>`) opens the shared `<ProjectPickerModal>` to switch the active project instantly, in place. The picker also offers a "+ Nuevo Proyecto" row to create another project without leaving the dashboard.
- Session restored on launch by the project store's `persist` rehydration.

### Tasks
- **Create** (`add.tsx`): title, optional description, time (hour 0–23 / minute
  0–59 via `NumberInput`), and a **"Repeat Daily"** switch. Save is disabled
  until title + hour + minute are provided.
- **List / dashboard** (`(app)/index.tsx`): `SectionList` split into
  **Active Tasks** (not completed, sorted by next upcoming time-of-day) and
  **Completed**. FAB routes to the add screen. Renders `ProjectSelector` inline
  if `currentProject` is null.
- **Complete** (`markCompleted`): marks done and cancels its scheduled
  notification (`notificationId → null`).
- **Delete**: removes the task and cancels its notification.
- **Clear all** (`clearAll`): wipes all tasks inside the active project and cancels their notifications.

### Notifications (local)
- Permission requested on demand; Android uses a `"tasks"` channel
  (HIGH importance, vibration, sound).
- **Scheduling** (`NotificationService.scheduleNotification`):
  - `repeats === true` → `DAILY` trigger at `time.hour:time.minute`.
  - `repeats === false` → one-shot `DATE` trigger at the next occurrence of
    that time (today if still in the future, else tomorrow).
  - Title is prefixed with active project name: `[Project Name] Task Title`.
- A received-notification listener (`useNotificationBridge`, subscribed via
  `NotificationService.addNotificationReceivedListener`) clears the
  `notificationId` of the matching task across all projects when it fires.

### Global state (Zustand)
- Two persisted stores: `useProjectStore` (`currentProject` + `projects` list) and
  `useTaskStore` (`tasks` dictionary + add/delete/markCompleted/clearAll actions).
- Each uses the `persist` middleware (AsyncStorage), syncing on every change and
  rehydrating on launch. Task actions call an **injected** `NotificationService`
  inline and write the returned `notificationId` back in the same update.
- Built via factories over a state initializer (`createProjectState` /
  `createTaskState`) for unit-testability; `useProject` / `useActiveTasks` / `useCompletedTasks` / `useTaskActions` are thin
  selectors over the stores.

### App bootstrap
- The app starts empty; first use requires **creating a project**.
- `app/_layout.tsx` mounts `useNotificationBridge` and renders nothing until
  `useHydrated()` reports both stores have rehydrated (the hydration gate).

### Routing structure
```
app/_layout.tsx          hydration gate (useHydrated) + useNotificationBridge → Stack
  (app)/_layout.tsx      Stack (header hidden if no active project); dashboard header hosts HeaderProjectSwitcher
    index.tsx            dashboard (Active / Completed) + FAB; renders ProjectSelector inline if no active project
    add.tsx              create task (pushed screen with back affordance, no switcher)
```


### UI building blocks (current)
- `src/components/ui/`: `Button`, `Card`, `Input`, `NumberInput`, `Typography`.
- `src/components/CardItem.tsx`: a task row.
- `src/components/ProjectSelector.tsx`: reusable project list selector and creator.
- `src/constants/theme.ts`: `Colors`, `Utility` (spacing scale).

## 6. MVP limitations (important, intentional for now)

These are **known shortcuts**, not bugs. Call them out in proposals when a change
touches the affected area:

- **Recurrence is binary.** `repeats` is a boolean meaning "daily." There is no
  weekly / custom-interval / specific-days / end-date recurrence yet.
- **Auth is local (no backend).** There are no passwords or credentials. Projects are name-only, managed locally via on-device storage.
- **No edit flow.** Tasks can be created, completed, or deleted — not edited.
- **Test coverage is partial.** A Jest + React Native Testing Library harness is in
  place (`npm test`) with unit tests for the stores and hooks; screen/integration
  coverage is not built out yet.
- **No seeded data.** The app starts empty; first use requires creating a project.
- **No project deletion/archiving.** There is no cascade deletion or archiving of projects; created projects and their tasks persist indefinitely.
- **No task undo flow.** Once a task is completed or deleted, its scheduled OS notification is immediately canceled, and there is no "undo" recovery flow.

## 7. Planned / future features (intended direction)

- **Richer recurrence engine** — weekly, custom intervals, specific weekdays,
  optional end date.
- **Edit tasks** — update title/description/time/recurrence and reschedule
  the underlying notification.
- **Atomic Design component structure** — reorganize UI into
  `Components/Atoms`, `Components/Molecules`, `Components/Organisms`.
- **Broader test coverage** — extend Jest + RNTL harness toward screen/integration coverage.

## 8. Key Architectural Decisions (Projects & Tasks Transition)

The following architectural and design decisions were made during the refactoring from the legacy "Users & Reminders" model to the "Projects & Tasks" system:

- **Isolated Dict-Based Storage Pattern**: Tasks are stored within a dictionary structured as `{ [projectId: string]: Task[] }`. This guarantees strict sandboxing between projects, preventing database reads, writes, or loops in one project from leaking or modifying tasks in other projects.
- **Granular Scoped Notification Canceling**: When clearing all tasks inside a project (e.g., `clearAll`), the store loops through the active project's tasks and cancels their notifications individually by ID instead of calling a global `cancelAllNotifications()`. This protects scheduled notifications in other projects from being cleared.
- **Cross-Project Notification Scan Bridge**: Because OS-level local notification fired events only receive a flat `notificationId` payload without metadata, the `useNotificationBridge` invokes `clearNotificationId` which scans the entire dictionary across all project IDs to locate and nullify the matching notification ID globally.
- **Resilient Fallback on Notification Rejection**: If local notification scheduling fails or the user denies permission, the store still successfully persists the task with a `null` `notificationId`. The application handles `null` notification IDs gracefully, ensuring local task access remains unimpeded.
- **Case-Insensitive Project Uniqueness**: To avoid duplicate projects, project creation checks name existence using trimmed, case-insensitive logic.
- **Seamless In-Place Project Selector**: Rather than requiring a logout step, the dashboard header exposes `<HeaderProjectSwitcher>` (the active project name as a tappable affordance), enabling instant project-switching in-place without redirecting to a splash screen or forcing screen resets. First-run selection still renders `<ProjectSelector>` inline on the dashboard when no project is active.
- **Single Reusable Picker (`<ProjectPickerModal>`)**: The project list + inline-create modal is a single presentational component whose behavior is passed entirely via props (`onSelect`, `onClose`, optional `create` flow). Both `<ProjectSelector>` (list-only) and `<HeaderProjectSwitcher>` (list + create) render it, so the picker UI/UX has one source of truth. `useHeaderProjectSwitcher` delegates to `useProjectSelector` so the create/select logic also lives in one place.
- **Separation of Read-only and Actionable Hooks**: The hook layer is split into fine-grained task list hooks (`useActiveTasks()`, `useCompletedTasks()`) and a mutation hook (`useTaskActions()`). This ensures that screens only dispatching actions (e.g., the add task screen) do not subscribe to list changes, preventing unnecessary renders.
- **Interactive Notification Permission Check**: The application queries OS permission status before rendering the dashboard and displays an inline interactive warning banner if notifications are disabled, allowing the user to request permission directly.
- **Destructive Confirmation Interceptors**: Destructive hook actions (like `clearAll`) are intercepted by native confirmation alerts before executing store mutations to prevent accidental data loss.

