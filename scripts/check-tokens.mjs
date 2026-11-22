// @ts-check
/// <reference types="node" />
// npm run check:tokens
//
// Mechanical enforcement of the no-arbitrary-values rule (ADR-0002,
// docs/07-test-plan.md §2). A raw value in a component means a token is
// missing; the fix is a token, not an exception. src/styles/global.css is the
// one file where raw values belong, so it is not scanned.
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const TOKEN_FILE = join(SRC, "styles", "global.css");
const EXTENSIONS = new Set([
  ".astro",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".css",
  ".md",
  ".mdx",
]);

/** Rules that apply anywhere in a scanned file. */
const CLASS_RULES = [
  {
    // text-[23px], p-[27px], bg-[#333], duration-[450ms], rounded-[10px]
    pattern: /(?<![\w-])-?[a-z][\w-]*-\[[^\]\s]+\]/g,
    message: "Tailwind arbitrary value",
  },
  {
    // bg-(--brand), p-(--gap): v4's shorthand for an arbitrary var()
    pattern: /(?<![\w-])-?[a-z][\w-]*-\(--[\w-]+\)/g,
    message: "Tailwind arbitrary value",
  },
  {
    // [mask-type:luminance]
    pattern: /(?<![\w\]])\[[a-z][a-z-]*:[^\]\s]+\]/g,
    message: "Tailwind arbitrary property",
  },
  {
    // duration-300, delay-150: raw milliseconds; use duration-fast and so on
    pattern: /(?<![\w-])(?:duration|delay)-\d+(?![\w-])/g,
    message: "raw duration; use a motion token",
  },
  {
    // z-10, z-50: use the named ladder, z-sticky and so on
    pattern: /(?<![\w-])-?z-\d+(?![\w-])/g,
    message: "raw z-index; use the z-index ladder",
  },
];

/** Rules that apply only to CSS: <style> blocks, style="" and .css files. */
const STYLE_RULES = [
  { pattern: /#[0-9a-f]{3,8}(?![\w-])/gi, message: "raw hex colour" },
  { pattern: /(?<![\w.-])\d*\.?\d+px(?![\w-])/g, message: "raw px value" },
  { pattern: /(?<![\w.-])\d*\.?\d+ms(?![\w-])/g, message: "raw ms value" },
];

/**
 * @param {string} text
 * @param {boolean} wholeFileIsCss
 * @returns {string[]} the CSS regions of the file
 */
function styleRegions(text, wholeFileIsCss) {
  if (wholeFileIsCss) return [text];
  const regions = [];
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    regions.push(m[1] ?? "");
  }
  for (const m of text.matchAll(/\sstyle=(?:"([^"]*)"|'([^']*)')/g)) {
    regions.push(m[1] ?? m[2] ?? "");
  }
  return regions;
}

/**
 * Finds token-rule violations in one file's text.
 * @param {string} text
 * @param {string} [filename]
 * @returns {{ match: string, message: string }[]}
 */
export function findViolations(text, filename = "file.astro") {
  const found = [];
  for (const { pattern, message } of CLASS_RULES) {
    for (const m of text.matchAll(pattern))
      found.push({ match: m[0], message });
  }
  for (const region of styleRegions(text, extname(filename) === ".css")) {
    for (const { pattern, message } of STYLE_RULES) {
      for (const m of region.matchAll(pattern)) {
        found.push({ match: m[0], message });
      }
    }
  }
  return found;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

function main() {
  let total = 0;
  for (const file of walk(SRC)) {
    if (file === TOKEN_FILE) continue;
    for (const { match, message } of findViolations(
      readFileSync(file, "utf8"),
      file,
    )) {
      total += 1;
      console.error(`${relative(ROOT, file)}: ${message}: ${match}`);
    }
  }
  if (total > 0) {
    console.error(
      `\n${total} raw value(s) found. Use a token from docs/02-design-tokens.md, or add one there first.`,
    );
    process.exitCode = 1;
  } else {
    console.log("check:tokens: no arbitrary or raw values in src/.");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
