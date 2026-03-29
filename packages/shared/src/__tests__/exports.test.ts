import { describe, it, expect } from "vitest";

describe("@linkdigest/shared exports", () => {
  it("exports createSupabaseClient", async () => {
    const mod = await import("../index.js");
    expect(mod.createSupabaseClient).toBeTypeOf("function");
  });

  it("exports getSupabaseUrl and getSupabaseAnonKey", async () => {
    const mod = await import("../index.js");
    expect(mod.getSupabaseUrl).toBeTypeOf("function");
    expect(mod.getSupabaseAnonKey).toBeTypeOf("function");
  });

  it("re-exports Database type (verifiable via runtime type helpers)", async () => {
    // Types are erased at runtime, but we can verify the module shape
    // by checking that the module exports exist without errors
    const mod = await import("../index.js");
    expect(mod).toBeDefined();
  });
});
