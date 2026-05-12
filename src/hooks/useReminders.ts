import { useContext } from 'react';
import { RemindersContext } from '../providers/reminders-provider';
import { remindersService } from '../services/reminders';

export function useReminders() {
  const context = useContext(RemindersContext);

  const activeReminders = remindersService.getActiveReminders(context.reminders);
  const completedReminders = remindersService.getCompletedReminders(context.reminders);

  return {
    ...context,
    activeReminders,
    completedReminders,
  };
}
