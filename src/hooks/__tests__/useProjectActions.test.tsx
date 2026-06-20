import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useProjectActions } from "../useProjectActions";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";

describe("useProjectActions", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useProjectStore.setState({
      currentProject: { id: "p1", name: "Trabajo" },
      projects: [{ id: "p1", name: "Trabajo" }],
      hasHydrated: true,
    });
    // Seed here (before any spyOn) — calling setState AFTER spying swaps
    // zustand's state object and defeats restoreAllMocks, leaking spies.
    useTaskStore.setState({
      tasks: {
        p1: [
          {
            id: "t1",
            title: "x",
            description: "",
            time: { hour: 1, minute: 0 },
            repeats: false,
            notificationId: null,
            completed: false,
            createdAt: 0,
          },
        ],
      },
      hasHydrated: true,
    });
  });

  it("deleteProject confirms first, then cascades removeProjectTasks before deleteProject", async () => {
    const order: string[] = [];
    jest
      .spyOn(useTaskStore.getState(), "removeProjectTasks")
      .mockImplementation(async () => {
        order.push("removeTasks");
      });
    jest
      .spyOn(useProjectStore.getState(), "deleteProject")
      .mockImplementation(async () => {
        order.push("deleteProject");
      });
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useProjectActions());
    act(() => {
      result.current.deleteProject("p1", "Trabajo");
    });

    // Confirmation surfaced; nothing happens until the user confirms.
    expect(alertSpy).toHaveBeenCalledTimes(1);
    // The dialog names the project and warns about its tasks.
    const message = `${alertSpy.mock.calls[0][0]} ${alertSpy.mock.calls[0][1]}`;
    expect(message).toContain("Trabajo");
    expect(message).toMatch(/1 tarea/i);
    expect(order).toEqual([]);

    const buttons = alertSpy.mock.calls[0][2]!;
    const confirm = buttons.find((b) => b.style === "destructive")!;
    await act(async () => {
      await confirm.onPress!();
    });

    expect(order).toEqual(["removeTasks", "deleteProject"]);
  });

  it("deleteProject does nothing when the user cancels", () => {
    const removeSpy = jest.spyOn(useTaskStore.getState(), "removeProjectTasks");
    const deleteSpy = jest.spyOn(useProjectStore.getState(), "deleteProject");
    const alertSpy = jest.spyOn(Alert, "alert");

    const { result } = renderHook(() => useProjectActions());
    act(() => {
      result.current.deleteProject("p1", "Trabajo");
    });

    const buttons = alertSpy.mock.calls[0][2]!;
    const cancel = buttons.find((b) => b.style === "cancel")!;
    act(() => {
      cancel.onPress?.();
    });

    expect(removeSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("renameProject delegates to the project store", async () => {
    const renameSpy = jest
      .spyOn(useProjectStore.getState(), "renameProject")
      .mockResolvedValue();

    const { result } = renderHook(() => useProjectActions());
    await act(async () => {
      await result.current.renameProject("p1", "Personal");
    });

    expect(renameSpy).toHaveBeenCalledWith("p1", "Personal");
  });
});
