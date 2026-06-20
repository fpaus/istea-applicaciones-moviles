import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useProjectSelector } from "../useProjectSelector";
import { useProjectStore } from "../../stores/project-store";

describe("useProjectSelector", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: { id: "p1", name: "Trabajo" },
      projects: [{ id: "p1", name: "Trabajo" }],
      hasHydrated: true,
    });
  });

  it("handles dropdown visibility", () => {
    const { result } = renderHook(() => useProjectSelector());

    expect(result.current.showDropdown).toBe(false);

    act(() => {
      result.current.openDropdown();
    });
    expect(result.current.showDropdown).toBe(true);

    act(() => {
      result.current.closeDropdown();
    });
    expect(result.current.showDropdown).toBe(false);
  });

  it("handles project creation flow with validation and store calling", async () => {
    const { result } = renderHook(() => useProjectSelector());

    // Initially not creating
    expect(result.current.isCreating).toBe(false);

    act(() => {
      result.current.startCreating();
    });
    expect(result.current.isCreating).toBe(true);

    // Empty validation error
    await act(async () => {
      await result.current.handleCreate();
    });
    expect(result.current.error).toBe("El nombre es requerido");

    // Success path
    act(() => {
      result.current.changeName("New Project");
    });
    expect(result.current.error).toBe("");

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(useProjectStore.getState().projects).toHaveLength(2);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.newProjectName).toBe("");
  });

  it("cancelCreating resets fields", () => {
    const { result } = renderHook(() => useProjectSelector());

    act(() => {
      result.current.startCreating();
      result.current.changeName("Unsaved Name");
    });

    act(() => {
      result.current.cancelCreating();
    });

    expect(result.current.isCreating).toBe(false);
    expect(result.current.newProjectName).toBe("");
  });

  it("handleCreate catches and displays store errors", async () => {
    const { result } = renderHook(() => useProjectSelector());

    act(() => {
      result.current.startCreating();
      result.current.changeName("trabajo"); // Duplicate project name
    });

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(result.current.error).toMatch(/already exists/i);
    expect(result.current.isCreating).toBe(true);
  });

  it("handleSelect selects a project and closes dropdown", async () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useProjectSelector(onSelect));

    act(() => {
      result.current.openDropdown();
    });

    await act(async () => {
      await result.current.handleSelect("p1");
    });

    expect(useProjectStore.getState().currentProject?.id).toBe("p1");
    expect(result.current.showDropdown).toBe(false);
    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("handleSelect displays an Alert error if selection fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const selectProjectSpy = jest
      .spyOn(useProjectStore.getState(), "selectProject")
      .mockRejectedValueOnce(new Error("Select error"));

    const { result } = renderHook(() => useProjectSelector());

    await act(async () => {
      await result.current.handleSelect("ghost-id");
    });

    expect(alertSpy).toHaveBeenCalledWith("Error", "Select error");

    alertSpy.mockRestore();
    selectProjectSpy.mockRestore();
  });
});
