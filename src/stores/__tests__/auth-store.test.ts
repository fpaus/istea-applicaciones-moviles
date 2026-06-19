import { createStore, StoreApi } from "zustand/vanilla";
import { createAuthState } from "../auth-store";
import { AuthState } from "../types";

function makeStore(): StoreApi<AuthState> {
  return createStore(createAuthState());
}

const credentials = { email: "john@example.com", password: "secret" };

describe("auth store", () => {
  it("register adds a user to the registry without logging in", async () => {
    const store = makeStore();

    await store.getState().register(credentials);

    expect(store.getState().users).toHaveLength(1);
    expect(store.getState().users[0].email).toBe("john@example.com");
    expect(store.getState().user).toBeNull();
  });

  it("register rejects a duplicate email", async () => {
    const store = makeStore();
    await store.getState().register(credentials);

    await expect(store.getState().register(credentials)).rejects.toThrow(
      /already exists/i,
    );
  });

  it("successful login sets the user with password stripped", async () => {
    const store = makeStore();
    await store.getState().register(credentials);

    await store.getState().login(credentials);

    const { user } = store.getState();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("john@example.com");
    expect(user?.password).toBeUndefined();
  });

  it("login rejects invalid credentials", async () => {
    const store = makeStore();
    await store.getState().register(credentials);

    await expect(
      store.getState().login({ email: "john@example.com", password: "wrong" }),
    ).rejects.toThrow(/invalid/i);
    expect(store.getState().user).toBeNull();
  });

  it("logout clears the session user but keeps the registry", async () => {
    const store = makeStore();
    await store.getState().register(credentials);
    await store.getState().login(credentials);

    await store.getState().logout();

    expect(store.getState().user).toBeNull();
    expect(store.getState().users).toHaveLength(1);
  });
});
