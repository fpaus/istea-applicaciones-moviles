import { renderHook } from "@testing-library/react-native";
import { useHydrated } from "../useHydrated";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";

describe("useHydrated", () => {
  it("is false until both stores have hydrated", () => {
    useProjectStore.setState({ hasHydrated: true });
    useTaskStore.setState({ hasHydrated: false });

    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(false);
  });

  it("is true only when both stores report hasHydrated", () => {
    useProjectStore.setState({ hasHydrated: true });
    useTaskStore.setState({ hasHydrated: true });

    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });
});
