import { useMemo } from "react";
import { useProjectStore } from "../stores/project-store";

/**
 * Thin selector over the project store.
 */
export function useProject() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const projects = useProjectStore((s) => s.projects);
  const hasHydrated = useProjectStore((s) => s.hasHydrated);
  const selectProject = useProjectStore((s) => s.selectProject);
  const createProject = useProjectStore((s) => s.createProject);

  return useMemo(
    () => ({
      currentProject,
      isProjectSelected: !!currentProject,
      loading: !hasHydrated,
      projects,
      selectProject,
      createProject,
    }),
    [currentProject, projects, hasHydrated, selectProject, createProject],
  );
}
