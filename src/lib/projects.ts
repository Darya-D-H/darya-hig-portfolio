/**
 * Build-time helpers for the projects collection: grid order, the
 * unique-order check and prev/next neighbours. Pure functions over the
 * entries a page already loaded, so they are unit tested without Astro.
 * Nothing here ships to the browser. See docs/06-content-model.md §1.
 */

/** The parts of a project entry these helpers read. */
export interface ProjectLike {
  id: string;
  data: { title: string; order: number; draft?: boolean };
}

export interface Neighbour {
  slug: string;
  title: string;
}

/**
 * Throws if two projects share an `order`, naming both files, because order
 * drives the grid, the featured row and prev/next.
 */
export function assertUniqueOrder(projects: readonly ProjectLike[]): void {
  const seen = new Map<number, string>();
  for (const { id, data } of projects) {
    const other = seen.get(data.order);
    if (other !== undefined) {
      throw new Error(
        `Projects "${other}" and "${id}" both have order: ${data.order}. ` +
          `Give each project in src/content/projects/ a unique order.`,
      );
    }
    seen.set(data.order, id);
  }
}

/**
 * The projects in grid order (`order` ascending), drafts left out when
 * `includeDrafts` is false. Checks orders are unique first.
 */
export function sortProjects<T extends ProjectLike>(
  projects: readonly T[],
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): T[] {
  const visible = projects.filter((p) => includeDrafts || !p.data.draft);
  assertUniqueOrder(visible);
  return [...visible].sort((a, b) => a.data.order - b.data.order);
}

/**
 * The previous and next projects in grid order, skipping drafts. The first
 * project has no `prev` and the last no `next`: there is no wraparound
 * (docs/01-information-architecture.md §4). Throws for an unknown slug.
 */
export function getAdjacent(
  projects: readonly ProjectLike[],
  slug: string,
): { prev?: Neighbour; next?: Neighbour } {
  const ordered = sortProjects(projects);
  const index = ordered.findIndex((p) => p.id === slug);
  if (index === -1) {
    throw new Error(`No published project with the slug "${slug}".`);
  }
  const toNeighbour = (p: ProjectLike | undefined): Neighbour | undefined =>
    p ? { slug: p.id, title: p.data.title } : undefined;
  return {
    prev: toNeighbour(ordered[index - 1]),
    next: toNeighbour(ordered[index + 1]),
  };
}

/** How many projects Home features, no more and no fewer. */
export const FEATURED_COUNT = 3;

/**
 * The featured projects for Home, in grid order. Asserts there are exactly
 * three instead of slicing, so a fourth `featured: true` fails the build
 * loudly rather than vanishing (docs/06-content-model.md §1).
 */
export function selectFeatured<
  T extends ProjectLike & { data: { featured?: boolean } },
>(projects: readonly T[]): T[] {
  const featured = sortProjects(projects).filter((p) => p.data.featured);
  if (featured.length !== FEATURED_COUNT) {
    throw new Error(
      `Home expects exactly ${FEATURED_COUNT} featured projects, found ${featured.length}. ` +
        `Set featured: true on exactly three files in src/content/projects/.`,
    );
  }
  return featured;
}
