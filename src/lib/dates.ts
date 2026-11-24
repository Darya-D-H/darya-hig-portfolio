/**
 * Dates on the Experience page are "YYYY-MM" strings (docs/06-content-model.md
 * §2): the precision a role or a qualification really has, and the value a
 * <time datetime> wants. These format them for display.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * "2024-03" → "Mar 2024". Built from the parts, never from a Date, so no
 * timezone can shift an entry into the previous month.
 */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const name = MONTHS[Number(month) - 1];
  if (!year || !name) throw new Error(`Not a YYYY-MM date: "${yearMonth}"`);
  return `${name} ${year}`;
}
