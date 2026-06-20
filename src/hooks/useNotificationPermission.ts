import { useCallback, useEffect, useState } from "react";
import { notificationService } from "../services/notifications";
import { useProject } from "./useProject";

/**
 * Encapsulates notification-permission state: checks current status once a
 * project is active, and exposes a request action. Keeps screens presentational.
 */
export function useNotificationPermission() {
  const { isProjectSelected } = useProject();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isProjectSelected) {
      notificationService.checkPermission().then(setHasPermission);
    }
  }, [isProjectSelected]);

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
  }, []);

  return { hasPermission, requestPermission };
}
