import * as Device from "expo-device";
import type * as NotificationsType from "expo-notifications";
import { Platform } from "react-native";
import { Colors } from "../constants/theme";
import { Time } from "../types";

let Notifications: typeof NotificationsType | null = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require("expo-notifications") as typeof NotificationsType;
  } catch (error) {
    console.warn(
      "[NotificationService] Failed to load expo-notifications module. Notification features will be disabled.",
      error,
    );
  }
}

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.error(
      "[NotificationService] Failed to set notification handler:",
      error,
    );
  }
}

export class NotificationService {
  async requestPermission(): Promise<boolean> {
    if (!Notifications) {
      return false;
    }
    if (!Device.isDevice) {
      console.warn(
        "[NotificationService] Emulator detected. Notifications may not work.",
      );
    }
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("tasks", {
          name: "Tasks",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: Colors.light.primary,
          sound: "default",
        });
      } catch (error) {
        console.error(
          "[NotificationService] Failed to set notification channel:",
          error,
        );
      }
    }
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        finalStatus = status;
      }
      return finalStatus === "granted";
    } catch (error) {
      console.error(
        "[NotificationService] Failed to check/request permissions:",
        error,
      );
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    if (!Notifications) {
      return false;
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("[NotificationService] Failed to check permission:", error);
      return false;
    }
  }

  async scheduleNotification(
    title: string,
    body: string,
    time: Time,
    repeats: boolean,
  ): Promise<string | null> {
    if (!Notifications) {
      return null;
    }
    const isGranted = await this.requestPermission();
    if (!isGranted) {
      return null;
    }

    try {
      let trigger: NotificationsType.NotificationTriggerInput;

      if (repeats) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: time.hour,
          minute: time.minute,
        };
      } else {
        const now = new Date();
        const target = new Date();
        target.setHours(time.hour, time.minute, 0, 0);
        if (target <= now) {
          target.setDate(target.getDate() + 1);
        }
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: target,
        };
      }

      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: "default",
          data: { type: "task" },
        },
        trigger,
      });
    } catch (error) {
      console.error(
        "[NotificationService] Failed to schedule notification:",
        error,
      );
      return null;
    }
  }

  async cancelNotification(id: string): Promise<void> {
    if (!Notifications) {
      return;
    }
    await Notifications.cancelScheduledNotificationAsync(id).catch(
      console.error,
    );
  }

  addNotificationReceivedListener(
    callback: (notification: NotificationsType.Notification) => void,
  ): { remove: () => void } {
    if (!Notifications) {
      return { remove: (): void => {} };
    }
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(
    callback: (response: NotificationsType.NotificationResponse) => void,
  ): { remove: () => void } {
    if (!Notifications) {
      return { remove: (): void => {} };
    }
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
