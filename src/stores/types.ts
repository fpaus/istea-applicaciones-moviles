import { NewTask, Task, Time, Responsible, Project } from "../types";

/**
 * Injectable side-effect dependency for the task store. The store calls
 * these inline and records the returned id into state in the same update.
 * Implemented in production by `NotificationService`; replaced by a fake in tests.
 */
export interface NotificationScheduler {
  scheduleNotification(
    title: string,
    body: string,
    time: Time,
    repeats: boolean,
  ): Promise<string | null>;
  cancelNotification(id: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
}

/**
 * Injectable side-effect dependency for calendar event management.
 * Mirrors NotificationScheduler pattern. Implemented by `CalendarService`;
 * replaced by a fake in tests.
 */
export interface CalendarScheduler {
  createEvent(
    title: string,
    notes: string,
    time: Time,
    repeats: boolean,
    responsible?: Pick<Responsible, "name" | "email"> | null,
  ): Promise<string | null>;
  updateEvent(
    eventId: string,
    title: string,
    notes: string,
    time: Time,
    repeats: boolean,
    responsible?: Pick<Responsible, "name" | "email"> | null,
  ): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}

export interface TaskDeps {
  notifications: NotificationScheduler;
  calendar?: CalendarScheduler;
}

export interface TaskState {
  tasks: Record<string, Task[]>;
  hasHydrated: boolean;
  addTask: (
    projectId: string,
    projectName: string,
    data: NewTask,
  ) => Promise<void>;
  deleteTask: (projectId: string, id: string) => Promise<void>;
  updateTask: (
    projectId: string,
    id: string,
    patch: Partial<Omit<Task, "id" | "completed" | "createdAt">>,
    projectName?: string,
  ) => Promise<void>;
  markCompleted: (projectId: string, id: string) => Promise<void>;
  reopenTask: (
    projectId: string,
    id: string,
    projectName?: string,
  ) => Promise<void>;
  clearAll: (projectId: string) => Promise<void>;
  /**
   * Cascade target for project deletion: cancels every task's notification and
   * drops the project's key from the dictionary. Called by `useProjectActions`
   * so the stores stay decoupled.
   */
  removeProjectTasks: (projectId: string) => Promise<void>;
  /** Event-bridge entry point: a fired notification clears its task's id. */
  clearNotificationId: (notificationId: string) => void;
  setHasHydrated: (value: boolean) => void;
}

export interface ProjectState {
  /** Active project session. */
  currentProject: Project | null;
  /** Local registry of projects — no backend. */
  projects: Project[];
  hasHydrated: boolean;
  selectProject: (id: string) => Promise<void>;
  createProject: (name: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  deselectProject: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}
