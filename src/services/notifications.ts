import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Time } from "../types";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type PermissionStatus = "idle" | "granted" | "denied" | "loading";

export class NotificationService {
  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn(
        "[NotificationService] Emulator detected. Notifications may not work.",
      );
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("tasks", {
        name: "Tasks",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6C63FF",
        sound: "default",
      });
    }
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
  }

  async checkPermission(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  }

  async scheduleNotification(
    title: string,
    body: string,
    time: Time,
    repeats: boolean,
  ): Promise<string | null> {
    const isGranted = await this.requestPermission();
    if (!isGranted) return null;

    let trigger: Notifications.NotificationTriggerInput;

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
  }

  async cancelNotification(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id).catch(
      console.error,
    );
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync().catch(
      console.error,
    );
  }

  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void,
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void,
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
