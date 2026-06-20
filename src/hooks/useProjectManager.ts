import { useCallback, useState } from "react";
import { useProjectActions } from "./useProjectActions";

export interface UseProjectManagerResult {
  editingId: string | null;
  editingName: string;
  error: string;
  startEdit: (id: string, name: string) => void;
  changeEditName: (text: string) => void;
  cancelEdit: () => void;
  submitEdit: () => Promise<void>;
  deleteProject: (id: string, name?: string) => void;
}

/**
 * Encapsulates the per-row "manage projects" UI state for the picker: inline
 * rename editing (with validation/error copy in Spanish) and delete (cascade +
 * confirmation, via {@link useProjectActions}). Keeps the picker presentational.
 */
export function useProjectManager(): UseProjectManagerResult {
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
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(
        errorMsg === "Project already exists"
          ? "Ya existe un proyecto con ese nombre"
          : errorMsg || "Error al renombrar el proyecto",
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
