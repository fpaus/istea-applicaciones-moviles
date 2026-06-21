import { act, renderHook } from "@testing-library/react-native";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";
import { useEditTaskForm } from "../useEditTaskForm";
import { imagePickerService } from "../../services/image-picker";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock("../../services/image-picker", () => ({
  imagePickerService: { pickFromLibrary: jest.fn() },
}));

const mockPick = imagePickerService.pickFromLibrary as jest.Mock;

describe("useEditTaskForm", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPick.mockReset();
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

  it("returns early if oldTask is not found", async () => {
    const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
    const { result } = renderHook(() => useEditTaskForm("p1", "non-existent"));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    updateTaskSpy.mockRestore();
  });

  it("returns early if validation checks fail during save call", async () => {
    const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
    const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

    // Force invalid title
    act(() => {
      result.current.setTitle("");
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();

    // Reset title, force invalid reminder time
    act(() => {
      result.current.setTitle("Valid Title");
      result.current.setHasReminder(true);
      result.current.setHour(null);
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();

    updateTaskSpy.mockRestore();
  });

  it("updates description and ignores no-reminder when it was already none", async () => {
    // Task with no reminder
    useTaskStore.setState({
      tasks: {
        p1: [
          {
            id: "t3",
            title: "Task 3",
            description: "Old description",
            notification: null,
            completed: false,
            createdAt: 100,
          },
        ],
      },
    });

    const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
    const { result } = renderHook(() => useEditTaskForm("p1", "t3"));

    act(() => {
      result.current.setDescription("New description");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    // Check that we only patched description (no notification: null since it was already null)
    expect(updateTaskSpy).toHaveBeenCalledWith(
      "p1",
      "t3",
      {
        description: "New description",
      },
      "Work"
    );
    expect(mockBack).toHaveBeenCalledTimes(1);
    updateTaskSpy.mockRestore();
  });

  describe("image attachment", () => {
    beforeEach(() => {
      useTaskStore.setState({
        tasks: {
          p1: [
            {
              id: "t1",
              title: "Task 1",
              description: "Old description",
              notification: null,
              completed: false,
              createdAt: 100,
              imageUri: "file:///existing.jpg",
            },
          ],
        },
        hasHydrated: true,
      });
    });

    it("pre-fills imageUri from the existing task", () => {
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));
      expect(result.current.imageUri).toBe("file:///existing.jpg");
    });

    it("pickImage replaces the image and save patches the new imageUri", async () => {
      mockPick.mockResolvedValue("file:///new.jpg");
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      await act(async () => {
        await result.current.pickImage();
      });
      expect(result.current.imageUri).toBe("file:///new.jpg");

      await act(async () => {
        await result.current.handleSave();
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(
        "p1",
        "t1",
        { imageUri: "file:///new.jpg" },
        "Work",
      );
      updateTaskSpy.mockRestore();
    });

    it("removeImage clears the image and save patches imageUri: null", async () => {
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      act(() => {
        result.current.removeImage();
      });
      expect(result.current.imageUri).toBeNull();

      await act(async () => {
        await result.current.handleSave();
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(
        "p1",
        "t1",
        { imageUri: null },
        "Work",
      );
      updateTaskSpy.mockRestore();
    });

    it("cancel/denial leaves the existing image unchanged and does not patch it", async () => {
      mockPick.mockResolvedValue(null);
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      await act(async () => {
        await result.current.pickImage();
      });
      expect(result.current.imageUri).toBe("file:///existing.jpg");

      await act(async () => {
        await result.current.handleSave();
      });

      // Nothing changed at all → updateTask not called.
      expect(updateTaskSpy).not.toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalledTimes(1);
      updateTaskSpy.mockRestore();
    });
  });
});
