import { useProjectStore } from "../stores/project-store";
import { useTaskStore } from "../stores/task-store";

/**
 * True only once both persisted stores have finished rehydrating from
 * AsyncStorage. The root layout gates rendering on this so declarative
 * redirects evaluate against hydrated state (no login-screen flash).
 */
export function useHydrated(): boolean {
  const projectHydrated = useProjectStore((s) => s.hasHydrated);
  const tasksHydrated = useTaskStore((s) => s.hasHydrated);
  return projectHydrated && tasksHydrated;
}
