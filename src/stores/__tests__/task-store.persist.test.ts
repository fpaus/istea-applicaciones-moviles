import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTaskStore } from "../task-store";
import { NotificationScheduler } from "../types";
import { NewTask, Task } from "../../types";

function fakeNotifications(): NotificationScheduler {
  return {
    scheduleNotification: jest.fn(async () => "notif-1"),
    cancelNotification: jest.fn(async () => {}),
    cancelAllNotifications: jest.fn(async () => {}),
  };
}

const input: NewTask = {
  title: "Persisted",
  description: "",
  time: { hour: 7, minute: 30 },
  repeats: false,
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("task store — persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("writes the store key to AsyncStorage when an action mutates state", async () => {
    const setItem = jest.spyOn(AsyncStorage, "setItem");
    const store = createTaskStore({ notifications: fakeNotifications() });

    await store.getState().addTask("project-1", "Work", input);
    await flush();

    expect(setItem).toHaveBeenCalledWith(
      "task-store",
      expect.stringContaining("Persisted"),
    );
  });

  it("persists only the tasks slice, not transient flags", async () => {
    const store = createTaskStore({ notifications: fakeNotifications() });
    await store.getState().addTask("project-1", "Work", input);
    await flush();

    const raw = await AsyncStorage.getItem("task-store");
    const parsed = JSON.parse(raw as string);

    expect(parsed.state).toHaveProperty("tasks");
    expect(parsed.state).not.toHaveProperty("hasHydrated");
  });

  it("rehydrates tasks from AsyncStorage and flips hasHydrated true", async () => {
    const stored: Task = {
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
      "task-store",
      JSON.stringify({ state: { tasks: { "project-1": [stored] } }, version: 0 }),
    );

    const store = createTaskStore({ notifications: fakeNotifications() });
    await store.persist.rehydrate();

    expect(store.getState().tasks["project-1"].map((t) => t.id)).toEqual(["seeded"]);
    expect(store.getState().hasHydrated).toBe(true);
  });
});
