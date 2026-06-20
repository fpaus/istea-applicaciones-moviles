import { act, renderHook } from "@testing-library/react-native";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";
import { useEditTaskForm } from "../useEditTaskForm";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));

describe("useEditTaskForm", () => {
  beforeEach(() => {
    mockBack.mockClear();
    useProjectStore.setState({
      currentProject: { id: "p1", name: "Work" },
      projects: [{ id: "p1", name: "Work" }],
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {
        p1: [
          {
            id: "t1",
            title: "Task 1",
            description: "Old description",
            notification: {
              time: { hour: 9, minute: 0 },
              repeats: true,
              notificationId: "notif-1",
            },
            completed: false,
            createdAt: 100,
          },
        ],
      },
      hasHydrated: true,
    });
  });

  it("pre-fills fields and hasReminder from an existing task", () => {
    const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

    expect(result.current.title).toBe("Task 1");
    expect(result.current.description).toBe("Old description");
    expect(result.current.hasReminder).toBe(true);
    expect(result.current.hour).toBe(9);
    expect(result.current.minute).toBe(0);
    expect(result.current.repeats).toBe(true);
    expect(result.current.isFormValid).toBe(true);
  });

  it("validation: title required, and hour/minute required when hasReminder is true", () => {
    const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

    act(() => {
      result.current.setTitle("");
    });
    expect(result.current.isFormValid).toBe(false);

    act(() => {
      result.current.setTitle("New title");
    });
    expect(result.current.isFormValid).toBe(true);

    act(() => {
      result.current.setHasReminder(true);
      result.current.setHour(null);
    });
    expect(result.current.isFormValid).toBe(false);

    act(() => {
      result.current.setHour(10);
    });
    expect(result.current.isFormValid).toBe(true);
  });

  it("saving calls updateTask with the diffed patch and navigates back", async () => {
    const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
    const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

    act(() => {
      result.current.setTitle("Task 1 Edited");
      result.current.setHour(10); // Changed from 9 to 10
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateTaskSpy).toHaveBeenCalledWith(
      "p1",
      "t1",
      {
        title: "Task 1 Edited",
        notification: {
          time: { hour: 10, minute: 0 },
          repeats: true,
          notificationId: "notif-1",
        },
      },
      "Work",
    );
    expect(mockBack).toHaveBeenCalledTimes(1);
    updateTaskSpy.mockRestore();
  });

  it("adds a reminder to a task that had none (none -> set)", async () => {
    useTaskStore.setState({
      tasks: {
        p1: [
          {
            id: "t2",
            title: "Task 2",
            description: "",
            notification: null,
            completed: false,
            createdAt: 100,
          },
        ],
      },
    });

    const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
    const { result } = renderHook(() => useEditTaskForm("p1", "t2"));

    act(() => {
      result.current.setHasReminder(true);
      result.current.setHour(18);
      result.current.setMinute(30);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateTaskSpy).toHaveBeenCalledWith(
      "p1",
      "t2",
      {
        notification: {
          time: { hour: 18, minute: 30 },
          repeats: false,
          notificationId: null,
        },
      },
      "Work",
    );
    expect(mockBack).toHaveBeenCalledTimes(1);
    updateTaskSpy.mockRestore();
  });

  it("removes a reminder from a task that had one (set -> none)", async () => {
    const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
    const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

    act(() => {
      result.current.setHasReminder(false);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateTaskSpy).toHaveBeenCalledWith(
      "p1",
      "t1",
      {
        notification: null,
      },
      "Work",
    );
    expect(mockBack).toHaveBeenCalledTimes(1);
    updateTaskSpy.mockRestore();
  });

  it("does not call updateTask if nothing has changed", async () => {
    const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
    const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
    updateTaskSpy.mockRestore();
  });
});
