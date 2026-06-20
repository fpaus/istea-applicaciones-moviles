import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useTaskCompletion } from "../useTaskCompletion";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";
import { Task } from "../../types";

const parentTask: Task = {
  id: "parent-id",
  title: "Parent task",
  description: "",
  completed: false,
  createdAt: 1,
  parentId: null,
};

const childTask: Task = {
  id: "child-id",
  title: "Child task",
  description: "",
  completed: false,
  createdAt: 2,
  parentId: "parent-id",
};

describe("useTaskCompletion hook", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: { id: "p1", name: "My Project" },
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {
        p1: [parentTask, childTask],
      },
      hasHydrated: true,
    });
  });

  it("completing a task with no open descendants runs directly without alert", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");

    const standaloneTask: Task = {
      id: "standalone-id",
      title: "Standalone task",
      description: "",
      completed: false,
      createdAt: 3,
      parentId: null,
    };
    useTaskStore.setState({
      tasks: {
        p1: [parentTask, childTask, standaloneTask],
      },
    });

    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.completeTask("standalone-id");
    });

    expect(alertSpy).not.toHaveBeenCalled();
    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "standalone-id")?.completed).toBe(true);

    alertSpy.mockRestore();
  });

  it("completing a task with open descendants prompts to cascade, cancelling does nothing", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, msg, buttons) => {
      // Find Cancel button and press it
      const cancelBtn = buttons?.find((b) => b.text === "Cancelar" || b.style === "cancel");
      if (cancelBtn && cancelBtn.onPress) {
        cancelBtn.onPress();
      }
    });

    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.completeTask("parent-id");
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Completar tarea",
      "Esta tarea tiene subtareas incompletas. ¿Deseas completarlas todas?",
      expect.any(Array)
    );

    // Cancel means no completion happens
    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "parent-id")?.completed).toBe(false);
    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "child-id")?.completed).toBe(false);

    alertSpy.mockRestore();
  });

  it("completing a task with open descendants prompts to cascade, confirming completes all", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, msg, buttons) => {
      // Find Confirm button and press it
      const confirmBtn = buttons?.find((b) => b.text === "Completar todo" || b.style === "destructive");
      if (confirmBtn && confirmBtn.onPress) {
        confirmBtn.onPress();
      }
    });

    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.completeTask("parent-id");
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Completar tarea",
      "Esta tarea tiene subtareas incompletas. ¿Deseas completarlas todas?",
      expect.any(Array)
    );

    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "parent-id")?.completed).toBe(true);
    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "child-id")?.completed).toBe(true);

    alertSpy.mockRestore();
  });

  it("completing the last open child prompts to complete parent, confirming completes parent", async () => {
    // Child is the only subtask. So completing child prompts to complete parent.
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, msg, buttons) => {
      // Press Yes ("Sí")
      const yesBtn = buttons?.find((b) => b.text === "Sí" || b.text === "Completar");
      if (yesBtn && yesBtn.onPress) {
        yesBtn.onPress();
      }
    });

    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.completeTask("child-id");
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Completar tarea principal",
      'Has completado todas las subtareas. ¿Deseas completar también la tarea principal "Parent task"?',
      expect.any(Array)
    );

    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "child-id")?.completed).toBe(true);
    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "parent-id")?.completed).toBe(true);

    alertSpy.mockRestore();
  });

  it("handles reopening tasks via reopenTask", async () => {
    const reopenSpy = jest.spyOn(useTaskStore.getState(), "reopenTask").mockResolvedValue();
    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.reopenTask("child-id");
    });

    expect(reopenSpy).toHaveBeenCalledWith("p1", "child-id", "My Project");
    reopenSpy.mockRestore();
  });

  it("logs error if markCompleted fails when completing cascade", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, msg, buttons) => {
      const confirmBtn = buttons?.find((b) => b.text === "Completar todo" || b.style === "destructive");
      if (confirmBtn && confirmBtn.onPress) {
        confirmBtn.onPress();
      }
    });

    // Make markCompleted fail
    const originalMarkCompleted = useTaskStore.getState().markCompleted;
    useTaskStore.setState({
      markCompleted: jest.fn().mockRejectedValue(new Error("Database write failed")),
    });

    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.completeTask("parent-id");
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "[useTaskCompletion] Failed to complete tasks:",
      expect.any(Error)
    );

    // Clean up
    useTaskStore.setState({ markCompleted: originalMarkCompleted });
    errorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("logs error if markCompleted fails when cascading to parent", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, msg, buttons) => {
      const yesBtn = buttons?.find((b) => b.text === "Sí" || b.text === "Completar");
      if (yesBtn && yesBtn.onPress) {
        yesBtn.onPress();
      }
    });

    // We want the initial markCompleted (for child) to succeed, but the subsequent cascade (for parent) to fail.
    const originalMarkCompleted = useTaskStore.getState().markCompleted;
    let callCount = 0;
    useTaskStore.setState({
      markCompleted: jest.fn().mockImplementation(async (projId, taskId) => {
        callCount++;
        if (callCount === 1) {
          // Success for first (child-id), mock the state update to show child completed
          const currentTasks = useTaskStore.getState().tasks[projId] || [];
          useTaskStore.setState({
            tasks: {
              [projId]: currentTasks.map(t => t.id === taskId ? { ...t, completed: true } : t)
            }
          });
          return;
        }
        // Failure for parent-id
        throw new Error("Parent cascade failed");
      }),
    });

    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.completeTask("child-id");
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "[useTaskCompletion] Failed to cascade complete parent:",
      expect.any(Error)
    );

    // Clean up
    useTaskStore.setState({ markCompleted: originalMarkCompleted });
    errorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("handles null currentProject and empty task list fallbacks gracefully", async () => {
    useProjectStore.setState({
      currentProject: null,
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {},
      hasHydrated: true,
    });

    const { result } = renderHook(() => useTaskCompletion());

    // Call completeTask on non-existent task, should return early
    await act(async () => {
      await result.current.completeTask("any-id");
    });
  });

  it("does not prompt to complete parent if parent is already completed", async () => {
    // Make parent task already completed
    const completedParent: Task = { ...parentTask, completed: true };
    const incompleteChild: Task = { ...childTask, completed: false };

    useTaskStore.setState({
      tasks: {
        p1: [completedParent, incompleteChild],
      },
    });

    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.completeTask("child-id");
    });

    expect(alertSpy).not.toHaveBeenCalled();
    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "child-id")?.completed).toBe(true);
    alertSpy.mockRestore();
  });

  it("does not prompt to complete parent if there are other incomplete siblings", async () => {
    const anotherChild: Task = {
      id: "child-2",
      title: "Child 2",
      description: "",
      completed: false,
      createdAt: 3,
      parentId: "parent-id",
    };

    useTaskStore.setState({
      tasks: {
        p1: [parentTask, childTask, anotherChild],
      },
    });

    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useTaskCompletion());

    await act(async () => {
      await result.current.completeTask("child-id");
    });

    // child-id completed, child-2 remains open, parent remains open. No prompt should show.
    expect(alertSpy).not.toHaveBeenCalled();
    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "child-id")?.completed).toBe(true);
    expect(useTaskStore.getState().tasks["p1"].find((t) => t.id === "parent-id")?.completed).toBe(false);
    alertSpy.mockRestore();
  });
});
