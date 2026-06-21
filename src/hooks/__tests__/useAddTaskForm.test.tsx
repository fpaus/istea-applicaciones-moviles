import { act, renderHook } from "@testing-library/react-native";
import { useAddTaskForm } from "../useAddTaskForm";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";
import { imagePickerService } from "../../services/image-picker";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock("../../services/image-picker", () => ({
  imagePickerService: { pickFromLibrary: jest.fn() },
}));

const mockPick = imagePickerService.pickFromLibrary as jest.Mock;

describe("useAddTaskForm", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPick.mockReset();
    useProjectStore.setState({
      currentProject: { id: "p1", name: "Work" },
      projects: [{ id: "p1", name: "Work" }],
      hasHydrated: true,
    });
    useTaskStore.setState({ tasks: {}, hasHydrated: true });
  });

  it("is invalid until title is set; requires hour and minute only when hasReminder is true", () => {
    const { result } = renderHook(() => useAddTaskForm());

    expect(result.current.isFormValid).toBe(false);

    act(() => {
      result.current.setTitle("Read");
    });
    expect(result.current.isFormValid).toBe(true);

    act(() => {
      result.current.setHasReminder(true);
    });
    expect(result.current.isFormValid).toBe(false);

    act(() => {
      result.current.setHour(9);
      result.current.setMinute(0);
    });
    expect(result.current.isFormValid).toBe(true);
  });

  it("saves the task with a reminder, resets the form and navigates back", async () => {
    const { result } = renderHook(() => useAddTaskForm());

    act(() => {
      result.current.setTitle("Read");
      result.current.setHasReminder(true);
      result.current.setHour(9);
      result.current.setMinute(30);
      result.current.setRepeats(true);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    const tasks = useTaskStore.getState().tasks["p1"];
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Read");
    expect(tasks[0].notification?.time).toEqual({ hour: 9, minute: 30 });
    expect(tasks[0].notification?.repeats).toBe(true);
    expect(result.current.title).toBe("");
    expect(result.current.hasReminder).toBe(false);
    expect(result.current.hour).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("saves the task without a reminder, resets the form and navigates back", async () => {
    const { result } = renderHook(() => useAddTaskForm());

    act(() => {
      result.current.setTitle("Read checklist");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    const tasks = useTaskStore.getState().tasks["p1"];
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Read checklist");
    expect(tasks[0].notification).toBeNull();
    expect(result.current.title).toBe("");
    expect(result.current.hasReminder).toBe(false);
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

  it("does not save or navigate when hasReminder is true but time is missing", async () => {
    const { result } = renderHook(() => useAddTaskForm());

    act(() => {
      result.current.setTitle("Test task");
      result.current.setHasReminder(true);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(useTaskStore.getState().tasks["p1"]).toBeUndefined();
    expect(mockBack).not.toHaveBeenCalled();
  });

  describe("image attachment", () => {
    it("pickImage sets imageUri from the service and save includes it", async () => {
      mockPick.mockResolvedValue("file:///gallery/photo.jpg");
      const { result } = renderHook(() => useAddTaskForm());

      act(() => {
        result.current.setTitle("Has photo");
      });

      await act(async () => {
        await result.current.pickImage();
      });
      expect(result.current.imageUri).toBe("file:///gallery/photo.jpg");

      await act(async () => {
        await result.current.handleSave();
      });

      const tasks = useTaskStore.getState().tasks["p1"];
      expect(tasks[0].imageUri).toBe("file:///gallery/photo.jpg");
    });

    it("leaves imageUri unchanged when the picker is cancelled/denied, and still saves", async () => {
      mockPick.mockResolvedValue(null);
      const { result } = renderHook(() => useAddTaskForm());

      act(() => {
        result.current.setTitle("No photo");
      });

      await act(async () => {
        await result.current.pickImage();
      });
      expect(result.current.imageUri).toBeNull();

      await act(async () => {
        await result.current.handleSave();
      });

      const tasks = useTaskStore.getState().tasks["p1"];
      expect(tasks).toHaveLength(1);
      expect(tasks[0].imageUri).toBeNull();
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it("removeImage clears a previously picked image", async () => {
      mockPick.mockResolvedValue("file:///gallery/photo.jpg");
      const { result } = renderHook(() => useAddTaskForm());

      await act(async () => {
        await result.current.pickImage();
      });
      expect(result.current.imageUri).toBe("file:///gallery/photo.jpg");

      act(() => {
        result.current.removeImage();
      });
      expect(result.current.imageUri).toBeNull();
    });
  });
});
