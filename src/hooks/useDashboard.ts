import { useActiveTasks } from "./useActiveTasks";
import { useCompletedTasks } from "./useCompletedTasks";
import { useNotificationPermission } from "./useNotificationPermission";
import { useProject } from "./useProject";
import { useTaskActions } from "./useTaskActions";

/**
 * View-model for the dashboard screen: composes the project, task and
 * permission hooks so the screen consumes a single custom hook and stays
 * presentational (no primitive hooks, no logic).
 */
export function useDashboard() {
  const { isProjectSelected, currentProject } = useProject();
  const activeTasks = useActiveTasks();
  const completedTasks = useCompletedTasks();
  const { markCompleted, deleteTask } = useTaskActions();
  const { hasPermission, requestPermission } = useNotificationPermission();

  return {
    isProjectSelected,
    projectId: currentProject?.id || "",
    activeTasks,
    completedTasks,
    markCompleted,
    deleteTask,
    hasPermission,
    requestPermission,
  };
}
