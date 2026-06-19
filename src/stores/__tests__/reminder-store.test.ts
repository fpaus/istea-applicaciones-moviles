import { createStore, StoreApi } from "zustand/vanilla";
import { createReminderState } from "../reminder-store";
import { NotificationScheduler, ReminderState } from "../types";
import { NewReminder } from "../../types";

function makeFakeNotifications() {
  return {
    scheduleNotification: jest.fn(async () => "notif-1"),
    cancelNotification: jest.fn(async () => {}),
    cancelAllNotifications: jest.fn(async () => {}),
  } satisfies NotificationScheduler;
}

function makeStore(notifications: NotificationScheduler): StoreApi<ReminderState> {
  return createStore(createReminderState({ notifications }));
}

const sampleInput: NewReminder = {
  title: "Drink water",
  description: "Stay hydrated",
  time: { hour: 9, minute: 0 },
  repeats: true,
};

describe("reminder store", () => {
  it("add schedules a notification and stores the returned id atomically", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addReminder(sampleInput);

    const { reminders } = store.getState();
    expect(notifications.scheduleNotification).toHaveBeenCalledWith(
      "Drink water",
      "Stay hydrated",
      { hour: 9, minute: 0 },
      true,
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0].title).toBe("Drink water");
    expect(reminders[0].notificationId).toBe("notif-1");
    expect(reminders[0].completed).toBe(false);
  });

  it("add prepends new reminders to the head of the list", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addReminder({ ...sampleInput, title: "first" });
    await store.getState().addReminder({ ...sampleInput, title: "second" });

    expect(store.getState().reminders.map((r) => r.title)).toEqual([
      "second",
      "first",
    ]);
  });

  it("delete cancels the scheduled notification by id and removes the reminder", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addReminder(sampleInput);
    const id = store.getState().reminders[0].id;

    await store.getState().deleteReminder(id);

    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-1");
    expect(store.getState().reminders).toHaveLength(0);
  });

  it("markCompleted sets completed true and nulls the notificationId", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addReminder(sampleInput);
    const id = store.getState().reminders[0].id;

    await store.getState().markCompleted(id);

    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-1");
    const reminder = store.getState().reminders[0];
    expect(reminder.completed).toBe(true);
    expect(reminder.notificationId).toBeNull();
  });

  it("clearAll cancels all notifications and empties the list", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addReminder(sampleInput);
    await store.getState().clearAll();

    expect(notifications.cancelAllNotifications).toHaveBeenCalledTimes(1);
    expect(store.getState().reminders).toHaveLength(0);
  });

  it("clearNotificationId nulls only the matching reminder's id", async () => {
    const notifications = makeFakeNotifications();
    notifications.scheduleNotification
      .mockResolvedValueOnce("notif-A")
      .mockResolvedValueOnce("notif-B");
    const store = makeStore(notifications);

    await store.getState().addReminder({ ...sampleInput, title: "A" });
    await store.getState().addReminder({ ...sampleInput, title: "B" });

    store.getState().clearNotificationId("notif-A");

    const byTitle = Object.fromEntries(
      store.getState().reminders.map((r) => [r.title, r.notificationId]),
    );
    expect(byTitle.A).toBeNull();
    expect(byTitle.B).toBe("notif-B");
  });
});
