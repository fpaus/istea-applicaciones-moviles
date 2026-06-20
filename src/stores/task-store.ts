import AsyncStorage from "@react-native-async-storage/async-storage";
import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { notificationService } from "../services/notifications";
import { Task } from "../types";
import { TaskDeps, TaskState } from "./types";
import { generateUUID } from "../utils/uuid";

const STORAGE_KEY = "task-store";

/**
 * Pure selectors so behavior is unchanged: active = not completed,
 * sorted by next upcoming time-of-day.
 */
export function selectActive(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.completed)
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

export function selectCompleted(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.completed);
}

/**
 * The testable seam: a state initializer parameterized by its side-effect
 * dependency. Tests build a non-persisted store from this; the app wraps it in
 * `persist` below.
 */
export const createTaskState =
  (deps: TaskDeps): StateCreator<TaskState> =>
  (set, get) => ({
    tasks: {},
    hasHydrated: false,

    addTask: async (projectId, projectName, data) => {
      // Resilient: a denied permission (null) or a scheduler error must never
      // lose the user's task — persist it with a null notificationId.
      // `projectName` is injected by the caller so the store stays decoupled
      // from the project store (fully isolated unit tests).
      let notificationId: string | null = null;
      try {
        const displayTitle = projectName
          ? `[${projectName}] ${data.title}`
          : data.title;
        notificationId = await deps.notifications.scheduleNotification(
          displayTitle,
          data.description,
          data.time,
          data.repeats,
        );
      } catch (error) {
        console.error(
          "[task-store] Failed to schedule notification:",
          error,
        );
      }

      const newTask: Task = {
        id: generateUUID(),
        title: data.title,
        description: data.description,
        time: data.time,
        repeats: data.repeats,
        notificationId,
        completed: false,
        createdAt: Date.now(),
      };

      const projectTasks = get().tasks[projectId] || [];
      set({
        tasks: {
          ...get().tasks,
          [projectId]: [newTask, ...projectTasks],
        },
      });
    },

    deleteTask: async (projectId, id) => {
      const projectTasks = get().tasks[projectId] || [];
      const item = projectTasks.find((t) => t.id === id);
      if (item?.notificationId) {
        await deps.notifications.cancelNotification(item.notificationId);
      }
      set({
        tasks: {
          ...get().tasks,
          [projectId]: projectTasks.filter((t) => t.id !== id),
        },
      });
    },

    markCompleted: async (projectId, id) => {
      const projectTasks = get().tasks[projectId] || [];
      const item = projectTasks.find((t) => t.id === id);
      if (item?.notificationId) {
        await deps.notifications.cancelNotification(item.notificationId);
      }
      set({
        tasks: {
          ...get().tasks,
          [projectId]: projectTasks.map((t) =>
            t.id === id ? { ...t, completed: true, notificationId: null } : t,
          ),
        },
      });
    },

    clearAll: async (projectId) => {
      const projectTasks = get().tasks[projectId] || [];
      for (const t of projectTasks) {
        if (t.notificationId) {
          await deps.notifications.cancelNotification(t.notificationId);
        }
      }
      set({
        tasks: {
          ...get().tasks,
          [projectId]: [],
        },
      });
    },

    clearNotificationId: (notificationId) => {
      // Immutable update: rebuild only the affected project's array (and its
      // matched task) so subscribers relying on reference equality re-render.
      let found = false;
      const updatedTasks: Record<string, Task[]> = {};
      for (const [projectId, list] of Object.entries(get().tasks)) {
        const idx = list.findIndex((t) => t.notificationId === notificationId);
        if (!found && idx !== -1) {
          const nextList = [...list];
          nextList[idx] = { ...nextList[idx], notificationId: null };
          updatedTasks[projectId] = nextList;
          found = true;
        } else {
          updatedTasks[projectId] = list;
        }
      }
      if (found) {
        set({ tasks: updatedTasks });
      }
    },

    setHasHydrated: (value) => set({ hasHydrated: value }),
  });

export const createTaskStore = (
  deps: TaskDeps = { notifications: notificationService },
) =>
  create<TaskState>()(
    devtools(
      persist(createTaskState(deps), {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ tasks: state.tasks }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          tasks: (persistedState as any)?.tasks || {},
        }),
        onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      }),
      { name: "TaskStore" },
    ),
  );

export const useTaskStore = createTaskStore();
