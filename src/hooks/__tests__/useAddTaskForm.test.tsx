import { act, renderHook } from "@testing-library/react-native";
import { useAddTaskForm } from "../useAddTaskForm";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));

describe("useAddTaskForm", () => {
  beforeEach(() => {
    mockBack.mockClear();
    useProjectStore.setState({
      currentProject: { id: "p1", name: "Work" },
      projects: [{ id: "p1", name: "Work" }],
      hasHydrated: true,
    });
    useTaskStore.setState({ tasks: {}, hasHydrated: true });
  });

  it("is invalid until title, hour and minute are set", () => {
    const { result } = renderHook(() => useAddTaskForm());

    expect(result.current.isFormValid).toBe(false);

    act(() => {
      result.current.setTitle("Read");
      result.current.setHour(9);
      result.current.setMinute(0);
    });

    expect(result.current.isFormValid).toBe(true);
  });

  it("saves the task, resets the form and navigates back", async () => {
    const { result } = renderHook(() => useAddTaskForm());

    act(() => {
      result.current.setTitle("Read");
      result.current.setHour(9);
      result.current.setMinute(30);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    const tasks = useTaskStore.getState().tasks["p1"];
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Read");
    expect(result.current.title).toBe("");
    expect(result.current.hour).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("does not save or navigate when the form is invalid", async () => {
    const { result } = renderHook(() => useAddTaskForm());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(useTaskStore.getState().tasks["p1"]).toBeUndefined();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
