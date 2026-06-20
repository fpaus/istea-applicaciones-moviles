import { createStore, StoreApi } from "zustand/vanilla";
import { createTaskState } from "../task-store";
import { NotificationScheduler, TaskState } from "../types";
import { NewTask } from "../../types";

function makeFakeNotifications(): NotificationScheduler {
  return {
    scheduleNotification: jest.fn(async () => "notif-1"),
    cancelNotification: jest.fn(async () => {}),
    cancelAllNotifications: jest.fn(async () => {}),
  };
}

function makeStore(notifications: NotificationScheduler): StoreApi<TaskState> {
  return createStore(createTaskState({ notifications }));
}

const input: NewTask = {
  title: "Drink water",
  description: "",
  notification: {
    time: { hour: 9, minute: 0 },
    repeats: false,
    notificationId: null,
  },
};

describe("task store — resilience", () => {
  it("adds the task with null id when permission is denied", async () => {
    const notifications = makeFakeNotifications();
    (notifications.scheduleNotification as jest.Mock).mockResolvedValueOnce(null);
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", input);

    expect(store.getState().tasks["project-1"]).toHaveLength(1);
    expect(store.getState().tasks["project-1"][0].notification?.notificationId).toBeNull();
  });

  it("still adds the task (null id) and does not reject when the scheduler throws", async () => {
    const notifications = makeFakeNotifications();
    (notifications.scheduleNotification as jest.Mock).mockRejectedValueOnce(
      new Error("boom"),
    );
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const store = makeStore(notifications);

    await expect(store.getState().addTask("project-1", "Work", input)).resolves.toBeUndefined();

    expect(store.getState().tasks["project-1"]).toHaveLength(1);
    expect(store.getState().tasks["project-1"][0].notification?.notificationId).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("delete on an unknown id is a no-op and cancels nothing", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().addTask("project-1", "Work", input);

    await store.getState().deleteTask("project-1", "does-not-exist");

    expect(store.getState().tasks["project-1"]).toHaveLength(1);
    expect(notifications.cancelNotification).not.toHaveBeenCalled();
  });

  it("markCompleted on an unknown id is a no-op", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().addTask("project-1", "Work", input);

    await store.getState().markCompleted("project-1", "does-not-exist");

    expect(store.getState().tasks["project-1"][0].completed).toBe(false);
    expect(notifications.cancelNotification).not.toHaveBeenCalled();
  });

  it("deleting a completed (null-id) task removes it without cancelling", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().addTask("project-1", "Work", input);
    const id = store.getState().tasks["project-1"][0].id;
    await store.getState().markCompleted("project-1", id); // notificationId -> null
    (notifications.cancelNotification as jest.Mock).mockClear();

    await store.getState().deleteTask("project-1", id);

    expect(store.getState().tasks["project-1"]).toHaveLength(0);
    expect(notifications.cancelNotification).not.toHaveBeenCalled();
  });

  it("clearAll on an empty/unknown project is a no-op", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().clearAll("unknown-project-id");

    expect(store.getState().tasks["unknown-project-id"]).toEqual([]);
    expect(notifications.cancelNotification).not.toHaveBeenCalled();
  });

  it("clearNotificationId with a non-existent ID does not change state", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().addTask("project-1", "Work", input);
    const originalState = store.getState().tasks;

    store.getState().clearNotificationId("non-existent-id");

    expect(store.getState().tasks).toEqual(originalState);
  });

  it("deleteTask on a non-existent project fallback to empty array safely", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().deleteTask("non-existent-project", "some-id");
    expect(store.getState().tasks["non-existent-project"]).toEqual([]);
  });

  it("markCompleted on a non-existent project fallback to empty array safely", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().markCompleted("non-existent-project", "some-id");
    expect(store.getState().tasks["non-existent-project"]).toEqual([]);
  });

  it("clearAll skips cancelling when a task has null notificationId", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);
    await store.getState().addTask("project-1", "Work", input);
    const id = store.getState().tasks["project-1"][0].id;
    await store.getState().markCompleted("project-1", id); // Sets notificationId to null

    (notifications.cancelNotification as jest.Mock).mockClear();
    await store.getState().clearAll("project-1");

    expect(store.getState().tasks["project-1"]).toHaveLength(0);
    expect(notifications.cancelNotification).not.toHaveBeenCalled();
  });
});
