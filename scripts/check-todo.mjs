// @ts-check
/// <reference types="node" />
// npm run check:todo            report placeholder copy, never fail
// npm run check:todo --prod     fail while any placeholder remains
//
// Every placeholder string starts with "TODO:" (docs/06-content-model.md §4),
// so this finds them in src/content/ and src/pages/. It is part of the
// release checklist, not of verify: placeholders are expected while the site
// is being built and must never ship.
//
// `npm run check:todo --prod` hands --prod to npm, not to this script; npm
// exposes it as npm_config_prod. `npm run check:todo -- --prod` and
// `node scripts/check-todo.mjs --prod` work too.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIRS = ["src/content", "src/pages"];
const MARKER = "TODO:";

/**
 * The 1-based line numbers in `text` that contain a placeholder.
 * @param {string} text
 * @returns {number[]}
 */
export function todoLines(text) {
  return text
    .split(/\r?\n/)
    .flatMap((line, index) => (line.includes(MARKER) ? [index + 1] : []));
}

/**
 * Whether the release flag was given, however npm passed it on.
 * @param {string[]} argv
 * @param {Record<string, string | undefined>} env
 */
export function isProd(argv, env) {
  return argv.includes("--prod") || env.npm_config_prod === "true";
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function main() {
  const prod = isProd(process.argv.slice(2), process.env);
  let total = 0;
  let files = 0;
  for (const dir of DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const lines = todoLines(readFileSync(file, "utf8"));
      if (lines.length === 0) continue;
      files += 1;
      total += lines.length;
      console.log(`${relative(ROOT, file)}: line ${lines.join(", ")}`);
    }
  }

  if (total === 0) {
    console.log("check:todo: no placeholder copy left.");
    return;
  }
  const summary = `${total} placeholder(s) in ${files} file(s).`;
  if (prod) {
    console.error(`\n${summary} Placeholder copy must not ship.`);
    process.exitCode = 1;
  } else {
    console.log(`\n${summary} Fine while building; --prod fails on these.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
