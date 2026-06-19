import { useAuthStore } from "../stores/auth-store";
import { useReminderStore } from "../stores/reminder-store";

/**
 * True only once both persisted stores have finished rehydrating from
 * AsyncStorage. The root layout gates rendering on this so declarative auth
 * redirects evaluate against hydrated state (no login-screen flash).
 */
export function useHydrated(): boolean {
  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const remindersHydrated = useReminderStore((s) => s.hasHydrated);
  return authHydrated && remindersHydrated;
}
