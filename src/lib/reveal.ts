/**
 * Scroll reveal: marks [data-reveal] elements as revealed the first time
 * they enter the viewport, then stops watching them. The CSS in global.css
 * owns the animation, and the hidden state exists only under
 * prefers-reduced-motion: no-preference. See docs/04-motion.md §3.
 *
 * Nothing runs at import time. initReveal() is called on every
 * astro:page-load and is idempotent.
 */

/** Mirrors --reveal-stagger. */
export const STAGGER_STEP_MS = 80;
/** Past five steps a stagger reads as a slow page, not a sequence. */
export const STAGGER_CAP = 4;

/** The reveal delay for the nth sibling in a group: min(index, 4) × 80ms. */
export function staggerDelay(index: number): number {
  const step = Math.min(Math.max(Math.floor(index), 0), STAGGER_CAP);
  return step * STAGGER_STEP_MS;
}

const SELECTOR = "[data-reveal]:not([data-revealed])";
const watched = new WeakSet<Element>();

export function initReveal(): void {
  const elements = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // No observer, or no motion wanted: show everything now.
  if (reduced || !("IntersectionObserver" in window)) {
    for (const el of elements) el.dataset.revealed = "true";
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.revealed = "true";
        observer.unobserve(entry.target); // play once
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  for (const el of elements) {
    if (watched.has(el)) continue;
    watched.add(el);
    observer.observe(el);
  }
}
