import { describe, expect, it } from "vitest";
import { currentState, nextFocusIndex } from "@/lib/menu";

describe("nextFocusIndex", () => {
  it("moves forward and backward inside the list", () => {
    expect(nextFocusIndex(1, 5, false)).toBe(2);
    expect(nextFocusIndex(3, 5, true)).toBe(2);
  });

  it("wraps forward from the last element to the first", () => {
    expect(nextFocusIndex(4, 5, false)).toBe(0);
  });

  it("wraps backward from the first element to the last", () => {
    expect(nextFocusIndex(0, 5, true)).toBe(4);
  });

  it("stays put with a single focusable element", () => {
    expect(nextFocusIndex(0, 1, false)).toBe(0);
    expect(nextFocusIndex(0, 1, true)).toBe(0);
  });

  it("enters at the first or last element when focus is outside", () => {
    expect(nextFocusIndex(-1, 5, false)).toBe(0);
    expect(nextFocusIndex(-1, 5, true)).toBe(4);
  });

  it("returns -1 for an empty list", () => {
    expect(nextFocusIndex(0, 0, false)).toBe(-1);
  });
});

describe("currentState", () => {
  it("marks the page itself", () => {
    expect(currentState("/projects", "/projects")).toBe("page");
    expect(currentState("/projects/", "/projects")).toBe("page");
    expect(currentState("/", "/")).toBe("page");
  });

  it("marks a page inside a section as part of it", () => {
    expect(currentState("/projects/cli-toolkit", "/projects")).toBe("true");
  });

  it("does not mark unrelated or prefix-alike pages", () => {
    expect(currentState("/skills", "/projects")).toBeUndefined();
    expect(currentState("/projects-archive", "/projects")).toBeUndefined();
    expect(currentState("/skills", "/")).toBeUndefined();
  });
});
