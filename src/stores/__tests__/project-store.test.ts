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

  it("selectProject throws an error if project is not found", async () => {
    const store = makeStore();
    await expect(store.getState().selectProject("non-existent-id")).rejects.toThrow(
      /project not found/i,
    );
  });

  it("renameProject updates the project's name (trimmed)", async () => {
    const store = makeStore();
    await store.getState().createProject("Trabajo");
    const id = store.getState().projects[0].id;

    await store.getState().renameProject(id, "  Personal  ");

    expect(store.getState().projects[0].name).toBe("Personal");
  });

  it("renameProject updates currentProject when the active project is renamed", async () => {
    const store = makeStore();
    await store.getState().createProject("Trabajo");
    const id = store.getState().projects[0].id;

    await store.getState().renameProject(id, "Personal");

    expect(store.getState().currentProject?.name).toBe("Personal");
  });

  it("renameProject rejects a case-insensitive duplicate of another project", async () => {
    const store = makeStore();
    await store.getState().createProject("Trabajo");
    await store.getState().createProject("Personal");
    const trabajoId = store.getState().projects.find((p) => p.name === "Trabajo")!.id;

    await expect(
      store.getState().renameProject(trabajoId, "personal"),
    ).rejects.toThrow(/already exists/i);

    expect(store.getState().projects.map((p) => p.name).sort()).toEqual([
      "Personal",
      "Trabajo",
    ]);
  });

  it("renameProject allows renaming a project to a different case of its own name", async () => {
    const store = makeStore();
    await store.getState().createProject("Trabajo");
    const id = store.getState().projects[0].id;

    await store.getState().renameProject(id, "TRABAJO");

    expect(store.getState().projects[0].name).toBe("TRABAJO");
  });

  it("renameProject throws if the project is not found", async () => {
    const store = makeStore();
    await expect(
      store.getState().renameProject("nope", "Whatever"),
    ).rejects.toThrow(/project not found/i);
  });

  it("deleteProject removes the project from the list and leaves others intact", async () => {
    const store = makeStore();
    await store.getState().createProject("Trabajo");
    await store.getState().createProject("Personal");
    const trabajoId = store.getState().projects.find((p) => p.name === "Trabajo")!.id;

    await store.getState().deleteProject(trabajoId);

    expect(store.getState().projects.map((p) => p.name)).toEqual(["Personal"]);
  });

  it("deleteProject clears currentProject when the deleted project was active", async () => {
    const store = makeStore();
    await store.getState().createProject("Trabajo");
    const id = store.getState().projects[0].id;
    expect(store.getState().currentProject?.id).toBe(id);

    await store.getState().deleteProject(id);

    expect(store.getState().currentProject).toBeNull();
  });

  it("deleteProject keeps currentProject when a different project is deleted", async () => {
    const store = makeStore();
    await store.getState().createProject("Trabajo");
    await store.getState().createProject("Personal"); // becomes active
    const trabajoId = store.getState().projects.find((p) => p.name === "Trabajo")!.id;

    await store.getState().deleteProject(trabajoId);

    expect(store.getState().currentProject?.name).toBe("Personal");
  });
});
