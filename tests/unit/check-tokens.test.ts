import { describe, expect, it } from "vitest";
import { findViolations } from "../../scripts/check-tokens.mjs";

const matches = (text: string, filename?: string) =>
  findViolations(text, filename).map((v) => v.match);

describe("check:tokens", () => {
  it.each([
    "text-[23px]",
    "p-[27px]",
    "bg-[#333]",
    "duration-[450ms]",
    "rounded-[10px]",
    "md:text-[23px]",
    "-mt-[4px]",
    "bg-(--brand)",
    "[mask-type:luminance]",
    "duration-300",
    "delay-150",
    "z-10",
  ])("flags %s in a class list", (cls) => {
    expect(matches(`<p class="text-body ${cls}">x</p>`)).toHaveLength(1);
  });

  it.each([
    "text-body",
    "bg-section",
    "rounded-card",
    "p-4",
    "duration-fast",
    "z-sticky",
    "max-w-content",
    "md:grid-cols-2",
  ])("allows the token utility %s", (cls) => {
    expect(matches(`<p class="${cls}">x</p>`)).toEqual([]);
  });

  it("flags raw values in a scoped style block", () => {
    const text = `<style>.a { color: #1d1d1f; margin: 12px; transition: opacity 300ms; }</style>`;
    expect(matches(text)).toEqual(["#1d1d1f", "12px", "300ms"]);
  });

  it("flags raw values in a style attribute", () => {
    expect(matches(`<div style="width: 24px"></div>`)).toEqual(["24px"]);
  });

  it("allows var() references in styles", () => {
    const text = `<style>.a { margin: var(--space-3); }</style><div style="width: var(--space-6)"></div>`;
    expect(matches(text)).toEqual([]);
  });

  it("does not treat fragment links or ordinary code as violations", () => {
    expect(matches(`<a href="#main">Skip</a>`)).toEqual([]);
    expect(
      matches(`const items = list[index]; const gap = total - (count);`),
    ).toEqual([]);
  });

  it("scans the whole of a .css file", () => {
    expect(matches(`.a { padding: 8px; }`, "extra.css")).toEqual(["8px"]);
  });
});
