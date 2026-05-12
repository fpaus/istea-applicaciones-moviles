import { useEffect, useCallback, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, PermissionStatus } from '../services/notifications';
import { Time } from '../types';

export function useNotifications(onNotificationReceived?: (id: string) => void) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('idle');
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (onNotificationReceived) {
      notificationListener.current = notificationService.addNotificationReceivedListener(
        (notification) => {
          onNotificationReceived(notification.request.identifier);
        }
      );
    }
    return () => {
      notificationListener.current?.remove();
    };
  }, [onNotificationReceived]);

  const requestPermission = useCallback(async () => {
    setPermissionStatus('loading');
    const isGranted = await notificationService.requestPermission();
    setPermissionStatus(isGranted ? 'granted' : 'denied');
    return isGranted;
  }, []);

  const scheduleNotification = useCallback(
    async (title: string, body: string, time: Time, repeats: boolean) => {
      let isGranted = permissionStatus === 'granted';
      if (permissionStatus === 'idle') {
        isGranted = await requestPermission();
      }

      if (!isGranted) return null;

      return await notificationService.scheduleNotification(title, body, time, repeats);
    },
    [permissionStatus, requestPermission]
  );

  const cancelNotification = useCallback(async (id: string) => {
    await notificationService.cancelNotification(id);
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    await notificationService.cancelAllNotifications();
  }, []);

  return {
    permissionStatus,
    requestPermission,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
  };
}
