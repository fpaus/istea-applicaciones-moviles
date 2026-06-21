import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { NotificationService } from "../notifications";


const initialHandlerCalls = [...(Notifications.setNotificationHandler as jest.Mock).mock.calls];

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

  it("sets the tasks channel on Android during requestPermission", async () => {
    const setChannel = Notifications.setNotificationChannelAsync as jest.Mock;
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });

    await service.requestPermission();

    expect(setChannel).toHaveBeenCalledWith("tasks", {
      name: "Tasks",
      importance: expect.any(Number),
      vibrationPattern: expect.any(Array),
      lightColor: expect.any(String),
      sound: "default",
    });

    Object.defineProperty(Platform, "OS", { get: () => originalOS, configurable: true });
  });

  it("warns when running on emulator/simulator", async () => {
    const originalIsDevice = Device.isDevice;
    Object.defineProperty(Device, "isDevice", { value: false, configurable: true });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    await service.requestPermission();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Emulator detected"),
    );

    warnSpy.mockRestore();
    Object.defineProperty(Device, "isDevice", { value: originalIsDevice, configurable: true });
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

  it("registers a response-received listener", () => {
    const cb = jest.fn();
    service.addNotificationResponseReceivedListener(cb);
    expect(
      Notifications.addNotificationResponseReceivedListener,
    ).toHaveBeenCalledWith(cb);
  });

  it("sets the global notification handler options", async () => {
    expect(initialHandlerCalls.length).toBeGreaterThan(0);
    const config = initialHandlerCalls[0][0];
    expect(config.handleNotification).toBeDefined();

    const options = await config.handleNotification();
    expect(options).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    });
  });
});

describe("NotificationService.checkPermission", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("returns true when permission is granted", async () => {
    getPermissions.mockResolvedValue({ status: "granted" });
    const result = await service.checkPermission();
    expect(result).toBe(true);
    expect(getPermissions).toHaveBeenCalled();
  });

  it("returns false when permission is denied", async () => {
    getPermissions.mockResolvedValue({ status: "denied" });
    const result = await service.checkPermission();
    expect(result).toBe(false);
    expect(getPermissions).toHaveBeenCalled();
  });
});

describe("NotificationService when expo-notifications fails to load", () => {
  it("fails gracefully without crashing and returns safe fallback values", async () => {
    let IsolatedService: typeof NotificationService | undefined;
    
    jest.isolateModules(() => {
      jest.unmock("expo-notifications");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("../notifications");
      IsolatedService = mod.NotificationService;
    });

    if (!IsolatedService) {
      throw new Error("IsolatedService is undefined");
    }

    const service = new IsolatedService();

    const checked = await service.checkPermission();
    expect(checked).toBe(false);

    const requested = await service.requestPermission();
    expect(requested).toBe(false);

    const scheduled = await service.scheduleNotification("t", "b", { hour: 9, minute: 0 }, true);
    expect(scheduled).toBeNull();

    await expect(service.cancelNotification("123")).resolves.toBeUndefined();
    await expect(service.cancelAllNotifications()).resolves.toBeUndefined();

    const sub = service.addNotificationReceivedListener(() => {});
    expect(sub).toBeDefined();
    expect(typeof sub.remove).toBe("function");
    sub.remove();

    const subResp = service.addNotificationResponseReceivedListener(() => {});
    expect(subResp).toBeDefined();
    expect(typeof subResp.remove).toBe("function");
    subResp.remove();
  });
});

describe("NotificationService on web platform", () => {
  it("does not load expo-notifications and returns no-op fallbacks", async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { get: () => "web", configurable: true });

    let IsolatedService: typeof NotificationService | undefined;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("../notifications");
      IsolatedService = mod.NotificationService;
    });

    Object.defineProperty(Platform, "OS", { get: () => originalOS, configurable: true });

    if (!IsolatedService) {
      throw new Error("IsolatedService is undefined");
    }

    const service = new IsolatedService();

    expect(await service.requestPermission()).toBe(false);
    expect(await service.checkPermission()).toBe(false);
    expect(await service.scheduleNotification("t", "b", { hour: 9, minute: 0 }, true)).toBeNull();
    await expect(service.cancelNotification("123")).resolves.toBeUndefined();
    await expect(service.cancelAllNotifications()).resolves.toBeUndefined();

    const sub = service.addNotificationReceivedListener(() => {});
    expect(typeof sub.remove).toBe("function");

    const subResp = service.addNotificationResponseReceivedListener(() => {});
    expect(typeof subResp.remove).toBe("function");
  });
});


