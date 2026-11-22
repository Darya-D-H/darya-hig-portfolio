import { describe, expect, it } from "vitest";
import { isProd, todoLines } from "../../scripts/check-todo.mjs";

describe("check:todo", () => {
  it("reports the lines that hold a placeholder", () => {
    const text =
      'title: "Real"\nsummary: "TODO: write this"\nok\n# TODO: and this';
    expect(todoLines(text)).toEqual([2, 4]);
  });

  it("ignores a plain TODO without the colon", () => {
    expect(todoLines("// TODO later")).toEqual([]);
  });

  it("handles Windows line endings", () => {
    expect(todoLines("a\r\nTODO: b\r\n")).toEqual([2]);
  });

  it("takes --prod as an argument or from npm's config", () => {
    expect(isProd(["--prod"], {})).toBe(true);
    expect(isProd([], { npm_config_prod: "true" })).toBe(true);
    expect(isProd([], {})).toBe(false);
  });
});
