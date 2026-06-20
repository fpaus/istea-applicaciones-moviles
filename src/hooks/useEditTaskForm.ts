import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTaskStore } from "../stores/task-store";
import { useProjectStore } from "../stores/project-store";
import { Task } from "../types";

const EMPTY_ARRAY: Task[] = [];

export interface UseEditTaskFormResult {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  hasReminder: boolean;
  setHasReminder: (hasReminder: boolean) => void;
  hour: number | null;
  setHour: (hour: number | null) => void;
  minute: number | null;
  setMinute: (minute: number | null) => void;
  repeats: boolean;
  setRepeats: (repeats: boolean) => void;
  isFormValid: boolean;
  handleSave: () => Promise<void>;
}

export function useEditTaskForm(
  projectId: string,
  taskId: string,
): UseEditTaskFormResult {
  const router = useRouter();

  const currentProject = useProjectStore((s) => s.currentProject);
  const projectName = currentProject?.name ?? "";

  const updateTask = useTaskStore((s) => s.updateTask);
  const oldTask = useTaskStore(
    useCallback((s) => (s.tasks[projectId] ?? EMPTY_ARRAY).find((t) => t.id === taskId), [projectId, taskId])
  );

  const [title, setTitle] = useState(oldTask?.title ?? "");
  const [description, setDescription] = useState(oldTask?.description ?? "");
  const [hasReminder, setHasReminder] = useState(!!oldTask?.notification);
  const [hour, setHour] = useState<number | null>(
    oldTask?.notification?.time.hour ?? null,
  );
  const [minute, setMinute] = useState<number | null>(
    oldTask?.notification?.time.minute ?? null,
  );
  const [repeats, setRepeats] = useState(
    oldTask?.notification?.repeats ?? false,
  );

  const isFormValid =
    title.trim() !== "" &&
    (!hasReminder || (hour !== null && minute !== null));

  const handleSave = useCallback(async () => {
    if (!oldTask) return;
    if (title.trim() === "") return;
    if (hasReminder && (hour === null || minute === null)) return;

    const patch: Partial<Omit<Task, "id" | "completed" | "createdAt">> = {};
    if (title !== oldTask.title) patch.title = title;
    if (description !== oldTask.description) patch.description = description;

    if (!hasReminder) {
      if (oldTask.notification) {
        patch.notification = null;
      }
    } else {
      if (hour !== null && minute !== null) {
        if (!oldTask.notification) {
          patch.notification = {
            time: { hour, minute },
            repeats,
            notificationId: null,
          };
        } else {
          const oldNotif = oldTask.notification;
          const timeChanged =
            oldNotif.time.hour !== hour ||
            oldNotif.time.minute !== minute;
          const repeatsChanged = oldNotif.repeats !== repeats;
          if (timeChanged || repeatsChanged) {
            patch.notification = {
              time: { hour, minute },
              repeats,
              notificationId: oldNotif.notificationId,
            };
          }
        }
      }
    }

    if (Object.keys(patch).length > 0) {
      await updateTask(projectId, taskId, patch, projectName);
    }

    router.back();
  }, [
    updateTask,
    router,
    projectId,
    taskId,
    title,
    description,
    hasReminder,
    hour,
    minute,
    repeats,
    oldTask,
    projectName,
  ]);

  return {
    title,
    setTitle,
    description,
    setDescription,
    hasReminder,
    setHasReminder,
    hour,
    setHour,
    minute,
    setMinute,
    repeats,
    setRepeats,
    isFormValid,
    handleSave,
  };
}
