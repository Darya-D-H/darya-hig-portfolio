import { describe, expect, it } from "vitest";
import { announcement, clampIndex } from "@/lib/lightbox";

describe("clampIndex", () => {
  it("keeps an index inside the list", () => {
    expect(clampIndex(2, 6)).toBe(2);
  });

  it("does not go below the first image", () => {
    expect(clampIndex(-1, 6)).toBe(0);
  });

  it("does not advance past the last image", () => {
    expect(clampIndex(6, 6)).toBe(5);
    expect(clampIndex(99, 6)).toBe(5);
  });

  it("handles an empty list", () => {
    expect(clampIndex(3, 0)).toBe(0);
  });
});

describe("announcement", () => {
  it("is 1-based", () => {
    expect(announcement(0, 6)).toBe("Image 1 of 6");
    expect(announcement(5, 6)).toBe("Image 6 of 6");
  });

  it("never announces an image outside the list", () => {
    expect(announcement(9, 6)).toBe("Image 6 of 6");
  });
});
