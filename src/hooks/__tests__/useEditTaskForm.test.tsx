import { act, renderHook } from "@testing-library/react-native";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";
import { useEditTaskForm } from "../useEditTaskForm";
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

describe("useEditTaskForm", () => {
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

  describe("location attachment", () => {
    const sampleLocation = {
      latitude: -34.6037,
      longitude: -58.3816,
      label: "Obelisco",
    };

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
              location: sampleLocation,
            },
          ],
        },
        hasHydrated: true,
      });
    });

    it("pre-fills location from the existing task", () => {
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));
      expect(result.current.location).toEqual(sampleLocation);
    });

    it("captureLocation replaces the location and save patches the new location", async () => {
      const newLoc = {
        latitude: -34.521,
        longitude: -58.5,
        label: "Vicente López",
      };
      mockGetCurrentLocation.mockResolvedValue(newLoc);
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      await act(async () => {
        await result.current.captureLocation();
      });
      expect(result.current.location).toEqual(newLoc);

      await act(async () => {
        await result.current.handleSave();
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(
        "p1",
        "t1",
        { location: newLoc },
        "Work",
      );
      updateTaskSpy.mockRestore();
    });

    it("clearLocation clears the location and save patches location: null", async () => {
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      act(() => {
        result.current.clearLocation();
      });
      expect(result.current.location).toBeNull();

      await act(async () => {
        await result.current.handleSave();
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(
        "p1",
        "t1",
        { location: null },
        "Work",
      );
      updateTaskSpy.mockRestore();
    });

    it("cancel/denial leaves the existing location unchanged and does not patch it", async () => {
      mockGetCurrentLocation.mockResolvedValue(null);
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      await act(async () => {
        await result.current.captureLocation();
      });
      expect(result.current.location).toEqual(sampleLocation);

      await act(async () => {
        await result.current.handleSave();
      });

      // Nothing changed at all → updateTask not called.
      expect(updateTaskSpy).not.toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalledTimes(1);
      updateTaskSpy.mockRestore();
    });
  });

  describe("responsible person", () => {
    const sampleResponsible = {
      name: "Juan Perez",
      contactId: "c-1",
      phone: "12345678",
      email: "juan@example.com",
    };

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
              responsible: sampleResponsible,
            },
          ],
        },
        hasHydrated: true,
      });
    });

    it("pre-fills responsible from the existing task", () => {
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));
      expect(result.current.responsible).toEqual(sampleResponsible);
    });

    it("pickResponsible replaces the responsible and save patches the new responsible", async () => {
      const newResp = {
        name: "Maria Lopez",
        contactId: "c-2",
        phone: "87654321",
        email: "maria@example.com",
      };
      mockPickResponsible.mockResolvedValue(newResp);
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      await act(async () => {
        await result.current.pickResponsible();
      });
      expect(result.current.responsible).toEqual(newResp);

      await act(async () => {
        await result.current.handleSave();
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(
        "p1",
        "t1",
        { responsible: newResp },
        "Work",
      );
      updateTaskSpy.mockRestore();
    });

    it("clearResponsible clears the responsible and save patches responsible: null", async () => {
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      act(() => {
        result.current.clearResponsible();
      });
      expect(result.current.responsible).toBeNull();

      await act(async () => {
        await result.current.handleSave();
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(
        "p1",
        "t1",
        { responsible: null },
        "Work",
      );
      updateTaskSpy.mockRestore();
    });

    it("cancel/denial leaves the existing responsible unchanged and does not patch it", async () => {
      mockPickResponsible.mockResolvedValue(null);
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      await act(async () => {
        await result.current.pickResponsible();
      });
      expect(result.current.responsible).toEqual(sampleResponsible);

      await act(async () => {
        await result.current.handleSave();
      });

      // Nothing changed at all → updateTask not called.
      expect(updateTaskSpy).not.toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalledTimes(1);
      updateTaskSpy.mockRestore();
    });
  });

  describe("calendar integration", () => {
    it("initializes calendar as false if task has no calendar, toggles to true and sends calendar patch", async () => {
      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t1"));

      expect(result.current.calendar).toBe(false);

      act(() => {
        result.current.setCalendar(true);
      });
      expect(result.current.calendar).toBe(true);

      await act(async () => {
        await result.current.handleSave();
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(
        "p1",
        "t1",
        {
          calendar: { eventId: null },
        },
        "Work",
      );
      updateTaskSpy.mockRestore();
    });

    it("initializes calendar as true if task has calendar, toggles to false and sends null patch", async () => {
      useTaskStore.setState({
        tasks: {
          p1: [
            {
              id: "t_cal",
              title: "Task with Calendar",
              description: "",
              notification: {
                time: { hour: 9, minute: 0 },
                repeats: true,
                notificationId: "notif-1",
              },
              calendar: { eventId: "cal-1" },
              completed: false,
              createdAt: 100,
            },
          ],
        },
      });

      const updateTaskSpy = jest.spyOn(useTaskStore.getState(), "updateTask");
      const { result } = renderHook(() => useEditTaskForm("p1", "t_cal"));

      expect(result.current.calendar).toBe(true);

      act(() => {
        result.current.setCalendar(false);
      });
      expect(result.current.calendar).toBe(false);

      await act(async () => {
        await result.current.handleSave();
      });

      expect(updateTaskSpy).toHaveBeenCalledWith(
        "p1",
        "t_cal",
        {
          calendar: null,
        },
        "Work",
      );
      updateTaskSpy.mockRestore();
    });
  });
});

