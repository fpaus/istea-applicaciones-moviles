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

    selectProject: async (id) => {
      const match = get().projects.find((p) => p.id === id);
      if (!match) {
        throw new Error("Project not found");
      }
      set({ currentProject: match });
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
