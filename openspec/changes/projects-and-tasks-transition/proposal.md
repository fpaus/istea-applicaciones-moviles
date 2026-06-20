## Why

The current local user authentication (email/password registry) and global reminder system are being refactored to support a multi-project workflow. By transitioning "Users" to "Projects" and "Reminders" to "Tasks", we align the app with a productivity-oriented task management system. Removing password security overhead simplifies access, while scoping tasks to individual projects allows users to categorize their work.

## What Changes

- **Vocab & Domain Model Rename**: Rebrand "User" to "Project" (remove the `password` field entirely) and "Reminder" to "Task" throughout the codebase.
- **Project Selector UX**: Refactor the login screen into a project selector. Selecting a project from the dropdown instantly activates its session and loads its dashboard (no "Entrar" button). An inline text field is added to create new projects.
- **In-Drawer Switcher**: Replace the "Logout" button in the Drawer layout with a reusable project selector component, allowing users to switch active projects instantly in-place.
- **Task Scoping**: Group stored tasks by project ID under the key `"task-store"`. Selecting a project dynamically loads and mutates only that project's tasks.
- **Prefix Notifications**: Format scheduled local task notification titles as `[Project Name] Task Title`.
- **Channel Renaming**: Update the Android notification channel name to `"Tasks"` and ID to `"tasks"`.
- **BREAKING (internal)**: Remove `useAuth`, `useReminders`, `useAuthStore`, and `useReminderStore` in favor of `useProjects`, `useTasks`, `useProjectStore`, and `useTaskStore`. Remove the `/register` screen.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `state-management`: Replaces local user registry with local project list and active project selection. Scopes task actions (add, delete, complete, clearAll) to the active project ID and persists them as `{ <projectId>: Task[] }`.

## Non-goals

- Adding user passwords, emails, or server-based synchronization (the app remains completely local on-device).
- Implementing project deletion or editing in this phase (deferred to a future milestone).
- Supporting complex task recurrence beyond the existing daily repeat checkbox.
