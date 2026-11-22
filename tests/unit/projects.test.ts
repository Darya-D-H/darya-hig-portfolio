import { describe, expect, it } from "vitest";
import {
  assertUniqueOrder,
  getAdjacent,
  sortProjects,
  type ProjectLike,
} from "@/lib/projects";

const project = (id: string, order: number, draft = false): ProjectLike => ({
  id,
  data: { title: `Title ${id}`, order, draft },
});

// Deliberately out of order, so sorting is exercised.
const three = [project("c", 3), project("a", 1), project("b", 2)];

describe("sortProjects", () => {
  it("sorts by order, ascending", () => {
    expect(sortProjects(three).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("leaves drafts out unless asked", () => {
    const withDraft = [...three, project("d", 4, true)];
    expect(sortProjects(withDraft).map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(
      sortProjects(withDraft, { includeDrafts: true }).map((p) => p.id),
    ).toEqual(["a", "b", "c", "d"]);
  });
});

describe("assertUniqueOrder", () => {
  it("throws on a duplicate order and names both files", () => {
    expect(() =>
      assertUniqueOrder([project("alpha", 1), project("beta", 1)]),
    ).toThrowError(/"alpha" and "beta" both have order: 1/);
  });

  it("accepts unique orders", () => {
    expect(() => assertUniqueOrder(three)).not.toThrow();
  });
});

describe("getAdjacent", () => {
  it("gives the first project a next and no prev", () => {
    expect(getAdjacent(three, "a")).toEqual({
      prev: undefined,
      next: { slug: "b", title: "Title b" },
    });
  });

  it("gives the last project a prev and no next", () => {
    expect(getAdjacent(three, "c")).toEqual({
      prev: { slug: "b", title: "Title b" },
      next: undefined,
    });
  });

  it("gives a middle project both", () => {
    const { prev, next } = getAdjacent(three, "b");
    expect(prev?.slug).toBe("a");
    expect(next?.slug).toBe("c");
  });

  it("gives a single project neither", () => {
    expect(getAdjacent([project("only", 1)], "only")).toEqual({
      prev: undefined,
      next: undefined,
    });
  });

  it("skips drafts as neighbours", () => {
    const withDraft = [...three, project("between", 2.5, true)];
    expect(getAdjacent(withDraft, "b").next?.slug).toBe("c");
  });

  it("throws for an unknown slug", () => {
    expect(() => getAdjacent(three, "nope")).toThrowError(/"nope"/);
  });

  it("throws on duplicate orders before answering", () => {
    expect(() =>
      getAdjacent([project("x", 1), project("y", 1)], "x"),
    ).toThrowError(/both have order/);
  });
});
