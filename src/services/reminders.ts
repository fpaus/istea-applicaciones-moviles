import { Reminder, Time } from "../types";
import { NotificationService, notificationService } from "./notifications";
import { StorageService, storageService } from "./storage";

const STORAGE_KEY = "@notifications_reminders";

export interface NewReminder {
  title: string;
  description: string;
  time: Time;
  repeats: boolean;
}

export class RemindersService {
  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService,
  ) {}

  async getReminders(): Promise<Reminder[]> {
    const saved = (await this.storageService.getItem<Reminder[]>(STORAGE_KEY)) || [];
    return saved;
  }

  getActiveReminders(reminders: Reminder[]): Reminder[] {
    return reminders
      .filter((r) => !r.completed)
      .sort((a, b) => {
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const timeA = a.time.hour * 60 + a.time.minute;
        const timeB = b.time.hour * 60 + b.time.minute;

        const adjustedA = timeA < currentTotalMinutes ? timeA + 1440 : timeA;
        const adjustedB = timeB < currentTotalMinutes ? timeB + 1440 : timeB;

        return adjustedA - adjustedB;
      });
  }

  getCompletedReminders(reminders: Reminder[]): Reminder[] {
    return reminders.filter((r) => r.completed);
  }

  async addReminder(
    data: NewReminder,
    currentReminders: Reminder[],
  ): Promise<Reminder[]> {
    const notifId = await this.notificationService.scheduleNotification(
      data.title,
      data.description,
      data.time,
      data.repeats,
    );

    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      time: data.time,
      repeats: data.repeats,
      notificationId: notifId,
      completed: false,
      createdAt: Date.now(),
    };

    const updated = [newReminder, ...currentReminders];
    await this.storageService.setItem(STORAGE_KEY, updated);
    return updated;
  }

  async deleteReminder(
    id: string,
    currentReminders: Reminder[],
  ): Promise<Reminder[]> {
    const item = currentReminders.find((r) => r.id === id);
    if (item?.notificationId) {
      await this.notificationService.cancelNotification(item.notificationId);
    }
    const updated = currentReminders.filter((r) => r.id !== id);
    await this.storageService.setItem(STORAGE_KEY, updated);
    return updated;
  }

  async markCompleted(
    id: string,
    currentReminders: Reminder[],
  ): Promise<Reminder[]> {
    const updated = currentReminders.map((r) => {
      if (r.id === id) {
        if (r.notificationId) {
          this.notificationService.cancelNotification(r.notificationId);
        }
        return { ...r, completed: true, notificationId: null };
      }
      return r;
    });
    await this.storageService.setItem(STORAGE_KEY, updated);
    return updated;
  }

  async clearAll(): Promise<void> {
    await this.notificationService.cancelAllNotifications();
    await this.storageService.removeItem(STORAGE_KEY);
  }
}

export const remindersService = new RemindersService(
  storageService,
  notificationService,
);
