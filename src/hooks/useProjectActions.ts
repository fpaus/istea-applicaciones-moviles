import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { useProjectStore } from "../stores/project-store";
import { useTaskStore } from "../stores/task-store";

/**
 * Orchestrates project lifecycle actions that span both stores. Deletion
 * cascades to the project's tasks (cancelling their notifications) by calling
 * the task store first, then the project store — keeping the stores decoupled
 * (no store imports another). Destructive deletion is gated behind a Spanish
 * confirmation dialog.
 */
export function useProjectActions() {
  const storeDeleteProject = useProjectStore((s) => s.deleteProject);
  const storeRenameProject = useProjectStore((s) => s.renameProject);
  const removeProjectTasks = useTaskStore((s) => s.removeProjectTasks);

  const deleteProject = useCallback(
    (id: string, name?: string) => {
      // Name the target (and its task count) so the confirmation can't be
      // applied to the wrong project.
      const taskCount = useTaskStore.getState().tasks[id]?.length ?? 0;
      const label = name ? `"${name}"` : "este proyecto";
      const tasksClause =
        taskCount > 0
          ? ` y sus ${taskCount} ${taskCount === 1 ? "tarea" : "tareas"}`
          : "";
      Alert.alert(
        "Eliminar proyecto",
        `¿Estás seguro de que deseas eliminar ${label}${tasksClause}? Esta acción no se puede deshacer.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              await removeProjectTasks(id);
              await storeDeleteProject(id);
            },
          },
        ],
      );
    },
    [removeProjectTasks, storeDeleteProject],
  );

  const renameProject = useCallback(
    (id: string, name: string) => storeRenameProject(id, name),
    [storeRenameProject],
  );

  return useMemo(
    () => ({ deleteProject, renameProject }),
    [deleteProject, renameProject],
  );
}
