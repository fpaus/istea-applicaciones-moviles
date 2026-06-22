import { act, renderHook } from "@testing-library/react-native";
import { useAddTaskForm } from "../useAddTaskForm";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";
import { imagePickerService } from "../../services/image-picker";
import { locationService } from "../../services/location";
import { contactsService } from "../../services/contacts";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock("../../services/image-picker", () => ({
  imagePickerService: { pickFromLibrary: jest.fn() },
}));
jest.mock("../../services/location", () => ({
  locationService: { getCurrentLocation: jest.fn() },
}));
jest.mock("../../services/contacts", () => ({
  contactsService: { pickResponsible: jest.fn() },
}));

const mockPick = imagePickerService.pickFromLibrary as jest.Mock;
const mockGetCurrentLocation = locationService.getCurrentLocation as jest.Mock;
const mockPickResponsible = contactsService.pickResponsible as jest.Mock;

describe("useAddTaskForm", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPick.mockReset();
    mockGetCurrentLocation.mockReset();
    mockPickResponsible.mockReset();
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

  describe("location attachment", () => {
    it("captureLocation sets location from the service and save includes it", async () => {
      const sampleLocation = {
        latitude: -34.6037,
        longitude: -58.3816,
        label: "Obelisco",
      };
      mockGetCurrentLocation.mockResolvedValue(sampleLocation);
      const { result } = renderHook(() => useAddTaskForm());

      act(() => {
        result.current.setTitle("Has location");
      });

      await act(async () => {
        await result.current.captureLocation();
      });
      expect(result.current.location).toEqual(sampleLocation);
      expect(result.current.isLocating).toBe(false);

      await act(async () => {
        await result.current.handleSave();
      });

      const tasks = useTaskStore.getState().tasks["p1"];
      expect(tasks[0].location).toEqual(sampleLocation);
    });

    it("leaves location unchanged when the service returns null, and still saves", async () => {
      mockGetCurrentLocation.mockResolvedValue(null);
      const { result } = renderHook(() => useAddTaskForm());

      act(() => {
        result.current.setTitle("No location");
      });

      await act(async () => {
        await result.current.captureLocation();
      });
      expect(result.current.location).toBeNull();

      await act(async () => {
        await result.current.handleSave();
      });

      const tasks = useTaskStore.getState().tasks["p1"];
      expect(tasks).toHaveLength(1);
      expect(tasks[0].location).toBeNull();
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it("clearLocation clears a previously captured location", async () => {
      const sampleLocation = {
        latitude: -34.6037,
        longitude: -58.3816,
        label: "Obelisco",
      };
      mockGetCurrentLocation.mockResolvedValue(sampleLocation);
      const { result } = renderHook(() => useAddTaskForm());

      await act(async () => {
        await result.current.captureLocation();
      });
      expect(result.current.location).toEqual(sampleLocation);

      act(() => {
        result.current.clearLocation();
      });
      expect(result.current.location).toBeNull();
    });
  });

  describe("responsible person", () => {
    const sampleResponsible = {
      name: "Juan Perez",
      contactId: "c-1",
      phone: "12345678",
      email: "juan@example.com",
    };

    it("pickResponsible sets responsible from the service and save includes it", async () => {
      mockPickResponsible.mockResolvedValue(sampleResponsible);
      const { result } = renderHook(() => useAddTaskForm());

      act(() => {
        result.current.setTitle("Has responsible");
      });

      await act(async () => {
        await result.current.pickResponsible();
      });
      expect(result.current.responsible).toEqual(sampleResponsible);

      await act(async () => {
        await result.current.handleSave();
      });

      const tasks = useTaskStore.getState().tasks["p1"];
      expect(tasks[0].responsible).toEqual(sampleResponsible);
    });

    it("leaves responsible unchanged when the picker returns null, and still saves", async () => {
      mockPickResponsible.mockResolvedValue(null);
      const { result } = renderHook(() => useAddTaskForm());

      act(() => {
        result.current.setTitle("No responsible");
      });

      await act(async () => {
        await result.current.pickResponsible();
      });
      expect(result.current.responsible).toBeNull();

      await act(async () => {
        await result.current.handleSave();
      });

      const tasks = useTaskStore.getState().tasks["p1"];
      expect(tasks[0].responsible).toBeNull();
    });

    it("clearResponsible clears a previously picked responsible", async () => {
      mockPickResponsible.mockResolvedValue(sampleResponsible);
      const { result } = renderHook(() => useAddTaskForm());

      await act(async () => {
        await result.current.pickResponsible();
      });
      expect(result.current.responsible).toEqual(sampleResponsible);

      act(() => {
        result.current.clearResponsible();
      });
      expect(result.current.responsible).toBeNull();
    });
  });

  describe("calendar integration", () => {
    it("calendar state defaults to false, toggles, and submits calendar object when hasReminder is true", async () => {
      const { result } = renderHook(() => useAddTaskForm());

      expect(result.current.calendar).toBe(false);

      act(() => {
        result.current.setCalendar(true);
      });
      expect(result.current.calendar).toBe(true);

      act(() => {
        result.current.setTitle("Calendar Task");
        result.current.setHasReminder(true);
        result.current.setHour(10);
        result.current.setMinute(0);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      const tasks = useTaskStore.getState().tasks["p1"];
      expect(tasks).toHaveLength(1);
      expect(tasks[0].calendar).toEqual({ eventId: expect.any(String) });
    });

    it("submits null for calendar if calendar is true but hasReminder is false", async () => {
      const { result } = renderHook(() => useAddTaskForm());

      act(() => {
        result.current.setTitle("No Reminder Task");
        result.current.setCalendar(true);
        result.current.setHasReminder(false);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      const tasks = useTaskStore.getState().tasks["p1"];
      expect(tasks).toHaveLength(1);
      expect(tasks[0].calendar).toBeNull();
    });
  });
});

