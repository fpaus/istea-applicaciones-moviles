import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useProject } from "./useProject";
import { useProjectManager, UseProjectManagerResult } from "./useProjectManager";
import { Project } from "../types";

export interface UseProjectSelectorResult {
  currentProject: Project | null;
  projects: Project[];
  hasProjects: boolean;
  isCreating: boolean;
  newProjectName: string;
  showDropdown: boolean;
  error: string;
  changeName: (text: string) => void;
  startCreating: () => void;
  cancelCreating: () => void;
  openDropdown: () => void;
  closeDropdown: () => void;
  handleCreate: () => Promise<void>;
  handleSelect: (id: string) => Promise<void>;
  manage: UseProjectManagerResult;
}

/**
 * Encapsulates all state and handlers for the project selector UI (create /
 * pick / dropdown), so the component stays presentational.
 */
export function useProjectSelector(
  onSelect?: (id: string) => void,
): UseProjectSelectorResult {
  const { currentProject, projects, selectProject, createProject } = useProject();
  // Owns the per-row rename/delete flow so that the picker has a single source
  // of interaction state — closing/selecting resets any in-progress rename.
  const manage = useProjectManager();

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");

  const changeName = useCallback((text: string) => {
    setNewProjectName(text);
    setError("");
  }, []);

  const startCreating = useCallback(() => setIsCreating(true), []);

  const cancelCreating = useCallback(() => {
    setIsCreating(false);
    setNewProjectName("");
    setError("");
  }, []);

  const { cancelEdit } = manage;
  const openDropdown = useCallback(() => setShowDropdown(true), []);
  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
    cancelEdit();
  }, [cancelEdit]);

  const handleCreate = useCallback(async () => {
    if (newProjectName.trim() === "") {
      setError("El nombre es requerido");
      return;
    }
    try {
      setError("");
      await createProject(newProjectName);
      setNewProjectName("");
      setIsCreating(false);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg || "Error al crear el proyecto");
    }
  }, [createProject, newProjectName]);

  const handleSelect = useCallback(
    async (id: string) => {
      try {
        await selectProject(id);
        setShowDropdown(false);
        cancelEdit();
        onSelect?.(id);
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        Alert.alert("Error", errorMsg);
      }
    },
    [selectProject, onSelect, cancelEdit],
  );

  return {
    currentProject,
    projects,
    hasProjects: projects.length > 0,
    isCreating,
    newProjectName,
    showDropdown,
    error,
    changeName,
    startCreating,
    cancelCreating,
    openDropdown,
    closeDropdown,
    handleCreate,
    handleSelect,
    manage,
  };
}
