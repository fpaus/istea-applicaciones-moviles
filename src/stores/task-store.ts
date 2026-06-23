import AsyncStorage from "@react-native-async-storage/async-storage";
import { StateCreator, create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { notificationService } from "../services/notifications";
import { calendarService } from "../services/calendar";
import { Task } from "../types";
import { TaskDeps, TaskState } from "./types";
import { generateUUID } from "../utils/uuid";
import { descendants, completeTask, reopenTask, ancestors } from "../utils/tasks-cascade";

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

function isFutureTime(time: { hour: number; minute: number }): boolean {
  const now = new Date();
  const currentTotal = now.getHours() * 60 + now.getMinutes();
  const timeTotal = time.hour * 60 + time.minute;
  return timeTotal > currentTotal;
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
    const safeCancel = async (id: string | null): Promise<void> => {
      if (!id) return;
      try {
        await deps.notifications.cancelNotification(id);
      } catch (error) {
        console.error("[task-store] Failed to cancel notification:", error);
      }
    };

    // Resilience: a failing calendar op must never abort or partially
    // corrupt the data mutation — mirror safeCancel for calendar events.
    const safeCalendarDelete = async (eventId: string | null): Promise<void> => {
      if (!eventId || !deps.calendar) return;
      try {
        await deps.calendar.deleteEvent(eventId);
      } catch (error) {
        console.error("[task-store] Failed to delete calendar event:", error);
      }
    };

    const performReopen = async (
      projectTasks: Task[],
      targetId: string,
      projName?: string,
    ): Promise<Task[]> => {
      const target = projectTasks.find((t) => t.id === targetId);
      if (!target) return projectTasks;

      const ancList = ancestors(projectTasks, targetId);
      const affectedTasks = [target, ...ancList];

      const newNotifIds: Record<string, string | null> = {};
      const newCalendarIds: Record<string, string | null> = {};

      for (const t of affectedTasks) {
        if (t.completed && t.notification) {
          const repeats = t.notification.repeats;
          const isFuture = isFutureTime(t.notification.time);

          if (repeats || isFuture) {
            try {
              const isSubtask = !!t.parentId;
              const displayTitle =
                projName && !isSubtask
                  ? `[${projName}] ${t.title}`
                  : t.title;

              const newId = await deps.notifications.scheduleNotification(
                displayTitle,
                t.description,
                t.notification.time,
                repeats,
              );
              newNotifIds[t.id] = newId;
            } catch (error) {
              console.error(
                "[task-store] Failed to reschedule notification on reopen:",
                error,
              );
              newNotifIds[t.id] = null;
            }

            // Calendar lockstep: recreate event if calendar preference is set.
            if (t.calendar && deps.calendar) {
              try {
                const eventId = await deps.calendar.createEvent(
                  t.title,
                  t.description,
                  t.notification.time,
                  repeats,
                  t.responsible,
                );
                newCalendarIds[t.id] = eventId;
              } catch (error) {
                console.error(
                  "[task-store] Failed to recreate calendar event on reopen:",
                  error,
                );
                newCalendarIds[t.id] = null;
              }
            }
          } else {
            newNotifIds[t.id] = null;
          }
        }
      }

      const reopenedList = reopenTask(projectTasks, targetId);

      return reopenedList.map((t) => {
        let updated = t;
        if (t.id in newNotifIds) {
          updated = {
            ...updated,
            notification: updated.notification
              ? { ...updated.notification, notificationId: newNotifIds[t.id] }
              : null,
          };
        }
        if (t.id in newCalendarIds) {
          updated = {
            ...updated,
            calendar: updated.calendar
              ? { ...updated.calendar, eventId: newCalendarIds[t.id] }
              : updated.calendar,
          };
        }
        return updated;
      });
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
          const isSubtask = !!data.parentId;
          const displayTitle = projectName && !isSubtask
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

      // Calendar lockstep: create an event if the user opted in.
      let calendarEventId: string | null = null;
      if (data.calendar && data.notification && deps.calendar) {
        try {
          calendarEventId = await deps.calendar.createEvent(
            data.title,
            data.description,
            data.notification.time,
            data.notification.repeats,
            data.responsible,
          );
        } catch (error) {
          console.error(
            "[task-store] Failed to create calendar event:",
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
        parentId: data.parentId ?? null,
        imageUri: data.imageUri ?? null,
        location: data.location ?? null,
        responsible: data.responsible ?? null,
        calendar: data.calendar
          ? { eventId: calendarEventId }
          : null,
      };

      const projectTasks = get().tasks[projectId] || [];
      let updatedTasks = [newTask, ...projectTasks];

      if (data.parentId) {
        const parent = projectTasks.find((t) => t.id === data.parentId);
        if (parent?.completed) {
          updatedTasks = await performReopen(updatedTasks, data.parentId, projectName);
        }
      }

      set({
        tasks: {
          ...get().tasks,
          [projectId]: updatedTasks,
        },
      });
    },

    deleteTask: async (projectId, id) => {
      const projectTasks = get().tasks[projectId] || [];
      const item = projectTasks.find((t) => t.id === id);

      const subDesc = item ? descendants(projectTasks, id) : [];
      const itemsToDelete = item ? [item, ...subDesc] : [];
      const deleteIds = new Set(itemsToDelete.map((t) => t.id));

      for (const t of itemsToDelete) {
        await safeCancel(t.notification?.notificationId ?? null);
        await safeCalendarDelete(t.calendar?.eventId ?? null);
      }

      set({
        tasks: {
          ...get().tasks,
          [projectId]: projectTasks.filter((t) => !deleteIds.has(t.id)),
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

      // `imageUri` is an explicit clear vs. unchanged distinction: `undefined`
      // means "leave as-is", `null` means "remove the image".
      const nextImageUri =
        patch.imageUri !== undefined ? patch.imageUri : oldTask.imageUri;

      // `location` is also an explicit clear vs. unchanged distinction: `undefined`
      // means "leave as-is", `null` means "remove the location".
      const nextLocation =
        patch.location !== undefined ? patch.location : oldTask.location;

      // `responsible` is also an explicit clear vs. unchanged distinction: `undefined`
      // means "leave as-is", `null` means "remove the responsible".
      const nextResponsible =
        patch.responsible !== undefined ? patch.responsible : oldTask.responsible;

      // Calendar lockstep reconciliation during updateTask.
      let nextCalendar = oldTask.calendar;
      if (patch.calendar !== undefined) {
        const oldCal = oldTask.calendar;
        const newCal = patch.calendar;

        if (!oldCal && newCal && nextNotification && deps.calendar) {
          // Calendar toggled ON: create event.
          let eventId: string | null = null;
          try {
            eventId = await deps.calendar.createEvent(
              nextTitle,
              nextDescription,
              nextNotification.time,
              nextNotification.repeats,
              nextResponsible,
            );
          } catch (error) {
            console.error("[task-store] Failed to create calendar event:", error);
          }
          nextCalendar = { eventId };
        } else if (oldCal && !newCal) {
          // Calendar toggled OFF: delete event.
          await safeCalendarDelete(oldCal.eventId);
          nextCalendar = null;
        }
      }

      // If reminder was removed, also remove calendar event.
      if (!nextNotification && oldTask.notification && nextCalendar) {
        await safeCalendarDelete(nextCalendar.eventId);
        nextCalendar = null;
      }

      // If notification changed and calendar is on, update the event.
      if (
        nextCalendar?.eventId &&
        nextNotification &&
        deps.calendar &&
        patch.calendar === undefined // not already handled above
      ) {
        const notifChanged = patch.notification !== undefined;
        const titleOrDescChanged =
          nextTitle !== oldTask.title || nextDescription !== oldTask.description;
        if (notifChanged || titleOrDescChanged) {
          try {
            await deps.calendar.updateEvent(
              nextCalendar.eventId,
              nextTitle,
              nextDescription,
              nextNotification.time,
              nextNotification.repeats,
              nextResponsible,
            );
          } catch (error) {
            console.error("[task-store] Failed to update calendar event:", error);
          }
        }
      }

      const updatedTask: Task = {
        ...oldTask,
        title: nextTitle,
        description: nextDescription,
        notification: nextNotification,
        imageUri: nextImageUri,
        location: nextLocation,
        responsible: nextResponsible,
        calendar: nextCalendar,
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
      if (item) {
        const descList = descendants(projectTasks, id);
        const affectedTasks = [item, ...descList];

        for (const t of affectedTasks) {
          if (t.notification?.notificationId) {
            await safeCancel(t.notification.notificationId);
          }
          await safeCalendarDelete(t.calendar?.eventId ?? null);
        }
      }

      // completeTask sets completed=true and notificationId=null.
      // We also need to null out eventId while preserving the calendar preference.
      const completedList = completeTask(projectTasks, id);
      const affectedIds = item
        ? new Set([item.id, ...descendants(projectTasks, id).map((t) => t.id)])
        : new Set<string>();

      const finalList = completedList.map((t) => {
        if (affectedIds.has(t.id) && t.calendar) {
          return { ...t, calendar: { eventId: null } };
        }
        return t;
      });

      set({
        tasks: {
          ...get().tasks,
          [projectId]: finalList,
        },
      });
    },

    reopenTask: async (projectId, id, projectName) => {
      const projectTasks = get().tasks[projectId] || [];
      const updatedList = await performReopen(projectTasks, id, projectName);
      set({
        tasks: {
          ...get().tasks,
          [projectId]: updatedList,
        },
      });
    },

    clearAll: async (projectId) => {
      const projectTasks = get().tasks[projectId] || [];
      for (const t of projectTasks) {
        await safeCancel(t.notification?.notificationId ?? null);
        await safeCalendarDelete(t.calendar?.eventId ?? null);
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
        await safeCalendarDelete(t.calendar?.eventId ?? null);
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
  deps: TaskDeps = { notifications: notificationService, calendar: calendarService },
) =>
  create<TaskState>()(
    persist(createTaskState(deps), {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tasks: state.tasks }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        tasks: (persistedState as Partial<TaskState>)?.tasks ?? {},
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated?.(true),
    }),
  );

export const useTaskStore = createTaskStore();
