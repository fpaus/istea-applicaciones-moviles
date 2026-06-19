import AsyncStorage from "@react-native-async-storage/async-storage";
import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { notificationService } from "../services/notifications";
import { Reminder } from "../types";
import { ReminderDeps, ReminderState } from "./types";

const STORAGE_KEY = "reminder-store";

/**
 * Pure selectors (moved verbatim from the former RemindersService) so behavior
 * is unchanged: active = not completed, sorted by next upcoming time-of-day.
 */
export function selectActive(reminders: Reminder[]): Reminder[] {
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

export function selectCompleted(reminders: Reminder[]): Reminder[] {
  return reminders.filter((r) => r.completed);
}

/**
 * The testable seam: a state initializer parameterized by its side-effect
 * dependency. Tests build a non-persisted store from this; the app wraps it in
 * `persist` below.
 */
export const createReminderState =
  (deps: ReminderDeps): StateCreator<ReminderState> =>
  (set, get) => ({
    reminders: [],
    hasHydrated: false,

    addReminder: async (data) => {
      // Resilient: a denied permission (null) or a scheduler error must never
      // lose the user's reminder — persist it with a null notificationId.
      let notificationId: string | null = null;
      try {
        notificationId = await deps.notifications.scheduleNotification(
          data.title,
          data.description,
          data.time,
          data.repeats,
        );
      } catch (error) {
        console.error(
          "[reminder-store] Failed to schedule notification:",
          error,
        );
      }

      const newReminder: Reminder = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        time: data.time,
        repeats: data.repeats,
        notificationId,
        completed: false,
        createdAt: Date.now(),
      };

      set({ reminders: [newReminder, ...get().reminders] });
    },

    deleteReminder: async (id) => {
      const item = get().reminders.find((r) => r.id === id);
      if (item?.notificationId) {
        await deps.notifications.cancelNotification(item.notificationId);
      }
      set({ reminders: get().reminders.filter((r) => r.id !== id) });
    },

    markCompleted: async (id) => {
      const item = get().reminders.find((r) => r.id === id);
      if (item?.notificationId) {
        await deps.notifications.cancelNotification(item.notificationId);
      }
      set({
        reminders: get().reminders.map((r) =>
          r.id === id ? { ...r, completed: true, notificationId: null } : r,
        ),
      });
    },

    clearAll: async () => {
      await deps.notifications.cancelAllNotifications();
      set({ reminders: [] });
    },

    clearNotificationId: (notificationId) => {
      set({
        reminders: get().reminders.map((r) =>
          r.notificationId === notificationId
            ? { ...r, notificationId: null }
            : r,
        ),
      });
    },

    setHasHydrated: (value) => set({ hasHydrated: value }),
  });

export const createReminderStore = (
  deps: ReminderDeps = { notifications: notificationService },
) =>
  create<ReminderState>()(
    devtools(
      persist(createReminderState(deps), {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ reminders: state.reminders }),
        onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      }),
      { name: "ReminderStore" },
    ),
  );

export const useReminderStore = createReminderStore();
