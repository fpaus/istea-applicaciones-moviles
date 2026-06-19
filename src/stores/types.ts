import { NewReminder, Reminder, Time, User } from "../types";

/**
 * Injectable side-effect dependency for the reminder store. The store calls
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

export interface ReminderDeps {
  notifications: NotificationScheduler;
}

export interface ReminderState {
  reminders: Reminder[];
  hasHydrated: boolean;
  addReminder: (data: NewReminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markCompleted: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  /** Event-bridge entry point: a fired notification clears its reminder's id. */
  clearNotificationId: (notificationId: string) => void;
  setHasHydrated: (value: boolean) => void;
}

export interface AuthState {
  /** Current session user (password stripped). */
  user: User | null;
  /** Local registry of registered users (email + password) — no backend. */
  users: User[];
  hasHydrated: boolean;
  login: (credentials: User) => Promise<void>;
  register: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}
