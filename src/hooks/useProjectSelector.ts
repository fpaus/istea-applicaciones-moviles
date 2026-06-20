import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useProject } from "./useProject";

/**
 * Encapsulates all state and handlers for the project selector UI (create /
 * pick / dropdown), so the component stays presentational.
 */
export function useProjectSelector(onSelect?: (id: string) => void) {
  const { currentProject, projects, selectProject, createProject } = useProject();

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

  const openDropdown = useCallback(() => setShowDropdown(true), []);
  const closeDropdown = useCallback(() => setShowDropdown(false), []);

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
    } catch (e: any) {
      setError(e.message || "Error al crear el proyecto");
    }
  }, [createProject, newProjectName]);

  const handleSelect = useCallback(
    async (id: string) => {
      try {
        await selectProject(id);
        setShowDropdown(false);
        onSelect?.(id);
      } catch (e: any) {
        Alert.alert("Error", e.message);
      }
    },
    [selectProject, onSelect],
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
  };
}
