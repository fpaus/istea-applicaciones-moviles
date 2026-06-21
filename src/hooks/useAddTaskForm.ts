import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { imagePickerService } from "../services/image-picker";
import { locationService } from "../services/location";
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
  imageUri: string | null;
  pickImage: () => Promise<void>;
  removeImage: () => void;
  location: { latitude: number; longitude: number; label?: string } | null;
  setLocation: (location: { latitude: number; longitude: number; label?: string } | null) => void;
  isLocating: boolean;
  captureLocation: () => Promise<void>;
  clearLocation: () => void;
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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; label?: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const isFormValid =
    title.trim() !== "" &&
    (!hasReminder || (hour !== null && minute !== null));

  // Delegates to the resilient service: a cancel/denial returns null, which
  // leaves the current selection untouched (never blocks saving the task).
  const pickImage = useCallback(async () => {
    const uri = await imagePickerService.pickFromLibrary();
    if (uri) setImageUri(uri);
  }, []);

  const removeImage = useCallback(() => setImageUri(null), []);

  const captureLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) setLocation(loc);
    } finally {
      setIsLocating(false);
    }
  }, []);

  const clearLocation = useCallback(() => setLocation(null), []);

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
      imageUri,
      location,
    });

    setTitle("");
    setDescription("");
    setHasReminder(false);
    setHour(null);
    setMinute(null);
    setRepeats(false);
    setImageUri(null);
    setLocation(null);

    router.back();
  }, [addTask, router, title, description, hasReminder, hour, minute, repeats, imageUri, location]);

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
    imageUri,
    pickImage,
    removeImage,
    location,
    setLocation,
    isLocating,
    captureLocation,
    clearLocation,
    isFormValid,
    handleSave,
  };
}
