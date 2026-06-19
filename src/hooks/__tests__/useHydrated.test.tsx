import { renderHook } from "@testing-library/react-native";
import { useHydrated } from "../useHydrated";
import { useAuthStore } from "../../stores/auth-store";
import { useReminderStore } from "../../stores/reminder-store";

describe("useHydrated", () => {
  it("is false until both stores have hydrated", () => {
    useAuthStore.setState({ hasHydrated: true });
    useReminderStore.setState({ hasHydrated: false });

    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(false);
  });

  it("is true only when both stores report hasHydrated", () => {
    useAuthStore.setState({ hasHydrated: true });
    useReminderStore.setState({ hasHydrated: true });

    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });
});
