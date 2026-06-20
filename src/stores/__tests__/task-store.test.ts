import { createStore, StoreApi } from "zustand/vanilla";
import { createTaskState } from "../task-store";
import { NotificationScheduler, TaskState } from "../types";
import { NewTask } from "../../types";

function makeFakeNotifications() {
  return {
    scheduleNotification: jest.fn(async () => "notif-1"),
    cancelNotification: jest.fn(async () => {}),
    cancelAllNotifications: jest.fn(async () => {}),
  } satisfies NotificationScheduler;
}

function makeStore(notifications: NotificationScheduler): StoreApi<TaskState> {
  return createStore(createTaskState({ notifications }));
}

const sampleInput: NewTask = {
  title: "Drink water",
  description: "Stay hydrated",
  time: { hour: 9, minute: 0 },
  repeats: true,
};

describe("task store", () => {
  it("addTask schedules a notification with project prefix and stores under projectId", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", sampleInput);

    const { tasks } = store.getState();
    expect(notifications.scheduleNotification).toHaveBeenCalledWith(
      "[Work] Drink water",
      "Stay hydrated",
      { hour: 9, minute: 0 },
      true,
    );
    expect(tasks["project-1"]).toHaveLength(1);
    expect(tasks["project-1"][0].title).toBe("Drink water");
    expect(tasks["project-1"][0].notificationId).toBe("notif-1");
    expect(tasks["project-1"][0].completed).toBe(false);
  });

  it("addTask prepends new tasks to the head of the project's list", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", { ...sampleInput, title: "first" });
    await store.getState().addTask("project-1", "Work", { ...sampleInput, title: "second" });

    expect(store.getState().tasks["project-1"].map((t) => t.title)).toEqual([
      "second",
      "first",
    ]);
  });

  it("deleteTask cancels the scheduled notification by id and removes the task", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", sampleInput);
    const id = store.getState().tasks["project-1"][0].id;

    await store.getState().deleteTask("project-1", id);

    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-1");
    expect(store.getState().tasks["project-1"]).toHaveLength(0);
  });

  it("markCompleted sets completed true and nulls the notificationId", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", sampleInput);
    const id = store.getState().tasks["project-1"][0].id;

    await store.getState().markCompleted("project-1", id);

    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-1");
    const task = store.getState().tasks["project-1"][0];
    expect(task.completed).toBe(true);
    expect(task.notificationId).toBeNull();
  });

  it("clearAll cancels all notifications and empties the project's list", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", sampleInput);
    await store.getState().clearAll("project-1");

    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-1");
    expect(store.getState().tasks["project-1"]).toHaveLength(0);
  });

  it("clearNotificationId scans all projects and nulls only the matching task's id", async () => {
    const notifications = makeFakeNotifications();
    notifications.scheduleNotification
      .mockResolvedValueOnce("notif-A")
      .mockResolvedValueOnce("notif-B");
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", { ...sampleInput, title: "A" });
    await store.getState().addTask("project-2", "Personal", { ...sampleInput, title: "B" });

    store.getState().clearNotificationId("notif-A");

    expect(store.getState().tasks["project-1"][0].notificationId).toBeNull();
    expect(store.getState().tasks["project-2"][0].notificationId).toBe("notif-B");
  });

  it("clearNotificationId updates immutably (new array ref, original objects untouched)", async () => {
    const notifications = makeFakeNotifications();
    notifications.scheduleNotification.mockResolvedValueOnce("notif-A");
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", { ...sampleInput, title: "A" });
    const beforeList = store.getState().tasks["project-1"];
    const beforeTask = beforeList[0];

    store.getState().clearNotificationId("notif-A");

    const afterList = store.getState().tasks["project-1"];
    expect(afterList).not.toBe(beforeList); // new array reference
    expect(afterList[0].notificationId).toBeNull();
    expect(beforeTask.notificationId).toBe("notif-A"); // original object not mutated
  });

  it("removeProjectTasks cancels each task's notification and drops the project's key", async () => {
    const notifications = makeFakeNotifications();
    notifications.scheduleNotification
      .mockResolvedValueOnce("notif-A")
      .mockResolvedValueOnce("notif-B");
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", { ...sampleInput, title: "A" });
    await store.getState().addTask("project-1", "Work", { ...sampleInput, title: "B" });
    await store.getState().addTask("project-2", "Personal", sampleInput);

    await store.getState().removeProjectTasks("project-1");

    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-A");
    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-B");
    expect(store.getState().tasks).not.toHaveProperty("project-1");
    expect(store.getState().tasks["project-2"]).toHaveLength(1);
  });

  it("removeProjectTasks updates immutably and skips tasks without a notificationId", async () => {
    const notifications = makeFakeNotifications();
    notifications.scheduleNotification.mockResolvedValueOnce(null as any);
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", sampleInput);
    const before = store.getState().tasks;

    await store.getState().removeProjectTasks("project-1");

    expect(notifications.cancelNotification).not.toHaveBeenCalled();
    expect(store.getState().tasks).not.toBe(before); // new reference
    expect(store.getState().tasks).not.toHaveProperty("project-1");
  });

  it("removeProjectTasks still drops the project's tasks when cancelling a notification fails", async () => {
    const notifications = makeFakeNotifications();
    notifications.cancelNotification.mockRejectedValueOnce(new Error("boom"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", sampleInput);
    await store.getState().removeProjectTasks("project-1");

    expect(store.getState().tasks).not.toHaveProperty("project-1");
  });

  it("deleteTask still removes the task when cancelling its notification fails", async () => {
    const notifications = makeFakeNotifications();
    notifications.cancelNotification.mockRejectedValueOnce(new Error("boom"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", sampleInput);
    const id = store.getState().tasks["project-1"][0].id;

    await store.getState().deleteTask("project-1", id);

    expect(store.getState().tasks["project-1"]).toHaveLength(0);
  });

  it("clearAll still empties the project when a cancellation fails", async () => {
    const notifications = makeFakeNotifications();
    notifications.cancelNotification.mockRejectedValueOnce(new Error("boom"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "Work", sampleInput);
    await store.getState().clearAll("project-1");

    expect(store.getState().tasks["project-1"]).toHaveLength(0);
  });

  it("removeProjectTasks is a no-op for a project with no tasks", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().removeProjectTasks("ghost");

    expect(notifications.cancelNotification).not.toHaveBeenCalled();
    expect(store.getState().tasks).not.toHaveProperty("ghost");
  });

  it("addTask schedules without project prefix when projectName is empty", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    await store.getState().addTask("project-1", "", sampleInput);

    expect(notifications.scheduleNotification).toHaveBeenCalledWith(
      "Drink water",
      "Stay hydrated",
      { hour: 9, minute: 0 },
      true,
    );
  });
});
