import { useCallback } from "react";
import { Alert } from "react-native";
import { useTaskStore } from "../stores/task-store";
import { useProjectStore } from "../stores/project-store";
import { descendants } from "../utils/tasks-cascade";
import { Task } from "../types";

const EMPTY_TASKS: Task[] = [];

export interface UseTaskCompletionResult {
  completeTask: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
}

export function useTaskCompletion(): UseTaskCompletionResult {
  const currentProject = useProjectStore((s) => s.currentProject);
  const projectId = currentProject?.id || "";
  const projectName = currentProject?.name ?? "";

  const tasks = useTaskStore(
    useCallback((s) => s.tasks[projectId] ?? EMPTY_TASKS, [projectId]),
  );
  const markCompleted = useTaskStore((s) => s.markCompleted);
  const storeReopenTask = useTaskStore((s) => s.reopenTask);

  const handleComplete = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const openDescendants = descendants(tasks, id).filter((t) => !t.completed);

      const performComplete = async (taskId: string): Promise<void> => {
        await markCompleted(projectId, taskId);

        // Check if we completed the last open child of an incomplete parent task
        const updatedTasks = useTaskStore.getState().tasks[projectId] || [];
        const currentTask = updatedTasks.find((t) => t.id === taskId);
        if (currentTask?.parentId) {
          const parent = updatedTasks.find((t) => t.id === currentTask.parentId);
          if (parent && !parent.completed) {
            const siblings = updatedTasks.filter((t) => t.parentId === parent.id);
            const hasOpenSiblings = siblings.some((t) => !t.completed);
            if (!hasOpenSiblings) {
              Alert.alert(
                "Completar tarea principal",
                `Has completado todas las subtareas. ¿Deseas completar también la tarea principal "${parent.title}"?`,
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Sí",
                    onPress: () => {
                      performComplete(parent.id).catch((err: unknown) => {
                        console.error("[useTaskCompletion] Failed to cascade complete parent:", err);
                      });
                    },
                  },
                ],
              );
            }
          }
        }
      };

      if (openDescendants.length > 0) {
        Alert.alert(
          "Completar tarea",
          "Esta tarea tiene subtareas incompletas. ¿Deseas completarlas todas?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Completar todo",
              style: "destructive",
              onPress: () => {
                performComplete(id).catch((err: unknown) => {
                  console.error("[useTaskCompletion] Failed to complete tasks:", err);
                });
              },
            },
          ],
        );
      } else {
        await performComplete(id);
      }
    },
    [tasks, projectId, markCompleted],
  );

  const handleReopen = useCallback(
    async (id: string) => {
      await storeReopenTask(projectId, id, projectName);
    },
    [projectId, projectName, storeReopenTask],
  );

  return {
    completeTask: handleComplete,
    reopenTask: handleReopen,
  };
}
