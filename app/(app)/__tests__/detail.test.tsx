import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useProjectStore } from "@/src/stores/project-store";
import { useTaskStore } from "@/src/stores/task-store";
import { Task } from "@/src/types";
import DetailScreen from "../detail";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ projectId: "p1", taskId: "t1" }),
}));

const makeTask = (over: Partial<Task> & { id: string }): Task => ({
  title: `Task ${over.id}`,
  description: "",
  notification: null,
  completed: false,
  createdAt: 0,
  parentId: null,
  ...over,
});

describe("DetailScreen subtask completion", () => {
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
          makeTask({ id: "t1", title: "Parent" }),
          makeTask({ id: "c1", title: "Subtarea 1", parentId: "t1" }),
          makeTask({ id: "c2", title: "Subtarea 2", parentId: "t1" }),
        ],
      },
      hasHydrated: true,
    });
  });

  it("renders a completion toggle for each subtask", () => {
    const { getByTestId } = render(<DetailScreen />);
    expect(getByTestId("subtask-toggle-c1")).toBeTruthy();
    expect(getByTestId("subtask-toggle-c2")).toBeTruthy();
  });

  it("marks a subtask completed when its toggle is switched on", async () => {
    const { getByTestId } = render(<DetailScreen />);

    fireEvent(getByTestId("subtask-toggle-c1"), "valueChange", true);

    await waitFor(() => {
      const c1 = useTaskStore.getState().tasks.p1.find((t) => t.id === "c1");
      expect(c1?.completed).toBe(true);
    });
  });
});
