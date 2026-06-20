import { useEffect } from "react";
import { notificationService } from "../services/notifications";
import { useTaskStore } from "../stores/task-store";

/**
 * Event bridge for the OS→store direction: when a scheduled notification fires,
 * clear the `notificationId` of its task. Mounted once at the app root.
 */
export function useNotificationBridge() {
  const clearNotificationId = useTaskStore((s) => s.clearNotificationId);

  useEffect(() => {
    const receivedSubscription = notificationService.addNotificationReceivedListener(
      (notification) => clearNotificationId(notification.request.identifier),
    );
    const responseSubscription = notificationService.addNotificationResponseReceivedListener(
      (response) =>
        clearNotificationId(response.notification.request.identifier),
    );
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [clearNotificationId]);
}
