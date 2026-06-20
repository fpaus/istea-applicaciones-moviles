import { generateUUID } from "../uuid";

describe("generateUUID utility", () => {
  it("generates a valid v4 UUID format", () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("produces unique values", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateUUID());
    }
    expect(ids.size).toBe(100);
  });

  it("uses the fallback when crypto is undefined", () => {
    const originalCrypto = global.crypto;
    // Temporarily delete crypto from global scope
    Object.defineProperty(global, "crypto", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // Restore crypto
    Object.defineProperty(global, "crypto", {
      value: originalCrypto,
      configurable: true,
      writable: true,
    });
  });
});
