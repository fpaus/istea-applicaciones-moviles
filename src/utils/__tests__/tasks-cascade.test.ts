import { Task } from "../../types";
import { descendants, ancestors, completeTask, reopenTask } from "../tasks-cascade";

const mockTasks: Task[] = [
  { id: "root-1", title: "Root 1", description: "", completed: false, createdAt: 1, parentId: null },
  { id: "child-1", title: "Child 1", description: "", completed: false, createdAt: 2, parentId: "root-1" },
  { id: "child-2", title: "Child 2", description: "", completed: false, createdAt: 3, parentId: "root-1" },
  { id: "grandchild-1", title: "Grandchild 1", description: "", completed: false, createdAt: 4, parentId: "child-1" },
  { id: "root-2", title: "Root 2", description: "", completed: false, createdAt: 5, parentId: null },
];

describe("pure cascade engine helpers", () => {
  describe("descendants", () => {
    it("returns all descendants recursively", () => {
      const desc = descendants(mockTasks, "root-1");
      const ids = desc.map((t) => t.id).sort();
      expect(ids).toEqual(["child-1", "child-2", "grandchild-1"]);
    });

    it("returns empty array for leaf nodes", () => {
      const desc = descendants(mockTasks, "grandchild-1");
      expect(desc).toEqual([]);
    });
  });

  describe("ancestors", () => {
    it("returns ancestors up to root in order (closest first)", () => {
      const anc = ancestors(mockTasks, "grandchild-1");
      expect(anc.map((t) => t.id)).toEqual(["child-1", "root-1"]);
    });

    it("returns empty array for root nodes", () => {
      const anc = ancestors(mockTasks, "root-1");
      expect(anc).toEqual([]);
    });

    it("stops searching if parent is not found (orphan reference)", () => {
      const tasksWithOrphan: Task[] = [
        { id: "orphan-child", title: "Orphan Child", description: "", completed: false, createdAt: 1, parentId: "non-existent-parent" },
      ];
      const anc = ancestors(tasksWithOrphan, "orphan-child");
      expect(anc).toEqual([]);
    });
  });

  describe("completeTask", () => {
    it("completes the node and all its descendants and nulls notificationId", () => {
      const tasksWithReminders: Task[] = [
        ...mockTasks,
        {
          id: "root-rem",
          title: "Root rem",
          description: "",
          completed: false,
          createdAt: 6,
          parentId: null,
          notification: { time: { hour: 9, minute: 0 }, repeats: false, notificationId: "notif-x" },
        },
        {
          id: "child-rem",
          title: "Child rem",
          description: "",
          completed: false,
          createdAt: 7,
          parentId: "root-rem",
          notification: { time: { hour: 10, minute: 0 }, repeats: true, notificationId: "notif-y" },
        },
      ];

      const updated = completeTask(tasksWithReminders, "root-rem");
      const rootRem = updated.find((t) => t.id === "root-rem");
      const childRem = updated.find((t) => t.id === "child-rem");
      const root2 = updated.find((t) => t.id === "root-2");

      expect(rootRem?.completed).toBe(true);
      expect(rootRem?.notification?.notificationId).toBeNull();
      expect(childRem?.completed).toBe(true);
      expect(childRem?.notification?.notificationId).toBeNull();
      expect(root2?.completed).toBe(false);
    });
  });

  describe("reopenTask", () => {
    it("re-opens the node and all its ancestors", () => {
      const completedTasks: Task[] = mockTasks.map((t) => ({ ...t, completed: true }));
      const updated = reopenTask(completedTasks, "grandchild-1");

      const grandchild = updated.find((t) => t.id === "grandchild-1");
      const child1 = updated.find((t) => t.id === "child-1");
      const root1 = updated.find((t) => t.id === "root-1");
      const child2 = updated.find((t) => t.id === "child-2");

      expect(grandchild?.completed).toBe(false);
      expect(child1?.completed).toBe(false);
      expect(root1?.completed).toBe(false);
      expect(child2?.completed).toBe(true);
    });
  });
});
