import { useMemo } from "react";
import { useAuthStore } from "../stores/auth-store";

/**
 * Thin selector over the auth store, preserving the shape screens already
 * consume: `{ user, isLoggedIn, loading, login, register, logout }`.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);

  return useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      loading: !hasHydrated,
      login,
      register,
      logout,
    }),
    [user, hasHydrated, login, register, logout],
  );
}
