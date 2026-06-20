import { useCallback } from "react";
import { useTaskStore } from "../stores/task-store";
import { Task } from "../types";
import { useActiveTasks } from "./useActiveTasks";
import { useCompletedTasks } from "./useCompletedTasks";
import { useNotificationPermission } from "./useNotificationPermission";
import { useProject } from "./useProject";
import { useTaskActions } from "./useTaskActions";

const EMPTY_ARRAY: Task[] = [];

export interface UseDashboardResult {
  isProjectSelected: boolean;
  projectId: string;
  activeTasks: Task[];
  completedTasks: Task[];
  markCompleted: (id: string) => Promise<void>;
  deleteTask: (id: string) => void;
  hasPermission: boolean | null;
  requestPermission: () => Promise<void>;
  getDirectChildrenProgress: (parentId: string) => { total: number; completed: number };
}

/**
 * View-model for the dashboard screen: composes the project, task and
 * permission hooks so the screen consumes a single custom hook and stays
 * presentational (no primitive hooks, no logic).
 */
export function useDashboard(): UseDashboardResult {
  const { isProjectSelected, currentProject } = useProject();
  const activeTasks = useActiveTasks();
  const completedTasks = useCompletedTasks();
  const { markCompleted, deleteTask } = useTaskActions();
  const { hasPermission, requestPermission } = useNotificationPermission();

  const projectId = currentProject?.id || "";
  const allTasks = useTaskStore(
    useCallback((s) => s.tasks[projectId] ?? EMPTY_ARRAY, [projectId])
  );

  const getDirectChildrenProgress = useCallback(
    (parentId: string) => {
      const children = allTasks.filter((t) => t.parentId === parentId);
      const total = children.length;
      const completed = children.filter((t) => t.completed).length;
      return { total, completed };
    },
    [allTasks],
  );

  return {
    isProjectSelected,
    projectId,
    activeTasks,
    completedTasks,
    markCompleted,
    deleteTask,
    hasPermission,
    requestPermission,
    getDirectChildrenProgress,
  };
}
