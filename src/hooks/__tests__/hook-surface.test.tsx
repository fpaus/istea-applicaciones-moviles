import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";
import { Task } from "../../types";
import { useActiveTasks } from "../useActiveTasks";
import { useCompletedTasks } from "../useCompletedTasks";
import { useProject } from "../useProject";
import { useTaskActions } from "../useTaskActions";

const activeTask: Task = {
  id: "1",
  title: "Active",
  description: "",
  notification: {
    time: { hour: 8, minute: 0 },
    repeats: false,
    notificationId: "n1",
  },
  completed: false,
  createdAt: 0,
};
const doneTask: Task = {
  ...activeTask,
  id: "2",
  title: "Done",
  notification: null,
  completed: true,
  createdAt: 0,
};

describe("useProject selector", () => {
  it("exposes the expected shape and derives isProjectSelected from the store", () => {
    useProjectStore.setState({
      currentProject: { id: "p1", name: "My Project" },
      projects: [{ id: "p1", name: "My Project" }],
      hasHydrated: true,
    });

    const { result } = renderHook(() => useProject());

    expect(result.current.currentProject?.name).toBe("My Project");
    expect(result.current.isProjectSelected).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.projects).toHaveLength(1);
    expect(typeof result.current.selectProject).toBe("function");
    expect(typeof result.current.createProject).toBe("function");
  });

  it("reports not selected when there is no active project", () => {
    useProjectStore.setState({ currentProject: null, hasHydrated: true });
    const { result } = renderHook(() => useProject());
    expect(result.current.isProjectSelected).toBe(false);
  });

  it("createProject updates store list and automatically selects the project", async () => {
    useProjectStore.setState({
      currentProject: null,
      projects: [],
      hasHydrated: true,
    });

    const { result } = renderHook(() => useProject());

    await act(async () => {
      await result.current.createProject("New Proj");
    });

    expect(useProjectStore.getState().projects).toHaveLength(1);
    expect(useProjectStore.getState().currentProject?.name).toBe("New Proj");
    expect(result.current.currentProject?.name).toBe("New Proj");
    expect(result.current.isProjectSelected).toBe(true);
  });
});

describe("useActiveTasks & useCompletedTasks", () => {
  it("exposes active and completed tasks directly for the current project", () => {
    useProjectStore.setState({
      currentProject: { id: "p1", name: "My Project" },
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {
        p1: [activeTask, doneTask],
      },
      hasHydrated: true,
    });

    const activeRes = renderHook(() => useActiveTasks());
    const completedRes = renderHook(() => useCompletedTasks());

    expect(activeRes.result.current.map((t) => t.id)).toEqual(["1"]);
    expect(completedRes.result.current.map((t) => t.id)).toEqual(["2"]);
  });

  it("handles empty/null currentProject fallbacks gracefully", () => {
    useProjectStore.setState({
      currentProject: null,
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {},
      hasHydrated: true,
    });

    const activeRes = renderHook(() => useActiveTasks());
    const completedRes = renderHook(() => useCompletedTasks());

    expect(activeRes.result.current).toEqual([]);
    expect(completedRes.result.current).toEqual([]);
  });
});

describe("useTaskActions", () => {
  it("calls store actions with active project parameters", async () => {
    useProjectStore.setState({
      currentProject: { id: "p1", name: "My Project" },
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {},
      hasHydrated: true,
    });

    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, message, buttons) => {
        const confirmBtn = buttons?.find(
          (b) => b.text === "Eliminar" || b.style === "destructive",
        );
        if (confirmBtn && confirmBtn.onPress) {
          confirmBtn.onPress();
        }
      });

    const { result } = renderHook(() => useTaskActions());

    // 1. addTask
    await act(async () => {
      await result.current.addTask({
        title: "Task 1",
        description: "Desc",
        notification: {
          time: { hour: 10, minute: 0 },
          repeats: false,
          notificationId: null,
        },
      });
    });
    expect(useTaskStore.getState().tasks["p1"]).toHaveLength(1);
    const taskId = useTaskStore.getState().tasks["p1"][0].id;

    // 2. markCompleted
    await act(async () => {
      await result.current.markCompleted(taskId);
    });
    expect(useTaskStore.getState().tasks["p1"][0].completed).toBe(true);

    // 3. deleteTask
    await act(async () => {
      await result.current.deleteTask(taskId);
    });
    expect(useTaskStore.getState().tasks["p1"]).toHaveLength(0);

    // 4. clearAll
    await act(async () => {
      await result.current.addTask({
        title: "Task 2",
        description: "",
        notification: {
          time: { hour: 11, minute: 0 },
          repeats: true,
          notificationId: null,
        },
      });
    });
    await act(async () => {
      await result.current.clearAll();
    });
    expect(alertSpy).toHaveBeenCalled();
    expect(useTaskStore.getState().tasks["p1"]).toHaveLength(0);

    alertSpy.mockRestore();
  });

  it("clearAll does nothing when currentProject is null", async () => {
    useProjectStore.setState({
      currentProject: null,
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {},
      hasHydrated: true,
    });

    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useTaskActions());

    await act(async () => {
      await result.current.clearAll();
    });

    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("deleteTask does nothing when currentProject is null", async () => {
    useProjectStore.setState({
      currentProject: null,
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {},
      hasHydrated: true,
    });

    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useTaskActions());

    await act(async () => {
      await result.current.deleteTask("some-id");
    });

    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
