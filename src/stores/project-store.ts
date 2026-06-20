import AsyncStorage from "@react-native-async-storage/async-storage";
import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { ProjectState } from "./types";
import { Project } from "../types";
import { generateUUID } from "../utils/uuid";

const STORAGE_KEY = "project-store";

/**
 * Testable seam: the state initializer with no persistence. Holds both the
 * active project and the project list (on-device registry).
 */
export const createProjectState =
  (): StateCreator<ProjectState> => (set, get) => ({
    currentProject: null,
    projects: [],
    hasHydrated: false,

    createProject: async (name) => {
      const normalizedName = name.trim().toLowerCase();
      const exists = get().projects.some(
        (p) => p.name.trim().toLowerCase() === normalizedName,
      );
      if (exists) {
        throw new Error("Project already exists");
      }
      const newProject: Project = {
        id: generateUUID(),
        name: name.trim(),
      };
      set({
        projects: [...get().projects, newProject],
        currentProject: newProject,
      });
    },

    renameProject: async (id, name) => {
      const trimmed = name.trim();
      const normalizedName = trimmed.toLowerCase();
      const target = get().projects.find((p) => p.id === id);
      if (!target) {
        throw new Error("Project not found");
      }
      const exists = get().projects.some(
        (p) => p.id !== id && p.name.trim().toLowerCase() === normalizedName,
      );
      if (exists) {
        throw new Error("Project already exists");
      }
      const updated: Project = { ...target, name: trimmed };
      set({
        projects: get().projects.map((p) => (p.id === id ? updated : p)),
        currentProject:
          get().currentProject?.id === id ? updated : get().currentProject,
      });
    },

    selectProject: async (id) => {
      const match = get().projects.find((p) => p.id === id);
      if (!match) {
        throw new Error("Project not found");
      }
      set({ currentProject: match });
    },

    deleteProject: async (id) => {
      // Task cascade (removing the project's tasks + cancelling their
      // notifications) is orchestrated by `useProjectActions` to keep stores
      // decoupled; here we only drop the project and clear the active session
      // if it was the one deleted.
      set({
        projects: get().projects.filter((p) => p.id !== id),
        currentProject:
          get().currentProject?.id === id ? null : get().currentProject,
      });
    },

    deselectProject: async () => {
      set({ currentProject: null });
    },

    setHasHydrated: (value) => set({ hasHydrated: value }),
  });

export const createProjectStore = () =>
  create<ProjectState>()(
    devtools(
      persist(createProjectState(), {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          currentProject: state.currentProject,
          projects: state.projects,
        }),
        onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      }),
      { name: "ProjectStore" },
    ),
  );

export const useProjectStore = createProjectStore();
