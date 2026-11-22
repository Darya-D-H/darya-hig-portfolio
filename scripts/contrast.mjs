// @ts-check
/// <reference types="node" />
// node scripts/contrast.mjs
//
// Recomputes the contrast table in docs/02-design-tokens.md §1 from the
// colours actually in src/styles/global.css, and exits non-zero if any ratio
// or verdict differs from the documented one. Run it whenever a colour
// changes. The ratio maths is the WCAG 2.x formula from docs/07-test-plan.md §5.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** @param {number} c */
const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

/** @param {string} hex */
const L = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * lin((n >> 16) & 255) +
    0.7152 * lin((n >> 8) & 255) +
    0.0722 * lin(n & 255)
  );
};

/**
 * @param {string} a
 * @param {string} b
 */
export const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)];
  const [hi, lo] = [Math.max(x, y), Math.min(x, y)];
  return (hi + 0.05) / (lo + 0.05);
};

// The documented table, row for row. A token name resolves against
// global.css; a literal hex is a value that is deliberately not a token.
const DOCUMENTED = [
  ["ink", "canvas", 16.83],
  ["ink", "section", 15.46],
  ["ink-secondary", "canvas", 5.07],
  ["ink-secondary", "section", 4.66],
  ["ink-tertiary", "canvas", 3.62],
  ["ink-tertiary", "section", 3.33],
  ["canvas", "accent", 4.7],
  ["accent", "canvas", 4.7],
  ["accent", "section", 4.31],
  ["canvas", "accent-hover", 5.38],
  ["canvas", "#0077ed", 4.32], // apple.com's hover blue, rejected
  ["link", "canvas", 5.57],
  ["link", "section", 5.11],
  ["ink-strong", "canvas", 21],
  // Tinted button: the accent at 0.10 and 0.14 alpha composited over white.
  ["link", "#e6f1fc", 4.86],
  ["link", "#dbebfb", 4.58],
  ["link", "#d6e8fb", 4.45], // 0.16, the first-draft hover, rejected
];

const NORMAL_TEXT = 4.5;

function readPalette() {
  const css = readFileSync(
    new URL("../src/styles/global.css", import.meta.url),
    "utf8",
  );
  /** @type {Record<string, string>} */
  const palette = {};
  for (const [, name, hex] of css.matchAll(
    /--color-([a-z-]+):\s*(#[0-9a-f]{6});/gi,
  )) {
    palette[name] = hex.toLowerCase();
  }
  return palette;
}

function main() {
  const palette = readPalette();
  /** @param {string} ref */
  const resolve = (ref) => {
    const hex = ref.startsWith("#") ? ref : palette[ref];
    if (!hex) throw new Error(`--color-${ref} is not in global.css`);
    return hex;
  };

  let mismatches = 0;
  console.log("| Foreground | Background | Ratio   | Normal text |");
  console.log("| ---------- | ---------- | ------- | ----------- |");
  for (const [fg, bg, documented] of DOCUMENTED) {
    const [fgHex, bgHex] = [resolve(String(fg)), resolve(String(bg))];
    const value = ratio(fgHex, bgHex);
    const rounded = Math.round(value * 100) / 100;
    const verdict = value >= NORMAL_TEXT ? "pass" : "fail";
    const ok =
      rounded === documented &&
      verdict === (Number(documented) >= NORMAL_TEXT ? "pass" : "fail");
    if (!ok) mismatches += 1;
    console.log(
      `| \`${fgHex}\`  | \`${bgHex}\`  | ${rounded.toFixed(2).padStart(5)}:1 | ${verdict.padEnd(11)} |${ok ? "" : ` MISMATCH, doc says ${documented}:1`}`,
    );
  }

  if (mismatches > 0) {
    console.error(`\n${mismatches} row(s) differ from the documented table.`);
    process.exitCode = 1;
  } else {
    console.log("\nEvery row matches docs/02-design-tokens.md §1.");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
