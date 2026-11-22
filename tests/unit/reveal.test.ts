import { describe, expect, it } from "vitest";
import { staggerDelay } from "@/lib/reveal";

describe("staggerDelay", () => {
  it("starts at zero", () => {
    expect(staggerDelay(0)).toBe(0);
  });

  it("steps by 80ms", () => {
    expect(staggerDelay(1)).toBe(80);
    expect(staggerDelay(4)).toBe(320);
  });

  it("caps at the fifth step, 320ms", () => {
    expect(staggerDelay(5)).toBe(320);
    expect(staggerDelay(9)).toBe(320);
  });

  it("treats a negative index as zero", () => {
    expect(staggerDelay(-3)).toBe(0);
  });
});
