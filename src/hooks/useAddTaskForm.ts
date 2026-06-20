import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTaskActions } from "./useTaskActions";

export interface UseAddTaskFormResult {
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

/**
 * Encapsulates the add-task form: field state, validation, and the save +
 * navigate side-effect. The screen consumes this and stays presentational.
 */
export function useAddTaskForm(): UseAddTaskFormResult {
  const { addTask } = useTaskActions();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasReminder, setHasReminder] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [minute, setMinute] = useState<number | null>(null);
  const [repeats, setRepeats] = useState(false);

  const isFormValid =
    title.trim() !== "" &&
    (!hasReminder || (hour !== null && minute !== null));

  const handleSave = useCallback(async () => {
    if (title.trim() === "") return;
    if (hasReminder && (hour === null || minute === null)) return;

    await addTask({
      title,
      description,
      notification:
        hasReminder && hour !== null && minute !== null
          ? {
              time: { hour, minute },
              repeats,
              notificationId: null,
            }
          : null,
    });

    setTitle("");
    setDescription("");
    setHasReminder(false);
    setHour(null);
    setMinute(null);
    setRepeats(false);

    router.back();
  }, [addTask, router, title, description, hasReminder, hour, minute, repeats]);

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
