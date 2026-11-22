import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Astro's image() resolves a path only when a page renders it, so a
// misspelt path in a draft, or before any page renders the collection,
// would build cleanly. This checks every image path in the content front
// matter exists (docs/06-content-model.md §1).
const CONTENT = resolve(import.meta.dirname, "../../src/content");
const IMAGE_PATH =
  /["']?(\.{1,2}\/[^"'\s]+\.(?:png|jpe?g|webp|avif|gif|svg))["']?/g;

const markdownFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith(".md") ? [path] : [];
  });

describe("content images", () => {
  const files = markdownFiles(CONTENT);

  it("finds the content files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((file) => [file.slice(CONTENT.length + 1), file]))(
    "%s points only at images that exist",
    (_name, file) => {
      const frontMatter = readFileSync(file, "utf8").split(/^---$/m)[1] ?? "";
      const missing = [...frontMatter.matchAll(IMAGE_PATH)]
        .map((match) => match[1] ?? "")
        .filter((path) => !existsSync(resolve(dirname(file), path)));
      expect(missing).toEqual([]);
    },
  );
});
