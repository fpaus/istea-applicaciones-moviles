import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTaskStore } from "../stores/task-store";
import { Task } from "../types";

const EMPTY_ARRAY: Task[] = [];

export interface UseTaskDetailResult {
  task: Task | null;
  notFound: boolean;
  subtasks: Task[];
  progress: { total: number; completed: number };
  goToEdit: () => void;
  openSubtask: (id: string) => void;
}

/**
 * View-model for the read-only task detail screen: selects the task by id,
 * derives its direct subtasks + direct-children progress, and exposes navigation
 * to the edit screen and to a subtask's own detail. Keeps the screen
 * presentational (no primitive hooks, no logic) per the architecture rules.
 */
export function useTaskDetail(
  projectId: string,
  taskId: string,
): UseTaskDetailResult {
  const router = useRouter();

  const projectTasks = useTaskStore(
    useCallback((s) => s.tasks[projectId] ?? EMPTY_ARRAY, [projectId]),
  );

  const task = projectTasks.find((t) => t.id === taskId) ?? null;
  const subtasks = projectTasks.filter((t) => t.parentId === taskId);
  const progress = {
    total: subtasks.length,
    completed: subtasks.filter((t) => t.completed).length,
  };

  const goToEdit = useCallback(() => {
    router.push({ pathname: "/edit", params: { projectId, taskId } });
  }, [router, projectId, taskId]);

  const openSubtask = useCallback(
    (id: string) => {
      router.push({ pathname: "/detail", params: { projectId, taskId: id } });
    },
    [router, projectId],
  );

  return {
    task,
    notFound: task === null,
    subtasks,
    progress,
    goToEdit,
    openSubtask,
  };
}
