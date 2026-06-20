import { renderHook } from "@testing-library/react-native";
import { useDashboard } from "../useDashboard";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";

describe("useDashboard hook stability", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: null,
      projects: [],
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {},
      hasHydrated: true,
    });
  });

  it("does not throw getSnapshot caching loop error and keeps function references stable", () => {
    const { result, rerender } = renderHook(() => useDashboard());
    
    const firstCallback = result.current.getDirectChildrenProgress;
    
    // Rerender to verify stability
    rerender(undefined);
    
    const secondCallback = result.current.getDirectChildrenProgress;
    expect(firstCallback).toBe(secondCallback);
  });
});
