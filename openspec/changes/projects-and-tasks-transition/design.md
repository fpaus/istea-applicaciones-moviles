## Context

The application currently models local settings around a single user authenticated via email and password (stored completely on-device in `AsyncStorage`). This user can configure a flat list of `Reminder` entities. We are refactoring this into a project-based task workflow where "Users" are replaced with "Projects" (name-only, password removed), and "Reminders" are renamed to "Tasks" and scoped directly to these projects.

## Goals / Non-Goals

**Goals:**
- Transition the state and persistence structure from `User` to `Project`, and from `Reminder` to `Task`.
- Nest stored tasks under a record of `{ <projectId>: Task[] }`.
- Build a reusable, modular `<ProjectSelector>` component for selecting and creating projects.
- Implement zero-click transition on selection in the project selector screen.
- Integrate the `<ProjectSelector>` in the drawer to support instant, in-place switching of the active project without full-screen redirects.
- Prefix scheduled notifications with their corresponding project names: `[Project Name] Task Title`.

**Non-Goals:**
- Backend integration or server-side database syncing.
- Multi-user authentication (password/email flows).
- Project editing or deleting capabilities.

## Decisions

### 1. Store Task State in a Single Dictionary Keyed by Project ID
We will structure the tasks in `useTaskStore` as `Record<string, Task[]>` instead of creating multiple different storage keys.
- **Rationale**: Keeps the persistence system bounded to a single store (`task-store`) and enables easy scanning across all projects for cross-cutting tasks (like clearing a notification ID when a listener receives a fired event).
- **Alternative Considered**: Dynamically naming the storage key as `task-store-${projectId}` for each project. This was rejected because it makes it impossible to query or clean up task notifications for inactive projects, since those stores wouldn't be loaded or hydrated.

### 2. Custom Merge Strategy for task-store Rehydration
Zustand's default `persist` merge function does not handle combining dictionary-based persistence slices if they don't map exactly to the store's top-level state shape.
- **Technical Design**: We will use a custom `merge` option in `persist`:
```typescript
merge: (persistedState, currentState) => ({
  ...currentState,
  tasks: (persistedState as any)?.tasks || {},
})
```
- **Rationale**: Ensures the `tasks` dictionary is cleanly hydrated without overwriting actions or transient state flags.

### 3. Reusable `<ProjectSelector>` Component
We will abstract the picker/input layout into `src/components/ProjectSelector.tsx`.
- **UI Details**:
  - If `projects` list is empty, show a focused input field with label "Crear primer proyecto" and instructions.
  - If projects exist, show a dropdown list of project names. Clicking a project instantly calls `selectProject(id)`.
  - Next to or below the dropdown, a small button shows/collapses an inline input text box to "+ Crear nuevo proyecto".
- **Reuse**: Mounted directly in `app/(auth)/login.tsx` (fills the screen) and at the bottom of the drawer in `app/(app)/_layout.tsx` (sized compactly).

### 4. Global Scan for Notification Fired Callback
When a notification fires, the listener `useNotificationBridge` invokes `clearNotificationId(notificationId)`.
- **Implementation**: The store action will scan all keys in the `Record<string, Task[]>` state:
```typescript
clearNotificationId: (notificationId) => {
  const updatedTasks = { ...get().tasks };
  let found = false;
  for (const projectId in updatedTasks) {
    const list = updatedTasks[projectId];
    const idx = list.findIndex(t => t.notificationId === notificationId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], notificationId: null };
      found = true;
      break;
    }
  }
  if (found) set({ tasks: updatedTasks });
}
```
- **Rationale**: Resolves the matching task regardless of which project is currently active or selected, ensuring OS notification events are never missed.

## Risks / Trade-offs

- **[Risk]**: Hydration of a large dictionary of tasks could impact startup performance.
  - *Mitigation*: Since data is stored locally in `AsyncStorage` and limited to user-generated tasks, size is expected to stay well under 1MB. We keep the hydration gate at the root level to guarantee state is ready before rendering.
- **[Risk]**: Reusing the project selector in the drawer changes layout size dynamically when the inline input field is toggled.
  - *Mitigation*: We will wrap the input field inside a collapsible layout with smooth layout animations or clean spacing adjustments to avoid displacing other drawer list items awkwardly.
