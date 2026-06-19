import { createStore, StoreApi } from "zustand/vanilla";
import { createAuthState } from "../auth-store";
import { AuthState } from "../types";

function makeStore(): StoreApi<AuthState> {
  return createStore(createAuthState());
}

describe("auth store — email normalization", () => {
  it("logs in regardless of case or surrounding whitespace", async () => {
    const store = makeStore();
    await store.getState().register({
      email: "john@example.com",
      password: "secret",
    });

    await store
      .getState()
      .login({ email: "  John@Example.com ", password: "secret" });

    expect(store.getState().user?.email).toBe("john@example.com");
  });

  it("stores the normalized email on register", async () => {
    const store = makeStore();
    await store.getState().register({
      email: "  Jane@Example.COM ",
      password: "pw",
    });

    expect(store.getState().users[0].email).toBe("jane@example.com");
  });

  it("rejects a case-variant duplicate registration", async () => {
    const store = makeStore();
    await store.getState().register({
      email: "john@example.com",
      password: "secret",
    });

    await expect(
      store.getState().register({ email: "JOHN@example.com", password: "x" }),
    ).rejects.toThrow(/already exists/i);
  });
});
