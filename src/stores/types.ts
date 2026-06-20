import { NewTask, Task, Time, Project } from "../types";

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

export interface TaskDeps {
  notifications: NotificationScheduler;
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
  markCompleted: (projectId: string, id: string) => Promise<void>;
  clearAll: (projectId: string) => Promise<void>;
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
  deselectProject: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}
