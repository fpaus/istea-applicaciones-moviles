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
      const hasA = !!a.notification;
      const hasB = !!b.notification;

      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;
      if (!hasA && !hasB) {
        return a.createdAt - b.createdAt;
      }

      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      const timeA = a.notification!.time.hour * 60 + a.notification!.time.minute;
      const timeB = b.notification!.time.hour * 60 + b.notification!.time.minute;

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
  (set, get) => {
    // Resilience: cancelling an OS notification must never abort or partially
    // corrupt the data mutation that triggered it (mirrors `addTask`, which
    // swallows scheduling errors). A failed cancel is logged, not thrown.
    const safeCancel = async (id: string | null) => {
      if (!id) return;
      try {
        await deps.notifications.cancelNotification(id);
      } catch (error) {
        console.error("[task-store] Failed to cancel notification:", error);
      }
    };

    return {
    tasks: {},
    hasHydrated: false,

    addTask: async (projectId, projectName, data) => {
      // Resilient: a denied permission (null) or a scheduler error must never
      // lose the user's task — persist it with a null notificationId.
      // `projectName` is injected by the caller so the store stays decoupled
      // from the project store (fully isolated unit tests).
      let notificationId: string | null = null;
      if (data.notification) {
        try {
          const displayTitle = projectName
            ? `[${projectName}] ${data.title}`
            : data.title;
          notificationId = await deps.notifications.scheduleNotification(
            displayTitle,
            data.description,
            data.notification.time,
            data.notification.repeats,
          );
        } catch (error) {
          console.error(
            "[task-store] Failed to schedule notification:",
            error,
          );
        }
      }

      const newTask: Task = {
        id: generateUUID(),
        title: data.title,
        description: data.description,
        notification: data.notification
          ? {
              time: data.notification.time,
              repeats: data.notification.repeats,
              notificationId,
            }
          : null,
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
      await safeCancel(item?.notification?.notificationId ?? null);
      set({
        tasks: {
          ...get().tasks,
          [projectId]: projectTasks.filter((t) => t.id !== id),
        },
      });
    },

    updateTask: async (projectId, id, patch, projectName) => {
      const projectTasks = get().tasks[projectId] || [];
      const taskIndex = projectTasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) return;

      const oldTask = projectTasks[taskIndex];
      const nextTitle = patch.title !== undefined ? patch.title : oldTask.title;
      const nextDescription =
        patch.description !== undefined
          ? patch.description
          : oldTask.description;

      let nextNotification = oldTask.notification;

      if (patch.notification !== undefined) {
        const oldNotif = oldTask.notification;
        const newNotif = patch.notification;

        if (!oldNotif && newNotif) {
          // none -> set
          let notificationId: string | null = null;
          try {
            const displayTitle = projectName
              ? `[${projectName}] ${nextTitle}`
              : nextTitle;
            notificationId = await deps.notifications.scheduleNotification(
              displayTitle,
              nextDescription,
              newNotif.time,
              newNotif.repeats,
            );
          } catch (error) {
            console.error(
              "[task-store] Failed to schedule notification:",
              error,
            );
          }
          nextNotification = {
            time: newNotif.time,
            repeats: newNotif.repeats,
            notificationId,
          };
        } else if (oldNotif && !newNotif) {
          // set -> none
          await safeCancel(oldNotif.notificationId);
          nextNotification = null;
        } else if (oldNotif && newNotif) {
          // set -> changed
          const timeChanged =
            oldNotif.time.hour !== newNotif.time.hour ||
            oldNotif.time.minute !== newNotif.time.minute;
          const repeatsChanged = oldNotif.repeats !== newNotif.repeats;
          const titleOrDescChanged =
            nextTitle !== oldTask.title || nextDescription !== oldTask.description;

          if (timeChanged || repeatsChanged || titleOrDescChanged) {
            await safeCancel(oldNotif.notificationId);
            let notificationId: string | null = null;
            try {
              const displayTitle = projectName
                ? `[${projectName}] ${nextTitle}`
                : nextTitle;
              notificationId = await deps.notifications.scheduleNotification(
                displayTitle,
                nextDescription,
                newNotif.time,
                newNotif.repeats,
              );
            } catch (error) {
              console.error(
                "[task-store] Failed to schedule notification:",
                error,
              );
            }
            nextNotification = {
              time: newNotif.time,
              repeats: newNotif.repeats,
              notificationId,
            };
          }
        }
      } else {
        // patch.notification is undefined, check if title/description changed for rescheduling
        const oldNotif = oldTask.notification;
        if (
          oldNotif &&
          (nextTitle !== oldTask.title || nextDescription !== oldTask.description)
        ) {
          await safeCancel(oldNotif.notificationId);
          let notificationId: string | null = null;
          try {
            const displayTitle = projectName
              ? `[${projectName}] ${nextTitle}`
              : nextTitle;
            notificationId = await deps.notifications.scheduleNotification(
              displayTitle,
              nextDescription,
              oldNotif.time,
              oldNotif.repeats,
            );
          } catch (error) {
            console.error(
              "[task-store] Failed to schedule notification:",
              error,
            );
          }
          nextNotification = {
            time: oldNotif.time,
            repeats: oldNotif.repeats,
            notificationId,
          };
        }
      }

      const updatedTask: Task = {
        ...oldTask,
        title: nextTitle,
        description: nextDescription,
        notification: nextNotification,
      };

      const nextTasks = [...projectTasks];
      nextTasks[taskIndex] = updatedTask;

      set({
        tasks: {
          ...get().tasks,
          [projectId]: nextTasks,
        },
      });
    },

    markCompleted: async (projectId, id) => {
      const projectTasks = get().tasks[projectId] || [];
      const item = projectTasks.find((t) => t.id === id);
      await safeCancel(item?.notification?.notificationId ?? null);
      set({
        tasks: {
          ...get().tasks,
          [projectId]: projectTasks.map((t) =>
            t.id === id ? { ...t, completed: true, notification: null } : t,
          ),
        },
      });
    },

    clearAll: async (projectId) => {
      const projectTasks = get().tasks[projectId] || [];
      for (const t of projectTasks) {
        await safeCancel(t.notification?.notificationId ?? null);
      }
      set({
        tasks: {
          ...get().tasks,
          [projectId]: [],
        },
      });
    },

    removeProjectTasks: async (projectId) => {
      const projectTasks = get().tasks[projectId];
      if (!projectTasks) return;
      for (const t of projectTasks) {
        await safeCancel(t.notification?.notificationId ?? null);
      }
      // Immutably drop the project's key so subscribers re-render.
      const { [projectId]: _removed, ...rest } = get().tasks;
      set({ tasks: rest });
    },

    clearNotificationId: (notificationId) => {
      // Immutable update: rebuild only the affected project's array (and its
      // matched task) so subscribers relying on reference equality re-render.
      let found = false;
      const updatedTasks: Record<string, Task[]> = {};
      for (const [projectId, list] of Object.entries(get().tasks)) {
        const idx = list.findIndex((t) => t.notification?.notificationId === notificationId);
        if (!found && idx !== -1) {
          const nextList = [...list];
          const taskToUpdate = nextList[idx];
          nextList[idx] = {
            ...taskToUpdate,
            notification: taskToUpdate.notification
              ? { ...taskToUpdate.notification, notificationId: null }
              : null,
          };
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
    };
  };

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
