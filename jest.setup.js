/* global jest */
// Wire the official AsyncStorage mock so zustand's `persist` works under test.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock expo-notifications so tests are hermetic (no native module / Expo Go
// warnings). NotificationService is exercised via injected fakes in store tests.
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  scheduleNotificationAsync: jest.fn(async () => "mock-notification-id"),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: "daily", DATE: "date" },
}));

jest.mock("expo-device", () => ({ isDevice: true }));

// Mock expo-image-picker so tests are hermetic (no native module). The
// ImagePickerService is exercised against these jest.fn()s; forms inject a fake.
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
    status: "granted",
    granted: true,
  })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: "file:///mock/picked-image.jpg" }],
  })),
}));

jest.mock("expo-calendar", () => ({
  requestCalendarPermissionsAsync: jest.fn(async () => ({
    status: "granted",
  })),
  getCalendarPermissionsAsync: jest.fn(async () => ({
    status: "granted",
  })),
  getCalendarsAsync: jest.fn(async () => [
    {
      id: "cal-1",
      title: "Default",
      allowsModifications: true,
      source: { name: "Local", type: "local", isLocalAccount: true },
    },
  ]),
  createCalendarAsync: jest.fn(async () => "cal-new"),
  createEventAsync: jest.fn(async () => "event-1"),
  updateEventAsync: jest.fn(async () => "event-1"),
  deleteEventAsync: jest.fn(async () => {}),
  createAttendeeAsync: jest.fn(async () => "attendee-1"),
  EntityTypes: { EVENT: "event", REMINDER: "reminder" },
  Frequency: { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly", YEARLY: "yearly" },
  AttendeeRole: {
    UNKNOWN: "unknown",
    REQUIRED: "required",
    OPTIONAL: "optional",
    ATTENDEE: "attendee",
  },
  AttendeeStatus: {
    INVITED: "invited",
    ACCEPTED: "accepted",
    PENDING: "pending",
  },
  AttendeeType: {
    UNKNOWN: "unknown",
    PERSON: "person",
    REQUIRED: "required",
  },
}));
