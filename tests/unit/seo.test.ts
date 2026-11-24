import { describe, expect, it } from "vitest";
import { canonicalUrl, metaDescription, pageTitle } from "@/lib/seo";

describe("pageTitle", () => {
  it("adds the site name", () => {
    expect(pageTitle("Skills")).toBe("Skills — Darya");
  });

  it("does not double a suffix that is already there", () => {
    expect(pageTitle("Skills — Darya")).toBe("Skills — Darya");
  });

  it("gives Home the name and role", () => {
    expect(pageTitle()).toBe("Darya — Software Developer");
    expect(pageTitle("   ")).toBe("Darya — Software Developer");
  });

  it("collapses stray whitespace", () => {
    expect(pageTitle("  Invoice\n Tracker ")).toBe("Invoice Tracker — Darya");
  });
});

describe("metaDescription", () => {
  it("leaves a short description alone", () => {
    expect(metaDescription("One line.")).toBe("One line.");
  });

  it("cuts a long one at a word boundary, within the limit", () => {
    const long =
      "An embeddable booking widget that lets patients pick a slot from live availability and confirm in two taps, without leaving the clinic site, ever again.";
    const out = metaDescription(long, 100);
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out.endsWith("…")).toBe(true);
    // Every word kept is whole.
    const kept = out.slice(0, -1).split(" ");
    for (const word of kept) expect(long.split(" ")).toContain(word);
  });

  it("never splits a word, even right at the limit", () => {
    expect(metaDescription("alpha beta gamma", 12)).toBe("alpha beta…");
  });

  it("does not leave trailing punctuation before the ellipsis", () => {
    expect(metaDescription("first part, second part goes on", 13)).toBe(
      "first part…",
    );
  });

  it("uses the 160-character limit by default", () => {
    expect(metaDescription("word ".repeat(60)).length).toBeLessThanOrEqual(160);
  });

  it("keeps special characters as text, because Astro escapes them", () => {
    const text = `R&D for "quotes" <and> it's`;
    expect(metaDescription(text)).toBe(text);
  });
});

describe("canonicalUrl", () => {
  const origin = "https://example.com";

  it("builds an absolute URL with the trailing slash the sitemap uses", () => {
    expect(canonicalUrl("/skills", origin)).toBe("https://example.com/skills/");
  });

  it("drops a query and a fragment, keeping one trailing slash", () => {
    expect(canonicalUrl("/skills/?ref=x#top", origin)).toBe(
      "https://example.com/skills/",
    );
  });

  it("keeps the root as /", () => {
    expect(canonicalUrl("/", origin)).toBe("https://example.com/");
  });
});
