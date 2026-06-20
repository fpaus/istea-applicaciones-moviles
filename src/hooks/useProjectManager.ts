import { useCallback, useState } from "react";
import { useProjectActions } from "./useProjectActions";

/**
 * Encapsulates the per-row "manage projects" UI state for the picker: inline
 * rename editing (with validation/error copy in Spanish) and delete (cascade +
 * confirmation, via {@link useProjectActions}). Keeps the picker presentational.
 */
export function useProjectManager() {
  const { deleteProject, renameProject } = useProjectActions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  const startEdit = useCallback((id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setError("");
  }, []);

  const changeEditName = useCallback((text: string) => {
    setEditingName(text);
    setError("");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName("");
    setError("");
  }, []);

  const submitEdit = useCallback(async () => {
    if (!editingId) return;
    if (editingName.trim() === "") {
      setError("El nombre es requerido");
      return;
    }
    try {
      await renameProject(editingId, editingName);
      setEditingId(null);
      setEditingName("");
      setError("");
    } catch (e: any) {
      setError(
        e?.message === "Project already exists"
          ? "Ya existe un proyecto con ese nombre"
          : e?.message || "Error al renombrar el proyecto",
      );
    }
  }, [editingId, editingName, renameProject]);

  return {
    editingId,
    editingName,
    error,
    startEdit,
    changeEditName,
    cancelEdit,
    submitEdit,
    deleteProject,
  };
}
