import { act, renderHook } from "@testing-library/react-native";
import { useProjectStore } from "../../stores/project-store";
import { useTaskStore } from "../../stores/task-store";
import { Task } from "../../types";
import { useTaskDetail } from "../useTaskDetail";

const mockPush = jest.fn();
// Stable router reference, mirroring expo-router's memoized useRouter().
const mockRouter = { push: mockPush };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

const makeTask = (over: Partial<Task> & { id: string }): Task => ({
  title: `Task ${over.id}`,
  description: "",
  notification: null,
  completed: false,
  createdAt: 0,
  parentId: null,
  ...over,
});

describe("useTaskDetail", () => {
  beforeEach(() => {
    mockPush.mockClear();
    useProjectStore.setState({
      currentProject: { id: "p1", name: "Work" },
      projects: [{ id: "p1", name: "Work" }],
      hasHydrated: true,
    });
    useTaskStore.setState({
      tasks: {
        p1: [
          makeTask({ id: "t1", title: "Parent", description: "Root task" }),
          makeTask({ id: "c1", parentId: "t1", completed: true }),
          makeTask({ id: "c2", parentId: "t1" }),
          makeTask({ id: "c3", parentId: "t1" }),
          makeTask({ id: "g1", parentId: "c1" }),
        ],
      },
      hasHydrated: true,
    });
  });

  it("selects a task by projectId + taskId", () => {
    const { result } = renderHook(() => useTaskDetail("p1", "t1"));
    expect(result.current.task?.id).toBe("t1");
    expect(result.current.task?.title).toBe("Parent");
    expect(result.current.notFound).toBe(false);
  });

  it("reports notFound when the task does not exist", () => {
    const { result } = renderHook(() => useTaskDetail("p1", "missing"));
    expect(result.current.task).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it("derives the direct subtasks (not deeper descendants)", () => {
    const { result } = renderHook(() => useTaskDetail("p1", "t1"));
    expect(result.current.subtasks.map((t) => t.id)).toEqual(["c1", "c2", "c3"]);
  });

  it("derives direct-children progress", () => {
    const { result } = renderHook(() => useTaskDetail("p1", "t1"));
    expect(result.current.progress).toEqual({ total: 3, completed: 1 });
  });

  it("goToEdit navigates to the edit route with params", () => {
    const { result } = renderHook(() => useTaskDetail("p1", "t1"));
    act(() => result.current.goToEdit());
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/edit",
      params: { projectId: "p1", taskId: "t1" },
    });
  });

  it("openSubtask navigates to the detail route for the subtask", () => {
    const { result } = renderHook(() => useTaskDetail("p1", "t1"));
    act(() => result.current.openSubtask("c2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/detail",
      params: { projectId: "p1", taskId: "c2" },
    });
  });

  it("keeps callback references stable across rerenders", () => {
    const { result, rerender } = renderHook(() => useTaskDetail("p1", "t1"));
    const firstOpen = result.current.openSubtask;
    rerender(undefined);
    expect(result.current.openSubtask).toBe(firstOpen);
  });
});
