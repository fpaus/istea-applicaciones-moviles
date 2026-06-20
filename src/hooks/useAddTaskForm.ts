import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTaskActions } from "./useTaskActions";

/**
 * Encapsulates the add-task form: field state, validation, and the save +
 * navigate side-effect. The screen consumes this and stays presentational.
 */
export function useAddTaskForm() {
  const { addTask } = useTaskActions();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hour, setHour] = useState<number | null>(null);
  const [minute, setMinute] = useState<number | null>(null);
  const [repeats, setRepeats] = useState(false);

  const isFormValid = title.trim() !== "" && hour !== null && minute !== null;

  const handleSave = useCallback(async () => {
    if (title.trim() === "" || hour === null || minute === null) return;

    await addTask({
      title,
      description,
      time: { hour, minute },
      repeats,
    });

    setTitle("");
    setDescription("");
    setHour(null);
    setMinute(null);
    setRepeats(false);

    router.back();
  }, [addTask, router, title, description, hour, minute, repeats]);

  return {
    title,
    setTitle,
    description,
    setDescription,
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
