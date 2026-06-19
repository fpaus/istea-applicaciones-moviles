import AsyncStorage from "@react-native-async-storage/async-storage";
import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { AuthState } from "./types";

const STORAGE_KEY = "auth-store";

/** Emails are case-insensitive identifiers; normalize before storing/matching. */
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Testable seam: the state initializer with no persistence. Holds both the
 * session `user` and the on-device `users` registry (no backend), absorbing the
 * former AuthService logic.
 */
export const createAuthState =
  (): StateCreator<AuthState> => (set, get) => ({
    user: null,
    users: [],
    hasHydrated: false,

    register: async ({ email, password }) => {
      const normalizedEmail = normalizeEmail(email);
      const exists = get().users.some((u) => u.email === normalizedEmail);
      if (exists) {
        throw new Error("User already exists");
      }
      set({
        users: [...get().users, { email: normalizedEmail, password }],
      });
    },

    login: async ({ email, password }) => {
      const normalizedEmail = normalizeEmail(email);
      const match = get().users.find(
        (u) => u.email === normalizedEmail && u.password === password,
      );
      if (!match) {
        throw new Error("Invalid email or password");
      }
      const { password: _password, ...safeUser } = match;
      set({ user: safeUser });
    },

    logout: async () => {
      set({ user: null });
    },

    setHasHydrated: (value) => set({ hasHydrated: value }),
  });

export const createAuthStore = () =>
  create<AuthState>()(
    devtools(
      persist(createAuthState(), {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ user: state.user, users: state.users }),
        onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      }),
      { name: "AuthStore" },
    ),
  );

export const useAuthStore = createAuthStore();
