import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Reminder } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { remindersService, NewReminder } from '../services/reminders';

export interface RemindersContextType {
  reminders: Reminder[];
  loading: boolean;
  addReminder: (data: NewReminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markCompleted: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const RemindersContext = createContext<RemindersContextType>({} as any);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const onNotificationReceived = useCallback((notifId: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.notificationId === notifId ? { ...r, notificationId: null } : r
      )
    );
  }, []);

  useNotifications(onNotificationReceived);

  useEffect(() => {
    const restore = async () => {
      try {
        const active = await remindersService.getReminders();
        setReminders(active);
      } catch (err) {
        console.error('[RemindersProvider] Error restoring:', err);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const addReminder = useCallback(
    async (data: NewReminder) => {
      const updated = await remindersService.addReminder(data, reminders);
      setReminders(updated);
    },
    [reminders]
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      const updated = await remindersService.deleteReminder(id, reminders);
      setReminders(updated);
    },
    [reminders]
  );

  const markCompleted = useCallback(
    async (id: string) => {
      const updated = await remindersService.markCompleted(id, reminders);
      setReminders(updated);
    },
    [reminders]
  );

  const clearAll = useCallback(async () => {
    await remindersService.clearAll();
    setReminders([]);
  }, []);

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        loading,
        addReminder,
        deleteReminder,
        markCompleted,
        clearAll,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
}
