import { useCallback, useMemo } from "react";
import { useProjectStore } from "../stores/project-store";
import { selectCompleted, useTaskStore } from "../stores/task-store";
import { Task } from "../types";

const EMPTY_ARRAY: Task[] = [];

/**
 * Returns the completed tasks for the current project.
 */
export function useCompletedTasks(): Task[] {
  const currentProject = useProjectStore((s) => s.currentProject);
  const projectId = currentProject?.id || "";

  const projectTasks = useTaskStore(
    useCallback((s) => s.tasks[projectId] || EMPTY_ARRAY, [projectId]),
  );

  const rootTasks = useMemo(
    () => projectTasks.filter((t) => !t.parentId),
    [projectTasks],
  );

  return useMemo(() => selectCompleted(rootTasks), [rootTasks]);
}
