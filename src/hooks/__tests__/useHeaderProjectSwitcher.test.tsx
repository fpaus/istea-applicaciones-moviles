import { act, renderHook } from "@testing-library/react-native";
import { useHeaderProjectSwitcher } from "../useHeaderProjectSwitcher";
import { useProjectStore } from "../../stores/project-store";

describe("useHeaderProjectSwitcher", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: { id: "p1", name: "Trabajo" },
      projects: [
        { id: "p1", name: "Trabajo" },
        { id: "p2", name: "Casa" },
      ],
      hasHydrated: true,
    });
  });

  it("exposes the active project name", () => {
    const { result } = renderHook(() => useHeaderProjectSwitcher());

    expect(result.current.projectName).toBe("Trabajo");
  });

  it("starts closed and toggles open/close", () => {
    const { result } = renderHook(() => useHeaderProjectSwitcher());

    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("selecting a project activates it and closes the switcher", async () => {
    const { result } = renderHook(() => useHeaderProjectSwitcher());

    act(() => result.current.open());

    await act(async () => {
      await result.current.handleSelect("p2");
    });

    expect(useProjectStore.getState().currentProject?.id).toBe("p2");
    expect(result.current.projectName).toBe("Casa");
    expect(result.current.isOpen).toBe(false);
  });

  it("exposes the project list for the picker", () => {
    const { result } = renderHook(() => useHeaderProjectSwitcher());

    expect(result.current.projects).toHaveLength(2);
  });

  it("supports creating a project from the picker", async () => {
    const { result } = renderHook(() => useHeaderProjectSwitcher());

    act(() => result.current.startCreating());
    expect(result.current.isCreating).toBe(true);

    act(() => result.current.changeName("Estudio"));

    await act(async () => {
      await result.current.handleCreate();
    });

    const state = useProjectStore.getState();
    expect(state.projects.map((p) => p.name)).toContain("Estudio");
    expect(state.currentProject?.name).toBe("Estudio");
    expect(result.current.isCreating).toBe(false);
  });

  it("closing the picker also cancels an in-progress create", () => {
    const { result } = renderHook(() => useHeaderProjectSwitcher());

    act(() => result.current.open());
    act(() => result.current.startCreating());
    act(() => result.current.changeName("Temporal"));

    act(() => result.current.close());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.newProjectName).toBe("");
  });

  it("closing the picker also cancels an in-progress rename", () => {
    const { result } = renderHook(() => useHeaderProjectSwitcher());

    act(() => result.current.open());
    act(() => result.current.manage.startEdit("p1", "Trabajo"));
    expect(result.current.manage.editingId).toBe("p1");

    act(() => result.current.close());

    expect(result.current.manage.editingId).toBeNull();
  });

  it("selecting a project also cancels an in-progress rename", async () => {
    const { result } = renderHook(() => useHeaderProjectSwitcher());

    act(() => result.current.open());
    act(() => result.current.manage.startEdit("p2", "Casa"));

    await act(async () => {
      await result.current.handleSelect("p1");
    });

    expect(result.current.manage.editingId).toBeNull();
  });
});
