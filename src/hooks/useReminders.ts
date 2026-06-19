import { useMemo } from "react";
import {
  selectActive,
  selectCompleted,
  useReminderStore,
} from "../stores/reminder-store";

/**
 * Thin selector over the reminder store, preserving the shape screens already
 * consume, including the derived active/completed splits.
 */
export function useReminders() {
  const reminders = useReminderStore((s) => s.reminders);
  const hasHydrated = useReminderStore((s) => s.hasHydrated);
  const addReminder = useReminderStore((s) => s.addReminder);
  const deleteReminder = useReminderStore((s) => s.deleteReminder);
  const markCompleted = useReminderStore((s) => s.markCompleted);
  const clearAll = useReminderStore((s) => s.clearAll);

  const activeReminders = useMemo(() => selectActive(reminders), [reminders]);
  const completedReminders = useMemo(() => selectCompleted(reminders), [reminders]);

  return useMemo(
    () => ({
      reminders,
      loading: !hasHydrated,
      addReminder,
      deleteReminder,
      markCompleted,
      clearAll,
      activeReminders,
      completedReminders,
    }),
    [
      reminders,
      hasHydrated,
      addReminder,
      deleteReminder,
      markCompleted,
      clearAll,
      activeReminders,
      completedReminders,
    ],
  );
}

