## 1. Types and Infrastructure Setup

- [x] 1.1 Update `src/types/index.ts` to rename `User` -> `Project` (no password) and `Reminder` -> `Task`/`NewTask`
- [x] 1.2 Update `src/stores/types.ts` to replace `AuthState` -> `ProjectState` and `ReminderState` -> `TaskState`
- [x] 1.3 Rename unit test files under `src/stores/__tests__` and `src/hooks/__tests__` to match new domain names

## 2. Project State Store (useProjectStore & useProject)

- [x] 2.1 Write unit tests for `ProjectState` asserting project creation, name uniqueness (case-insensitive), and selection
- [x] 2.2 Refactor `auth-store.ts` to `project-store.ts` implementing `createProjectState` and the persisted `project-store`
- [x] 2.3 Refactor `useAuth.ts` hook to `useProject.ts` and update its unit tests

## 3. Task State Store (useTaskStore & useTasks)

- [x] 3.1 Write unit tests for `TaskState` asserting dictionary structure (`Record<string, Task[]>`), project prefixing in notification scheduling, and custom merge hydration logic
- [x] 3.2 Refactor `reminder-store.ts` to `task-store.ts` implementing `createTaskState` and the persisted `task-store` with custom merge rehydration
- [x] 3.3 Refactor `useReminders.ts` hook to `useTasks.ts` and update its unit tests

## 4. Reusable UI Components

- [x] 4.1 Implement reusable `ProjectSelector` component in `src/components/ProjectSelector.tsx`
- [x] 4.2 Add project list dropdown/picker and inline create input field to `ProjectSelector`
- [x] 4.3 Implement dynamic layout adjustments/collapsibles for in-drawer size compatibility

## 5. Screen Refactoring & Navigation Guards

- [x] 5.1 Refactor layout guards in `app/(auth)/_layout.tsx` and `app/(app)/_layout.tsx` to query `useProject` and redirect based on `currentProject`
- [x] 5.2 Refactor `app/(auth)/login.tsx` to mount `ProjectSelector` and trigger immediate redirection on select
- [x] 5.3 Delete deprecated `app/(auth)/register.tsx` screen
- [x] 5.4 Refactor `app/(app)/_layout.tsx` drawer UI to replace the "Logout" button with the embedded `ProjectSelector`
- [x] 5.5 Refactor `app/(app)/index.tsx` (dashboard) and `app/(app)/add.tsx` to use the updated task hooks and vocabulary
- [x] 5.6 Refactor `src/components/CardItem.tsx` to use the task vocabulary and types

## 6. Notification System Renaming

- [x] 6.1 Update `src/services/notifications.ts` to use `"tasks"` channel ID and `"Tasks"` channel name on Android
- [x] 6.2 Update `src/hooks/useNotificationBridge.ts` to call the new dictionary-scanning `clearNotificationId` action
- [x] 6.3 Update notification service tests to reflect renamed channel settings

## 7. Documentation and Validation

- [x] 7.1 Update `openspec/CONTEXT.md` to reflect the projects and tasks domain, storage keys, and updated UI conventions
- [x] 7.2 Run complete Jest test suite to ensure all unit tests pass successfully

## 8. Removal of Init Screen and Auto-selection

- [x] 8.1 Update `createProject` in `src/stores/project-store.ts` to auto-select the project on creation
- [x] 8.2 Update unit tests in `src/stores/__tests__/project-store.test.ts` to verify auto-selection on creation
- [x] 8.3 Delete the folder `app/(auth)` containing its layout and login files
- [x] 8.4 Update root stack layout in `app/_layout.tsx` to remove `(auth)` routes
- [x] 8.5 Update drawer layout in `app/(app)/_layout.tsx` to remove the authentication guard redirect
- [x] 8.6 Update `app/(app)/index.tsx` (dashboard) to render `ProjectSelector` inline when `currentProject` is null
- [x] 8.7 Update `ProjectSelector.tsx` to ensure `isCreating` resets to false and newly created projects are auto-selected

- [x] 8.8 Update hook/integration tests in `src/hooks/__tests__/hook-surface.test.tsx` to reflect the new behavior
- [x] 8.9 Update `openspec/CONTEXT.md` to remove references to the `(auth)` route group and describe the inline selector pattern

- [x] 8.10 Run complete Jest test suite to ensure all unit tests pass successfully

## 9. Code Optimization & UX Alerts

- [x] 9.1 Add `checkPermission` method to `NotificationService` in `src/services/notifications.ts`
- [x] 9.2 Implement fine-grained selectors and split `useTasks.ts` into `useActiveTasks`, `useCompletedTasks`, `useTaskActions` and delete `useTasks`
- [x] 9.3 Refactor `app/(app)/add.tsx` to consume `useTaskActions()`
- [x] 9.4 Refactor `app/(app)/index.tsx` to consume the new split hooks
- [x] 9.5 Implement a warning banner in `app/(app)/index.tsx` for missing notification permissions
- [x] 9.6 Add confirmation dialog (`Alert.alert`) in `useTaskActions`'s `clearAll` function
- [x] 9.7 Update unit tests in `src/hooks/__tests__/hook-surface.test.tsx` to assert new separate hooks and spy on `Alert.alert`
- [x] 9.8 Update `openspec/CONTEXT.md` to document hook separation design decision and known limitations (cascade delete, undo)
- [x] 9.9 Run complete Jest test suite to ensure all unit tests pass successfully

