// @ts-check
/// <reference types="node" />
// node scripts/lighthouse-summary.mjs
//
// After a Lighthouse CI run, prints one GitHub annotation per page with its
// Largest Contentful Paint: the median time, which element it was, and the
// time split into its four phases. Annotations show on the run page without
// signing in, unlike the job log, so a budget failure can be diagnosed from
// the PR. Reads the lhr-*.json files LHCI leaves in .lighthouseci/.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = ".lighthouseci";

/** @type {Map<string, any[]>} */
const byUrl = new Map();
let files = [];
try {
  files = readdirSync(DIR).filter((f) => /^lhr-.*\.json$/.test(f));
} catch {
  console.log(`::warning::No ${DIR} directory; Lighthouse did not run.`);
  process.exit(0);
}

for (const file of files) {
  const lhr = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  const path = new URL(lhr.finalDisplayedUrl ?? lhr.finalUrl).pathname;
  byUrl.set(path, [...(byUrl.get(path) ?? []), lhr]);
}

const ms = (/** @type {number | undefined} */ n) =>
  n === undefined ? "?" : `${Math.round(n)}ms`;

for (const [path, runs] of [...byUrl].sort()) {
  const sorted = [...runs].sort(
    (a, b) =>
      a.audits["largest-contentful-paint"].numericValue -
      b.audits["largest-contentful-paint"].numericValue,
  );
  const median = sorted[Math.floor(sorted.length / 2)];
  const lcp = median.audits["largest-contentful-paint"].numericValue;
  const element = median.audits["largest-contentful-paint-element"];
  const tables = element?.details?.items ?? [];
  const node = tables[0]?.items?.[0]?.node;
  const phases = (tables[1]?.items ?? [])
    .map(
      (/** @type {{ phase: string, timing: number }} */ p) =>
        `${p.phase} ${ms(p.timing)}`,
    )
    .join(", ");
  const what = node?.snippet ?? node?.nodeLabel ?? "unknown element";
  const all = sorted
    .map((r) => ms(r.audits["largest-contentful-paint"].numericValue))
    .join(" / ");
  const level = lcp > 2000 ? "warning" : "notice";
  console.log(
    `::${level} title=LCP ${path}::median ${ms(lcp)} (runs ${all}) on ${what.slice(0, 120)}. ${phases}`,
  );
}
