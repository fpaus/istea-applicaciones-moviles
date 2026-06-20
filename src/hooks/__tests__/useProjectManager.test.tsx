import { act, renderHook } from "@testing-library/react-native";
import { useProjectManager } from "../useProjectManager";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";

describe("useProjectManager", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: { id: "p1", name: "Trabajo" },
      projects: [
        { id: "p1", name: "Trabajo" },
        { id: "p2", name: "Personal" },
      ],
      hasHydrated: true,
    });
    useTaskStore.setState({ tasks: {}, hasHydrated: true });
  });

  it("enters and exits edit mode", () => {
    const { result } = renderHook(() => useProjectManager());

    expect(result.current.editingId).toBeNull();

    act(() => result.current.startEdit("p1", "Trabajo"));
    expect(result.current.editingId).toBe("p1");
    expect(result.current.editingName).toBe("Trabajo");

    act(() => result.current.cancelEdit());
    expect(result.current.editingId).toBeNull();
  });

  it("submitEdit renames the project and exits edit mode", async () => {
    const { result } = renderHook(() => useProjectManager());

    act(() => result.current.startEdit("p1", "Trabajo"));
    act(() => result.current.changeEditName("Proyecto X"));
    await act(async () => {
      await result.current.submitEdit();
    });

    expect(useProjectStore.getState().projects[0].name).toBe("Proyecto X");
    expect(result.current.editingId).toBeNull();
  });

  it("submitEdit surfaces a Spanish error on duplicate name and stays in edit mode", async () => {
    const { result } = renderHook(() => useProjectManager());

    act(() => result.current.startEdit("p1", "Trabajo"));
    act(() => result.current.changeEditName("personal"));
    await act(async () => {
      await result.current.submitEdit();
    });

    expect(result.current.error).toMatch(/ya existe/i);
    expect(result.current.editingId).toBe("p1");
    expect(useProjectStore.getState().projects[0].name).toBe("Trabajo");
  });

  it("submitEdit rejects an empty name", async () => {
    const { result } = renderHook(() => useProjectManager());

    act(() => result.current.startEdit("p1", "Trabajo"));
    act(() => result.current.changeEditName("   "));
    await act(async () => {
      await result.current.submitEdit();
    });

    expect(result.current.error).toMatch(/requerido/i);
    expect(result.current.editingId).toBe("p1");
  });

  it("submitEdit returns early if editingId is null", async () => {
    const { result } = renderHook(() => useProjectManager());

    await act(async () => {
      await result.current.submitEdit();
    });

    expect(result.current.error).toBe("");
  });

  it("submitEdit handles generic error when rename fails", async () => {
    const { result } = renderHook(() => useProjectManager());

    // Mock renameProject to throw a generic error
    const renameProjectSpy = jest.spyOn(useProjectStore.getState(), "renameProject").mockRejectedValue(new Error("Generic DB error"));

    act(() => result.current.startEdit("p1", "Trabajo"));
    act(() => result.current.changeEditName("Proyecto Fallido"));
    await act(async () => {
      await result.current.submitEdit();
    });

    expect(result.current.error).toBe("Generic DB error");
    expect(result.current.editingId).toBe("p1");

    renameProjectSpy.mockRestore();
  });
});
