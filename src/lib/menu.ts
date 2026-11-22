/**
 * Mobile menu: open and close, focus trap, Escape, focus return, inert
 * background, scroll lock, and close-on-resize. Also keeps aria-current
 * right on the persisted nav after a view transition.
 * See docs/03-components.md §2.4.
 *
 * Nothing runs at import time. initMenu() is called on every astro:page-load
 * and is idempotent.
 */

/**
 * The aria-current value for a link: "page" on the page itself, "true" for
 * a page inside its section (a project under /projects), otherwise none.
 */
export function currentState(
  pathname: string,
  href: string,
): "page" | "true" | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === href) return "page";
  if (href !== "/" && path.startsWith(`${href}/`)) return "true";
  return undefined;
}

/**
 * The index focus moves to when Tab (or Shift+Tab) is pressed at `current`
 * in a list of `count` focusable elements, wrapping at both ends. Focus
 * outside the list (-1) enters at the first or last element.
 */
export function nextFocusIndex(
  current: number,
  count: number,
  backwards: boolean,
): number {
  if (count <= 0) return -1;
  if (current < 0 || current >= count) return backwards ? count - 1 : 0;
  return (current + (backwards ? count - 1 : 1)) % count;
}

interface Parts {
  root: HTMLElement;
  trigger: HTMLButtonElement;
  panel: HTMLElement;
}

function parts(): Parts | null {
  const root = document.querySelector<HTMLElement>("[data-mobile-menu]");
  const trigger = document.querySelector<HTMLButtonElement>(
    "[data-menu-trigger]",
  );
  const panel = root?.querySelector<HTMLElement>(".panel");
  return root && trigger && panel ? { root, trigger, panel } : null;
}

const isOpen = (root: HTMLElement) => root.dataset.open === "true";

const focusables = (panel: HTMLElement) => [
  ...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
];

function setBackgroundInert(root: HTMLElement, inert: boolean): void {
  for (const el of document.body.children) {
    if (el === root || !(el instanceof HTMLElement) || el.tagName === "SCRIPT")
      continue;
    if ("inert" in el) {
      el.inert = inert;
    } else if (inert) {
      // Fallback for engines without `inert`.
      (el as HTMLElement).setAttribute("aria-hidden", "true");
    } else {
      (el as HTMLElement).removeAttribute("aria-hidden");
    }
  }
}

function open(): void {
  const p = parts();
  if (!p || isOpen(p.root)) return;
  p.root.dataset.open = "true";
  p.trigger.setAttribute("aria-expanded", "true");
  setBackgroundInert(p.root, true);
  document.body.style.overflow = "hidden";
  p.panel.querySelector<HTMLElement>("a[href]")?.focus();
}

function close({ returnFocus = true } = {}): void {
  const p = parts();
  if (!p || !isOpen(p.root)) return;
  p.root.dataset.open = "false";
  p.trigger.setAttribute("aria-expanded", "false");
  setBackgroundInert(p.root, false);
  document.body.style.overflow = "";
  if (returnFocus) p.trigger.focus();
}

function onKeydown(event: KeyboardEvent): void {
  const p = parts();
  if (!p || !isOpen(p.root)) return;
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== "Tab") return;
  const items = focusables(p.panel);
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = nextFocusIndex(current, items.length, event.shiftKey);
  if (next >= 0) {
    event.preventDefault();
    items[next]?.focus();
  }
}

/** Sets aria-current on every nav link for the current URL. */
function syncCurrentLinks(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    "a[data-nav-link]",
  )) {
    const state = currentState(
      location.pathname,
      link.getAttribute("href") ?? "",
    );
    if (state) link.setAttribute("aria-current", state);
    else link.removeAttribute("aria-current");
  }
}

let documentBound = false;

export function initMenu(): void {
  syncCurrentLinks();

  const p = parts();
  if (!p) return;

  // The menu persists across view transitions, so its listeners are bound
  // once. A fresh element (after a full load) is bound again.
  if (p.root.dataset.initialised !== "true") {
    p.root.dataset.initialised = "true";
    p.trigger.addEventListener("click", () =>
      isOpen(p.root) ? close() : open(),
    );
    p.root
      .querySelector("[data-menu-close]")
      ?.addEventListener("click", () => close());
    p.root
      .querySelector("[data-menu-scrim]")
      ?.addEventListener("click", () => close());
    for (const link of p.panel.querySelectorAll("a[href]")) {
      link.addEventListener("click", () => close({ returnFocus: false }));
    }
  }

  if (!documentBound) {
    documentBound = true;
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("astro:before-swap", () =>
      close({ returnFocus: false }),
    );
    const desktop = getComputedStyle(document.documentElement)
      .getPropertyValue("--breakpoint-md")
      .trim();
    if (desktop) {
      matchMedia(`(min-width: ${desktop})`).addEventListener(
        "change",
        (event) => {
          if (event.matches) close({ returnFocus: false });
        },
      );
    }
  }
}
