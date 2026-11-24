/**
 * The Experience page draws two timelines, roles and education, with one
 * component (docs/03-components.md §4.2). Each collection is mapped to this
 * shared shape so the component never needs to know which it is showing.
 */
import type { CollectionEntry } from "astro:content";

export interface TimelineEntry {
  /** The node's h3: a role, or a qualification. */
  title: string;
  /** A company, or an institution. */
  organisation: string;
  organisationUrl?: string;
  /** "YYYY-MM". */
  startDate: string;
  /** "YYYY-MM"; absent means current or in progress. */
  endDate?: string;
  location?: string;
  /** Achievement bullets, or education details. May be empty. */
  points: string[];
  order: number;
}

type Role = CollectionEntry<"experience">["data"];
type Education = CollectionEntry<"education">["data"];

export function fromRole(role: Role): TimelineEntry {
  return {
    title: role.role,
    organisation: role.company,
    organisationUrl: role.companyUrl,
    startDate: role.startDate,
    endDate: role.endDate,
    location: role.location,
    points: role.bullets,
    order: role.order,
  };
}

export function fromEducation(entry: Education): TimelineEntry {
  return {
    title: entry.qualification,
    organisation: entry.institution,
    organisationUrl: entry.institutionUrl,
    startDate: entry.startDate,
    endDate: entry.endDate,
    location: entry.location,
    points: entry.details,
    order: entry.order,
  };
}

/** Newest first: ascending `order`, which the content files set. */
export function byOrder(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => a.order - b.order);
}
