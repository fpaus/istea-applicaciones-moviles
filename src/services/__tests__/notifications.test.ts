import * as Notifications from "expo-notifications";
import { NotificationService } from "../notifications";

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;

describe("NotificationService.scheduleNotification", () => {
  let service: NotificationService;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 1, 10, 0, 0)); // 10:00
  });

  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    jest.clearAllMocks();
    getPermissions.mockResolvedValue({ status: "granted" });
    service = new NotificationService();
  });

  it("uses a DAILY trigger when the reminder repeats", async () => {
    await service.scheduleNotification("t", "b", { hour: 9, minute: 15 }, true);

    const trigger = schedule.mock.calls[0][0].trigger;
    expect(trigger).toEqual({ type: "daily", hour: 9, minute: 15 });
  });

  it("schedules a one-shot today when the time is still ahead", async () => {
    await service.scheduleNotification("t", "b", { hour: 14, minute: 30 }, false);

    const trigger = schedule.mock.calls[0][0].trigger;
    expect(trigger.type).toBe("date");
    const date: Date = trigger.date;
    expect(date.getDate()).toBe(1); // same day
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
  });

  it("rolls a one-shot to tomorrow when the time has already passed", async () => {
    await service.scheduleNotification("t", "b", { hour: 8, minute: 0 }, false);

    const trigger = schedule.mock.calls[0][0].trigger;
    expect(trigger.type).toBe("date");
    const date: Date = trigger.date;
    expect(date.getDate()).toBe(2); // next day
    expect(date.getHours()).toBe(8);
  });

  it("returns null and schedules nothing when permission is denied", async () => {
    getPermissions.mockResolvedValue({ status: "denied" });
    requestPermissions.mockResolvedValue({ status: "denied" });

    const result = await service.scheduleNotification(
      "t",
      "b",
      { hour: 9, minute: 0 },
      true,
    );

    expect(result).toBeNull();
    expect(schedule).not.toHaveBeenCalled();
  });

  it("requests permission when not yet granted, then schedules", async () => {
    getPermissions.mockResolvedValue({ status: "undetermined" });
    requestPermissions.mockResolvedValue({ status: "granted" });

    const result = await service.scheduleNotification(
      "t",
      "b",
      { hour: 9, minute: 0 },
      true,
    );

    expect(requestPermissions).toHaveBeenCalled();
    expect(schedule).toHaveBeenCalled();
    expect(result).toBe("mock-notification-id");
  });
});

describe("NotificationService cancellation & listeners", () => {
  const service = new NotificationService();

  beforeEach(() => jest.clearAllMocks());

  it("cancels a single scheduled notification by id", async () => {
    await service.cancelNotification("abc");
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      "abc",
    );
  });

  it("cancels all scheduled notifications", async () => {
    await service.cancelAllNotifications();
    expect(
      Notifications.cancelAllScheduledNotificationsAsync,
    ).toHaveBeenCalledTimes(1);
  });

  it("registers a received-notification listener", () => {
    const cb = jest.fn();
    service.addNotificationReceivedListener(cb);
    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(
      cb,
    );
  });
});
