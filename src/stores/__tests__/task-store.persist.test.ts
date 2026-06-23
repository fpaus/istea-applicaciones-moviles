import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTaskStore } from "../task-store";
import { NotificationScheduler } from "../types";
import { NewTask, Task } from "../../types";

function fakeNotifications(): NotificationScheduler {
  return {
    scheduleNotification: jest.fn(async () => "notif-1"),
    cancelNotification: jest.fn(async () => {}),
  };
}

const input: NewTask = {
  title: "Persisted",
  description: "",
  notification: {
    time: { hour: 7, minute: 30 },
    repeats: false,
    notificationId: null,
  },
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
      notification: {
        time: { hour: 6, minute: 0 },
        repeats: false,
        notificationId: null,
      },
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

  it("preserves a task's imageUri across the persist/merge round-trip", async () => {
    const store = createTaskStore({ notifications: fakeNotifications() });
    // Let initial (empty) rehydration settle so it doesn't clobber the add below.
    await store.persist.rehydrate();
    await store.getState().addTask("project-1", "Work", {
      ...input,
      imageUri: "file:///persisted-photo.jpg",
    });
    await flush();

    const raw = await AsyncStorage.getItem("task-store");
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.tasks["project-1"][0].imageUri).toBe(
      "file:///persisted-photo.jpg",
    );

    // Rehydrate into a fresh store and confirm the value survives the merge.
    const rehydrated = createTaskStore({ notifications: fakeNotifications() });
    await rehydrated.persist.rehydrate();
    expect(rehydrated.getState().tasks["project-1"][0].imageUri).toBe(
      "file:///persisted-photo.jpg",
    );
  });

  it("preserves a task's location across the persist/merge round-trip", async () => {
    const store = createTaskStore({ notifications: fakeNotifications() });
    // Let initial (empty) rehydration settle so it doesn't clobber the add below.
    await store.persist.rehydrate();
    const sampleLocation = {
      latitude: -34.6037,
      longitude: -58.3816,
      label: "Obelisco",
    };
    await store.getState().addTask("project-1", "Work", {
      ...input,
      location: sampleLocation,
    });
    await flush();

    const raw = await AsyncStorage.getItem("task-store");
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.tasks["project-1"][0].location).toEqual(sampleLocation);

    // Rehydrate into a fresh store and confirm the value survives the merge.
    const rehydrated = createTaskStore({ notifications: fakeNotifications() });
    await rehydrated.persist.rehydrate();
    expect(rehydrated.getState().tasks["project-1"][0].location).toEqual(sampleLocation);
  });

  it("preserves a task's responsible across the persist/merge round-trip", async () => {
    const store = createTaskStore({ notifications: fakeNotifications() });
    // Let initial (empty) rehydration settle so it doesn't clobber the add below.
    await store.persist.rehydrate();
    const sampleResponsible = {
      name: "Juan Perez",
      contactId: "c-1",
      phone: "12345678",
    };
    await store.getState().addTask("project-1", "Work", {
      ...input,
      responsible: sampleResponsible,
    });
    await flush();

    const raw = await AsyncStorage.getItem("task-store");
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.tasks["project-1"][0].responsible).toEqual(sampleResponsible);

    // Rehydrate into a fresh store and confirm the value survives the merge.
    const rehydrated = createTaskStore({ notifications: fakeNotifications() });
    await rehydrated.persist.rehydrate();
    expect(rehydrated.getState().tasks["project-1"][0].responsible).toEqual(sampleResponsible);
  });
});
