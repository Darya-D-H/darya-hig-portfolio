/**
 * Gallery lightbox on the native <dialog> (docs/03-components.md §4.3).
 * showModal() gives the focus trap, Escape, the top layer and an inert
 * background from the platform. This module adds: upgrading the no-JS
 * thumbnail links into buttons, arrow keys and swipe, prev/next disabled at
 * the ends (no wraparound), the "Image N of M" announcement, and focus
 * returning to the thumbnail that opened it.
 *
 * Nothing runs at import time. initLightbox() is called on every
 * astro:page-load and is idempotent.
 */

/** Keeps an index inside [0, count - 1]: the ends do not wrap. */
export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), count - 1);
}

/** What the live region says: always 1-based. */
export function announcement(index: number, count: number): string {
  return `Image ${clampIndex(index, count) + 1} of ${count}`;
}

/** Horizontal travel, in CSS pixels, that counts as a swipe. */
const SWIPE_DISTANCE = 40;

interface Slide {
  src: string;
  alt: string;
  trigger: HTMLButtonElement;
}

/**
 * Without JavaScript each thumbnail is a link to the full image. With it,
 * each becomes a real <button> that opens the dialog: the right element for
 * an action, with the image's alt text as its name.
 */
function upgradeTriggers(gallery: HTMLElement): Slide[] {
  const links = gallery.querySelectorAll<HTMLAnchorElement>(
    "a[data-lightbox-trigger]",
  );
  return [...links].map((link) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = link.className;
    button.dataset.lightboxTrigger = "";
    button.append(...link.childNodes);
    link.replaceWith(button);
    const img = button.querySelector("img");
    return { src: link.href, alt: img?.alt ?? "", trigger: button };
  });
}

function bind(gallery: HTMLElement, dialog: HTMLDialogElement): void {
  const slides = upgradeTriggers(gallery);
  const image = dialog.querySelector<HTMLImageElement>("[data-lightbox-image]");
  const prev = dialog.querySelector<HTMLButtonElement>("[data-lightbox-prev]");
  const next = dialog.querySelector<HTMLButtonElement>("[data-lightbox-next]");
  const close = dialog.querySelector<HTMLButtonElement>(
    "[data-lightbox-close]",
  );
  const status = dialog.querySelector<HTMLElement>("[data-lightbox-status]");
  if (!image || !prev || !next || !close || !status || slides.length === 0)
    return;

  let current = 0;
  let opener: HTMLElement | null = null;

  const show = (index: number) => {
    current = clampIndex(index, slides.length);
    const slide = slides[current];
    if (!slide) return;
    image.dataset.swapping = "true";
    image.alt = slide.alt;
    image.src = slide.src;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    status.textContent = announcement(current, slides.length);
    // A button that just became disabled would drop focus to the page.
    if (document.activeElement instanceof HTMLButtonElement) {
      if (document.activeElement.disabled) close.focus();
    }
  };

  image.addEventListener("load", () => {
    delete image.dataset.swapping;
  });

  slides.forEach((slide, index) => {
    slide.trigger.addEventListener("click", () => {
      opener = slide.trigger;
      show(index);
      dialog.showModal();
      close.focus();
    });
  });

  prev.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  close.addEventListener("click", () => dialog.close());

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(current - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      show(current + 1);
    }
  });

  // The dialog box fills the viewport; a click on it rather than on its
  // contents is a click on the scrim.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  let startX: number | null = null;
  image.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
  });
  image.addEventListener("pointerup", (event) => {
    if (startX === null) return;
    const travel = event.clientX - startX;
    startX = null;
    if (Math.abs(travel) < SWIPE_DISTANCE) return;
    show(current + (travel < 0 ? 1 : -1));
  });

  // Escape, the close button and the scrim all end here.
  dialog.addEventListener("close", () => {
    status.textContent = "";
    opener?.focus();
  });
}

export function initLightbox(): void {
  for (const gallery of document.querySelectorAll<HTMLElement>(
    "[data-gallery]",
  )) {
    if (gallery.dataset.initialised === "true") continue;
    const dialog = gallery.querySelector<HTMLDialogElement>(
      "dialog[data-lightbox]",
    );
    if (!dialog || typeof dialog.showModal !== "function") continue;
    gallery.dataset.initialised = "true";
    bind(gallery, dialog);
  }
}
