import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { useProjectStore } from "../stores/project-store";
import { useTaskStore } from "../stores/task-store";
import { NewTask } from "../types";

export interface UseTaskActionsResult {
  addTask: (data: NewTask) => Promise<void>;
  deleteTask: (id: string) => void;
  markCompleted: (id: string) => Promise<void>;
  clearAll: () => void;
}

/**
 * Exposes actionable task mutations scoped to the current project.
 */
export function useTaskActions(): UseTaskActionsResult {
  const currentProject = useProjectStore((s) => s.currentProject);
  const projectId = currentProject?.id || "";
  const projectName = currentProject?.name ?? "";

  const storeAddTask = useTaskStore((s) => s.addTask);
  const storeDeleteTask = useTaskStore((s) => s.deleteTask);
  const storeMarkCompleted = useTaskStore((s) => s.markCompleted);
  const storeClearAll = useTaskStore((s) => s.clearAll);

  const addTask = useCallback(
    (data: NewTask) => storeAddTask(projectId, projectName, data),
    [storeAddTask, projectId, projectName],
  );

  const deleteTask = useCallback(
    (id: string) => {
      if (!projectId) return;
      Alert.alert(
        "Eliminar tarea",
        "¿Estás seguro de que deseas eliminar esta tarea?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => storeDeleteTask(projectId, id),
          },
        ],
      );
    },
    [storeDeleteTask, projectId],
  );

  const markCompleted = useCallback(
    (id: string) => storeMarkCompleted(projectId, id),
    [storeMarkCompleted, projectId],
  );

  const clearAll = useCallback(() => {
    if (!projectId) return;
    Alert.alert(
      "Confirmar",
      "¿Estás seguro de que deseas eliminar todas las tareas de este proyecto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => storeClearAll(projectId),
        },
      ],
    );
  }, [storeClearAll, projectId]);

  return useMemo(
    () => ({
      addTask,
      deleteTask,
      markCompleted,
      clearAll,
    }),
    [addTask, deleteTask, markCompleted, clearAll],
  );
}
