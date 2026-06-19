import AsyncStorage from "@react-native-async-storage/async-storage";
import { createReminderStore } from "../reminder-store";
import { NotificationScheduler } from "../types";
import { NewReminder, Reminder } from "../../types";

function fakeNotifications(): NotificationScheduler {
  return {
    scheduleNotification: jest.fn(async () => "notif-1"),
    cancelNotification: jest.fn(async () => {}),
    cancelAllNotifications: jest.fn(async () => {}),
  };
}

const input: NewReminder = {
  title: "Persisted",
  description: "",
  time: { hour: 7, minute: 30 },
  repeats: false,
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("reminder store — persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("writes the store key to AsyncStorage when an action mutates state", async () => {
    const setItem = jest.spyOn(AsyncStorage, "setItem");
    const store = createReminderStore({ notifications: fakeNotifications() });

    await store.getState().addReminder(input);
    await flush();

    expect(setItem).toHaveBeenCalledWith(
      "reminder-store",
      expect.stringContaining("Persisted"),
    );
  });

  it("persists only the reminders slice, not transient flags", async () => {
    const store = createReminderStore({ notifications: fakeNotifications() });
    await store.getState().addReminder(input);
    await flush();

    const raw = await AsyncStorage.getItem("reminder-store");
    const parsed = JSON.parse(raw as string);

    expect(parsed.state).toHaveProperty("reminders");
    expect(parsed.state).not.toHaveProperty("hasHydrated");
  });

  it("rehydrates reminders from AsyncStorage and flips hasHydrated true", async () => {
    const stored: Reminder = {
      id: "seeded",
      title: "From storage",
      description: "",
      time: { hour: 6, minute: 0 },
      repeats: false,
      notificationId: null,
      completed: false,
      createdAt: 0,
    };
    await AsyncStorage.setItem(
      "reminder-store",
      JSON.stringify({ state: { reminders: [stored] }, version: 0 }),
    );

    const store = createReminderStore({ notifications: fakeNotifications() });
    await store.persist.rehydrate();

    expect(store.getState().reminders.map((r) => r.id)).toEqual(["seeded"]);
    expect(store.getState().hasHydrated).toBe(true);
  });
});
