import { createStore, StoreApi } from "zustand/vanilla";
import { createTaskState } from "../task-store";
import { NotificationScheduler, TaskState } from "../types";
import { NewTask } from "../../types";

function makeFakeNotifications() {
  return {
    scheduleNotification: jest.fn(async (): Promise<string | null> => "notif-1"),
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
  notification: {
    time: { hour: 9, minute: 0 },
    repeats: true,
    notificationId: null,
  },
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
    expect(tasks["project-1"][0].notification?.notificationId).toBe("notif-1");
    expect(tasks["project-1"][0].completed).toBe(false);
  });

  it("addTask stores parentId if provided, or null if absent", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    // Add root task (no parentId)
    await store.getState().addTask("project-1", "Work", sampleInput);
    const rootTask = store.getState().tasks["project-1"][0];
    expect(rootTask.parentId).toBeNull();

    // Add subtask (with parentId)
    const subtaskInput: NewTask = {
      title: "Subtask title",
      description: "Subtask desc",
      notification: null,
      parentId: rootTask.id,
    };
    await store.getState().addTask("project-1", "Work", subtaskInput);
    const subtask = store.getState().tasks["project-1"][0];
    expect(subtask.parentId).toBe(rootTask.id);
  });

  it("addTask with no reminder stores notification: null and does NOT call the scheduler", async () => {
    const notifications = makeFakeNotifications();
    const store = makeStore(notifications);

    const inputNoReminder: NewTask = {
      title: "No reminder task",
      description: "Just a checklist item",
      notification: null,
    };

    await store.getState().addTask("project-1", "Work", inputNoReminder);

    const { tasks } = store.getState();
    expect(notifications.scheduleNotification).not.toHaveBeenCalled();
    expect(tasks["project-1"]).toHaveLength(1);
    expect(tasks["project-1"][0].title).toBe("No reminder task");
    expect(tasks["project-1"][0].notification).toBeNull();
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

  it("deleteTask removes the target task and all of its descendants, cancelling their notifications", async () => {
    const notifications = makeFakeNotifications();
    notifications.scheduleNotification
      .mockResolvedValueOnce("notif-parent")
      .mockResolvedValueOnce("notif-child");
    const store = makeStore(notifications);

    // Add root task with reminder
    await store.getState().addTask("project-1", "Work", sampleInput);
    const rootTask = store.getState().tasks["project-1"][0];

    // Add child task with reminder
    const childInput: NewTask = {
      title: "Child task",
      description: "Sub task",
      notification: {
        time: { hour: 10, minute: 0 },
        repeats: false,
        notificationId: null,
      },
      parentId: rootTask.id,
    };
    await store.getState().addTask("project-1", "Work", childInput);

    // Now trigger deleteTask on parent
    await store.getState().deleteTask("project-1", rootTask.id);

    // Verify both notifications cancelled
    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-parent");
    expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-child");

    // Verify both tasks deleted from store
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
    expect(task.notification?.notificationId).toBeNull();
  });

  describe("completion cascade and reminder rescheduling on re-open", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-20T12:00:00")); // Noon (12:00)
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("markCompleted cascades down and cancels notifications", async () => {
      const notifications = makeFakeNotifications();
      notifications.scheduleNotification
        .mockResolvedValueOnce("notif-p")
        .mockResolvedValueOnce("notif-c");
      const store = makeStore(notifications);

      // Root task
      await store.getState().addTask("project-1", "Work", sampleInput);
      const rootTask = store.getState().tasks["project-1"][0];

      // Subtask
      const childInput: NewTask = {
        title: "Subtask",
        description: "",
        notification: {
          time: { hour: 13, minute: 0 },
          repeats: true,
          notificationId: null,
        },
        parentId: rootTask.id,
      };
      await store.getState().addTask("project-1", "Work", childInput);

      // Complete root task
      await store.getState().markCompleted("project-1", rootTask.id);

      expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-p");
      expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-c");

      const tasks = store.getState().tasks["project-1"];
      const updatedRoot = tasks.find((t) => t.id === rootTask.id);
      const updatedChildTask = tasks.find((t) => t.title === "Subtask");

      expect(updatedRoot?.completed).toBe(true);
      expect(updatedRoot?.notification?.notificationId).toBeNull();
      expect(updatedChildTask?.completed).toBe(true);
      expect(updatedChildTask?.notification?.notificationId).toBeNull();
    });

    it("reopenTask cascades up and reschedules repeating or future one-shot reminders, but skips past one-shot", async () => {
      const notifications = makeFakeNotifications();
      notifications.scheduleNotification
        .mockResolvedValueOnce("notif-p-new")
        .mockResolvedValueOnce("notif-c-new");
      const store = makeStore(notifications);

      // Add parent with future one-shot reminder (at 13:00, which is > 12:00)
      const parentInput: NewTask = {
        title: "Parent task",
        description: "",
        notification: {
          time: { hour: 13, minute: 0 },
          repeats: false,
          notificationId: null,
        },
      };
      await store.getState().addTask("project-1", "Work", parentInput);
      const parent = store.getState().tasks["project-1"][0];

      // Add child with past one-shot reminder (at 11:00, which is < 12:00)
      const child1Input: NewTask = {
        title: "Child past one-shot",
        description: "",
        notification: {
          time: { hour: 11, minute: 0 },
          repeats: false,
          notificationId: null,
        },
        parentId: parent.id,
      };
      await store.getState().addTask("project-1", "Work", child1Input);
      const child1 = store.getState().tasks["project-1"][0];

      // Add grandchild with repeating reminder (at 9:00, but repeats = true, so always reschedules)
      const grandchildInput: NewTask = {
        title: "Grandchild repeating",
        description: "",
        notification: {
          time: { hour: 9, minute: 0 },
          repeats: true,
          notificationId: null,
        },
        parentId: child1.id,
      };
      await store.getState().addTask("project-1", "Work", grandchildInput);
      const grandchild = store.getState().tasks["project-1"][0];

      // Add unrelated task that shouldn't be affected by reopen cascades (covers line 130 fallback)
      const unrelatedInput: NewTask = {
        title: "Unrelated task",
        description: "",
        notification: null,
      };
      await store.getState().addTask("project-1", "Work", unrelatedInput);

      // Complete parent task (cascades down, cancels all, sets notificationIds to null)
      await store.getState().markCompleted("project-1", parent.id);

      // Clear scheduler calls
      (notifications.scheduleNotification as jest.Mock).mockClear();

      // Now reopen grandchild (cascades up, reopens child1 and parent)
      await store.getState().reopenTask("project-1", grandchild.id, "Work");

      const tasks = store.getState().tasks["project-1"];
      const updatedParent = tasks.find((t) => t.id === parent.id);
      const updatedChild1 = tasks.find((t) => t.id === child1.id);
      const updatedGrandchild = tasks.find((t) => t.id === grandchild.id);
      const updatedUnrelated = tasks.find((t) => t.title === "Unrelated task");

      expect(updatedParent?.completed).toBe(false);
      expect(updatedChild1?.completed).toBe(false);
      expect(updatedGrandchild?.completed).toBe(false);
      expect(updatedUnrelated?.completed).toBe(false); // remained incomplete/untouched

      // Verifications of rescheduling:
      // Parent: future one-shot (13:00 > 12:00) -> rescheduled!
      // Child1: past one-shot (11:00 < 12:00) -> skipped!
      // Grandchild: repeating (repeats: true) -> rescheduled!
      
      // Let's assert schedule calls:
      expect(notifications.scheduleNotification).toHaveBeenCalledWith(
        "[Work] Parent task",
        "",
        { hour: 13, minute: 0 },
        false
      );
      expect(notifications.scheduleNotification).toHaveBeenCalledWith(
        "Grandchild repeating",
        "",
        { hour: 9, minute: 0 },
        true
      );
      expect(notifications.scheduleNotification).not.toHaveBeenCalledWith(
        "Child past one-shot",
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it("handles notification scheduling failures during reopenTask gracefully", async () => {
      const notifications = makeFakeNotifications();
      notifications.scheduleNotification.mockRejectedValue(new Error("Schedule error"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const store = makeStore(notifications);

      const parentInput: NewTask = {
        title: "Parent task",
        description: "",
        notification: {
          time: { hour: 13, minute: 0 },
          repeats: true,
          notificationId: null,
        },
      };
      await store.getState().addTask("project-1", "Work", parentInput);
      const parent = store.getState().tasks["project-1"][0];

      // Complete parent task
      await store.getState().markCompleted("project-1", parent.id);

      // Reopen parent task - scheduling will fail
      await store.getState().reopenTask("project-1", parent.id, "Work");

      const tasks = store.getState().tasks["project-1"];
      const updatedParent = tasks.find((t) => t.id === parent.id);
      expect(updatedParent?.completed).toBe(false);
      expect(updatedParent?.notification?.notificationId).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        "[task-store] Failed to reschedule notification on reopen:",
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });

    it("automatically reopens completed parent and ancestors when adding an incomplete subtask", async () => {
      const notifications = makeFakeNotifications();
      notifications.scheduleNotification.mockResolvedValue("notif-parent-reopened");
      const store = makeStore(notifications);

      // Add parent with repeating reminder and complete it
      const parentInput: NewTask = {
        title: "Parent task",
        description: "",
        notification: {
          time: { hour: 10, minute: 0 },
          repeats: true,
          notificationId: null,
        },
      };
      await store.getState().addTask("project-1", "Work", parentInput);
      const parentId = store.getState().tasks["project-1"][0].id;
      await store.getState().markCompleted("project-1", parentId);

      // Clear scheduler calls
      (notifications.scheduleNotification as jest.Mock).mockClear();

      // Now add a subtask to the completed parent
      const subtaskInput: NewTask = {
        title: "Subtask title",
        description: "",
        notification: null,
        parentId: parentId,
      };
      await store.getState().addTask("project-1", "Work", subtaskInput);

      const tasks = store.getState().tasks["project-1"];
      const updatedParent = tasks.find((t) => t.id === parentId);
      const subtask = tasks.find((t) => t.title === "Subtask title");

      // Verify parent was reopened
      expect(updatedParent?.completed).toBe(false);
      expect(updatedParent?.notification?.notificationId).toBe("notif-parent-reopened");
      expect(subtask?.completed).toBe(false);

      expect(notifications.scheduleNotification).toHaveBeenCalledWith(
        "[Work] Parent task",
        "",
        { hour: 10, minute: 0 },
        true
      );
    });
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

    expect(store.getState().tasks["project-1"][0].notification?.notificationId).toBeNull();
    expect(store.getState().tasks["project-2"][0].notification?.notificationId).toBe("notif-B");
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
    expect(afterList[0].notification?.notificationId).toBeNull();
    expect(beforeTask.notification?.notificationId).toBe("notif-A"); // original object not mutated
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
    notifications.scheduleNotification.mockResolvedValueOnce(null as string | null);
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

  describe("updateTask", () => {
    it("edits title and description without changing notification if not in patch", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", sampleInput);
      const id = store.getState().tasks["project-1"][0].id;

      await store.getState().updateTask("project-1", id, {
        title: "New Title",
        description: "New Description",
      });

      const task = store.getState().tasks["project-1"][0];
      expect(task.title).toBe("New Title");
      expect(task.description).toBe("New Description");
      expect(task.notification?.notificationId).toBe("notif-1");
    });

    it("schedules a notification when adding a reminder to a task that had none (none -> set)", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      const noReminderTask: NewTask = {
        title: "No reminder",
        description: "",
        notification: null,
      };

      await store.getState().addTask("project-1", "Work", noReminderTask);
      const id = store.getState().tasks["project-1"][0].id;

      notifications.scheduleNotification.mockResolvedValueOnce("notif-new");

      await store.getState().updateTask("project-1", id, {
        notification: {
          time: { hour: 12, minute: 0 },
          repeats: false,
          notificationId: null,
        },
      }, "Work");

      expect(notifications.scheduleNotification).toHaveBeenCalledWith(
        "[Work] No reminder",
        "",
        { hour: 12, minute: 0 },
        false,
      );
      const task = store.getState().tasks["project-1"][0];
      expect(task.notification?.notificationId).toBe("notif-new");
    });

    it("cancels old and schedules new notification when changing reminder details (set -> changed)", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", sampleInput);
      const id = store.getState().tasks["project-1"][0].id;

      notifications.scheduleNotification.mockResolvedValueOnce("notif-new");

      await store.getState().updateTask("project-1", id, {
        notification: {
          time: { hour: 10, minute: 0 },
          repeats: false,
          notificationId: null,
        },
      }, "Work");

      expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-1");
      expect(notifications.scheduleNotification).toHaveBeenCalledWith(
        "[Work] Drink water",
        "Stay hydrated",
        { hour: 10, minute: 0 },
        false,
      );
      const task = store.getState().tasks["project-1"][0];
      expect(task.notification?.notificationId).toBe("notif-new");
    });

    it("cancels notification and sets notification to null when removing a reminder (set -> none)", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", sampleInput);
      const id = store.getState().tasks["project-1"][0].id;

      await store.getState().updateTask("project-1", id, {
        notification: null,
      });

      expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-1");
      const task = store.getState().tasks["project-1"][0];
      expect(task.notification).toBeNull();
    });

    it("applies the edit even if notification cancellation fails (resilient)", async () => {
      const notifications = makeFakeNotifications();
      notifications.cancelNotification.mockRejectedValueOnce(new Error("cancel fail"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", sampleInput);
      const id = store.getState().tasks["project-1"][0].id;

      await expect(
        store.getState().updateTask("project-1", id, {
          title: "Edited title",
          notification: null,
        }),
      ).resolves.toBeUndefined();

      expect(notifications.cancelNotification).toHaveBeenCalledWith("notif-1");
      const task = store.getState().tasks["project-1"][0];
      expect(task.title).toBe("Edited title");
      expect(task.notification).toBeNull();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("applies the edit even if scheduling a new notification fails (none -> set)", async () => {
      const notifications = makeFakeNotifications();
      notifications.scheduleNotification.mockRejectedValueOnce(new Error("schedule fail"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const store = makeStore(notifications);

      const noReminderTask: NewTask = {
        title: "No reminder",
        description: "",
        notification: null,
      };
      await store.getState().addTask("project-1", "Work", noReminderTask);
      const id = store.getState().tasks["project-1"][0].id;

      await expect(
        store.getState().updateTask("project-1", id, {
          title: "Added reminder",
          notification: {
            time: { hour: 12, minute: 0 },
            repeats: false,
            notificationId: null,
          },
        }),
      ).resolves.toBeUndefined();

      const task = store.getState().tasks["project-1"][0];
      expect(task.title).toBe("Added reminder");
      expect(task.notification?.time).toEqual({ hour: 12, minute: 0 });
      expect(task.notification?.notificationId).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("applies the edit even if scheduling a changed notification fails (set -> changed)", async () => {
      const notifications = makeFakeNotifications();
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", sampleInput);
      const id = store.getState().tasks["project-1"][0].id;

      notifications.scheduleNotification.mockRejectedValueOnce(new Error("schedule fail"));

      await expect(
        store.getState().updateTask("project-1", id, {
          notification: {
            time: { hour: 10, minute: 0 },
            repeats: false,
            notificationId: null,
          },
        }),
      ).resolves.toBeUndefined();

      const task = store.getState().tasks["project-1"][0];
      expect(task.notification?.time).toEqual({ hour: 10, minute: 0 });
      expect(task.notification?.notificationId).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("applies the edit even if rescheduling a notification on title change fails", async () => {
      const notifications = makeFakeNotifications();
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", sampleInput);
      const id = store.getState().tasks["project-1"][0].id;

      notifications.scheduleNotification.mockRejectedValueOnce(new Error("schedule fail"));

      await expect(
        store.getState().updateTask("project-1", id, {
          title: "New Title",
        }),
      ).resolves.toBeUndefined();

      const task = store.getState().tasks["project-1"][0];
      expect(task.title).toBe("New Title");
      expect(task.notification?.notificationId).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("image attachment (imageUri)", () => {
    it("addTask persists the imageUri from the input", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "With photo",
        description: "",
        notification: null,
        imageUri: "file:///photo.jpg",
      });

      expect(store.getState().tasks["project-1"][0].imageUri).toBe(
        "file:///photo.jpg",
      );
    });

    it("addTask defaults imageUri to null when absent", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "No photo",
        description: "",
        notification: null,
      });

      expect(store.getState().tasks["project-1"][0].imageUri).toBeNull();
    });

    it("updateTask replaces the imageUri with a new value", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "Photo",
        description: "",
        notification: null,
        imageUri: "file:///old.jpg",
      });
      const id = store.getState().tasks["project-1"][0].id;

      await store.getState().updateTask("project-1", id, {
        imageUri: "file:///new.jpg",
      });

      expect(store.getState().tasks["project-1"][0].imageUri).toBe(
        "file:///new.jpg",
      );
    });

    it("updateTask can clear the imageUri to null", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "Photo",
        description: "",
        notification: null,
        imageUri: "file:///old.jpg",
      });
      const id = store.getState().tasks["project-1"][0].id;

      await store.getState().updateTask("project-1", id, {
        imageUri: null,
      });

      expect(store.getState().tasks["project-1"][0].imageUri).toBeNull();
    });

    it("updateTask leaves imageUri unchanged when the patch omits it", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "Photo",
        description: "",
        notification: null,
        imageUri: "file:///keep.jpg",
      });
      const id = store.getState().tasks["project-1"][0].id;

      await store.getState().updateTask("project-1", id, { title: "Renamed" });

      const task = store.getState().tasks["project-1"][0];
      expect(task.title).toBe("Renamed");
      expect(task.imageUri).toBe("file:///keep.jpg");
    });
  });

  describe("location attachment (location)", () => {
    const sampleLocation = {
      latitude: -34.6037,
      longitude: -58.3816,
      label: "Obelisco, Buenos Aires",
    };

    it("addTask persists the location from the input", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "With location",
        description: "",
        notification: null,
        location: sampleLocation,
      });

      expect(store.getState().tasks["project-1"][0].location).toEqual(sampleLocation);
    });

    it("addTask defaults location to null when absent", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "No location",
        description: "",
        notification: null,
      });

      expect(store.getState().tasks["project-1"][0].location).toBeNull();
    });

    it("updateTask replaces the location with a new value", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "Task location",
        description: "",
        notification: null,
        location: sampleLocation,
      });
      const id = store.getState().tasks["project-1"][0].id;

      const newLocation = {
        latitude: -34.521,
        longitude: -58.5,
        label: "Vicente López",
      };

      await store.getState().updateTask("project-1", id, {
        location: newLocation,
      });

      expect(store.getState().tasks["project-1"][0].location).toEqual(newLocation);
    });

    it("updateTask can clear the location to null", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "Task location",
        description: "",
        notification: null,
        location: sampleLocation,
      });
      const id = store.getState().tasks["project-1"][0].id;

      await store.getState().updateTask("project-1", id, {
        location: null,
      });

      expect(store.getState().tasks["project-1"][0].location).toBeNull();
    });

    it("updateTask leaves location unchanged when the patch omits it", async () => {
      const notifications = makeFakeNotifications();
      const store = makeStore(notifications);

      await store.getState().addTask("project-1", "Work", {
        title: "Task location",
        description: "",
        notification: null,
        location: sampleLocation,
      });
      const id = store.getState().tasks["project-1"][0].id;

      await store.getState().updateTask("project-1", id, { title: "Renamed" });

      const task = store.getState().tasks["project-1"][0];
      expect(task.title).toBe("Renamed");
      expect(task.location).toEqual(sampleLocation);
    });
  });
});
