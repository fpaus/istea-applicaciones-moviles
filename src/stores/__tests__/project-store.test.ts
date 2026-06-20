import { createStore, StoreApi } from "zustand/vanilla";
import { createProjectState } from "../project-store";
import { ProjectState } from "../types";

function makeStore(): StoreApi<ProjectState> {
  return createStore(createProjectState());
}

describe("project store", () => {
  it("createProject adds a project to the list with a UUID and auto-selects it", async () => {
    const store = makeStore();

    await store.getState().createProject("My Project");

    const state = store.getState();
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].name).toBe("My Project");
    expect(state.projects[0].id).toBeDefined();
    expect(state.currentProject).toEqual(state.projects[0]);
  });

  it("createProject rejects duplicate names (case-insensitive and trimmed)", async () => {
    const store = makeStore();
    await store.getState().createProject("My Project");

    await expect(store.getState().createProject("  my project  ")).rejects.toThrow(
      /already exists/i,
    );
  });

  it("selectProject sets the currentProject", async () => {
    const store = makeStore();
    await store.getState().createProject("My Project");
    const proj = store.getState().projects[0];

    await store.getState().selectProject(proj.id);

    expect(store.getState().currentProject).toEqual(proj);
  });

  it("deselectProject clears the currentProject", async () => {
    const store = makeStore();
    await store.getState().createProject("My Project");
    const proj = store.getState().projects[0];

    await store.getState().selectProject(proj.id);
    await store.getState().deselectProject();

    expect(store.getState().currentProject).toBeNull();
  });

  it("selectProject throws an error if project is not found", async () => {
    const store = makeStore();
    await expect(store.getState().selectProject("non-existent-id")).rejects.toThrow(
      /project not found/i,
    );
  });
});
