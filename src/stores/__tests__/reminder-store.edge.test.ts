import { createStore, StoreApi } from "zustand/vanilla";
import { createReminderState } from "../reminder-store";
import { NotificationScheduler, ReminderState } from "../types";
import { NewReminder } from "../../types";

function makeFakeNotifications(): NotificationScheduler {
  return {
    scheduleNotification: jest.fn(async () => "notif-1"),
    cancelNotification: jest.fn(async () => {}),
    cancelAllNotifications: jest.fn(async () => {}),
  };
}

function makeStore(notifications: NotificationScheduler): StoreApi<ReminderState> {
  return createStore(createReminderState({ notifications }));
}

const input: NewReminder = {
  title: "Drink water",
  description: "",
  time: { hour: 9, minute: 0 },
  repeats: false,
};

describe("reminder store — resilience", () => {
  it("adds the reminder with null id when permission is denied", async () => {
    const notifications = makeFakeNotifications();
    (notifications.scheduleNotification as jest.Mock).mockResolvedValueOnce(null);
    const store = makeStore(notifications);

    await store.getState().addReminder(input);

    expect(store.getState().reminders).toHaveLength(1);
    expect(store.getState().reminders[0].notificationId).toBeNull();
  });

  it("still adds the reminder (null id) and does not reject when the scheduler throws", async () => {
    const notifications = makeFakeNotifications();
    (notifications.scheduleNotification as jest.Mock).mockRejectedValueOnce(
      new Error("boom"),
    );
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const store = makeStore(notifications);

    await expect(store.getState().addReminder(input)).resolves.toBeUndefined();

    expect(store.getState().reminders).toHaveLength(1);
    expect(store.getState().reminders[0].notificationId).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("delete on an unknown id is a no-op and cancels nothing", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().addReminder(input);

    await store.getState().deleteReminder("does-not-exist");

    expect(store.getState().reminders).toHaveLength(1);
    expect(notifications.cancelNotification).not.toHaveBeenCalled();
  });

  it("markCompleted on an unknown id is a no-op", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().addReminder(input);

    await store.getState().markCompleted("does-not-exist");

    expect(store.getState().reminders[0].completed).toBe(false);
    expect(notifications.cancelNotification).not.toHaveBeenCalled();
  });

  it("deleting a completed (null-id) reminder removes it without cancelling", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().addReminder(input);
    const id = store.getState().reminders[0].id;
    await store.getState().markCompleted(id); // notificationId -> null
    (notifications.cancelNotification as jest.Mock).mockClear();

    await store.getState().deleteReminder(id);

    expect(store.getState().reminders).toHaveLength(0);
    expect(notifications.cancelNotification).not.toHaveBeenCalled();
  });
});
