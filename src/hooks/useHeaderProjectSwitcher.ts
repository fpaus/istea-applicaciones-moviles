import { useCallback } from "react";
import { useProjectSelector } from "./useProjectSelector";
import { Project } from "../types";
import { UseProjectManagerResult } from "./useProjectManager";

export interface UseHeaderProjectSwitcherResult {
  currentProject: Project | null;
  projectName: string;
  projects: Project[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  handleSelect: (id: string) => Promise<void>;
  isCreating: boolean;
  newProjectName: string;
  error: string;
  changeName: (text: string) => void;
  startCreating: () => void;
  cancelCreating: () => void;
  handleCreate: () => Promise<void>;
  manage: UseProjectManagerResult;
}

/**
 * Encapsulates the header project switcher: the active project name plus the
 * open/close, select and create flows. Delegates to {@link useProjectSelector}
 * so the create/select logic lives in one place, and re-exposes it with
 * header-friendly names. Keeps the header component fully presentational
 * (no logic / no primitive hooks in components).
 */
export function useHeaderProjectSwitcher(): UseHeaderProjectSwitcherResult {
  const {
    currentProject,
    projects,
    showDropdown,
    openDropdown,
    closeDropdown,
    handleSelect,
    isCreating,
    newProjectName,
    error,
    changeName,
    startCreating,
    cancelCreating,
    handleCreate,
    manage,
  } = useProjectSelector();

  // Closing the picker should also discard any half-typed new project.
  const close = useCallback(() => {
    cancelCreating();
    closeDropdown();
  }, [cancelCreating, closeDropdown]);

  return {
    currentProject,
    projectName: currentProject?.name ?? "",
    projects,
    isOpen: showDropdown,
    open: openDropdown,
    close,
    handleSelect,
    // create flow
    isCreating,
    newProjectName,
    error,
    changeName,
    startCreating,
    cancelCreating,
    handleCreate,
    manage,
  };
}
