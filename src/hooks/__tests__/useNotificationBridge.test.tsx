import { act, renderHook } from "@testing-library/react-native";
import { useReminderStore } from "../../stores/reminder-store";
import { useNotificationBridge } from "../useNotificationBridge";

const mockState: {
  receivedListener: ((notification: any) => void) | null;
  responseListener: ((response: any) => void) | null;
} = {
  receivedListener: null,
  responseListener: null,
};
const mockRemove = jest.fn();

jest.mock("../../services/notifications", () => ({
  notificationService: {
    addNotificationReceivedListener: (cb: (n: any) => void) => {
      mockState.receivedListener = cb;
      return { remove: mockRemove };
    },
    addNotificationResponseReceivedListener: (cb: (r: any) => void) => {
      mockState.responseListener = cb;
      return { remove: mockRemove };
    },
    scheduleNotification: jest.fn(),
    cancelNotification: jest.fn(),
    cancelAllNotifications: jest.fn(),
    requestPermission: jest.fn(),
  },
}));

describe("useNotificationBridge", () => {
  beforeEach(() => {
    mockState.receivedListener = null;
    mockState.responseListener = null;
    mockRemove.mockClear();
    useReminderStore.setState({
      reminders: [
        {
          id: "1",
          title: "A",
          description: "",
          time: { hour: 8, minute: 0 },
          repeats: false,
          notificationId: "n1",
          completed: false,
          createdAt: 0,
        },
      ],
    });
  });

  it("clears the matching reminder's notificationId when a notification fires in foreground", () => {
    renderHook(() => useNotificationBridge());

    expect(mockState.receivedListener).toBeInstanceOf(Function);

    act(() => {
      mockState.receivedListener!({ request: { identifier: "n1" } });
    });

    expect(useReminderStore.getState().reminders[0].notificationId).toBeNull();
  });

  it("clears the matching reminder's notificationId when a user interacts with a notification response", () => {
    renderHook(() => useNotificationBridge());

    expect(mockState.responseListener).toBeInstanceOf(Function);

    act(() => {
      mockState.responseListener!({
        notification: { request: { identifier: "n1" } },
      });
    });

    expect(useReminderStore.getState().reminders[0].notificationId).toBeNull();
  });

  it("removes both listeners on unmount", () => {
    const { unmount } = renderHook(() => useNotificationBridge());
    unmount();
    expect(mockRemove).toHaveBeenCalledTimes(2);
  });
});
