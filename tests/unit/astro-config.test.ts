import { describe, expect, it } from "vitest";
import config from "../../astro.config.mjs";

// ADR-0005: the build stays host-agnostic until a host is chosen in Phase 7.
describe("astro.config.mjs", () => {
  it("builds static output", () => {
    expect(config.output).toBe("static");
  });

  it("has no adapter", () => {
    expect(config.adapter).toBeUndefined();
  });

  it("leaves base unset", () => {
    expect(config.base).toBeUndefined();
  });
});
