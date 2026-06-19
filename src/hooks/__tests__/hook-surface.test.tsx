import { renderHook } from "@testing-library/react-native";
import { useAuth } from "../useAuth";
import { useReminders } from "../useReminders";
import { useAuthStore } from "../../stores/auth-store";
import { useReminderStore } from "../../stores/reminder-store";
import { Reminder } from "../../types";

const activeReminder: Reminder = {
  id: "1",
  title: "Active",
  description: "",
  time: { hour: 8, minute: 0 },
  repeats: false,
  notificationId: "n1",
  completed: false,
  createdAt: 0,
};
const doneReminder: Reminder = {
  ...activeReminder,
  id: "2",
  title: "Done",
  notificationId: null,
  completed: true,
};

describe("useAuth selector", () => {
  it("exposes the expected shape and derives isLoggedIn from the store", () => {
    useAuthStore.setState({
      user: { email: "john@example.com" },
      hasHydrated: true,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user?.email).toBe("john@example.com");
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.register).toBe("function");
    expect(typeof result.current.logout).toBe("function");
  });

  it("reports not logged in when there is no user", () => {
    useAuthStore.setState({ user: null, hasHydrated: true });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(false);
  });
});

describe("useReminders selector", () => {
  it("exposes the expected shape and splits active/completed", () => {
    useReminderStore.setState({
      reminders: [activeReminder, doneReminder],
      hasHydrated: true,
    });

    const { result } = renderHook(() => useReminders());

    expect(result.current.activeReminders.map((r) => r.id)).toEqual(["1"]);
    expect(result.current.completedReminders.map((r) => r.id)).toEqual(["2"]);
    expect(typeof result.current.addReminder).toBe("function");
    expect(typeof result.current.deleteReminder).toBe("function");
    expect(typeof result.current.markCompleted).toBe("function");
    expect(typeof result.current.clearAll).toBe("function");
  });
});
