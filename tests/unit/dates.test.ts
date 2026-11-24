import { describe, expect, it } from "vitest";
import { formatYearMonth } from "@/lib/dates";

describe("formatYearMonth", () => {
  it("names the month and keeps the year", () => {
    expect(formatYearMonth("2024-03")).toBe("Mar 2024");
    expect(formatYearMonth("2021-12")).toBe("Dec 2021");
    expect(formatYearMonth("2017-01")).toBe("Jan 2017");
  });

  it("never shifts a month, whatever the timezone", () => {
    // A Date built from "2024-03" is midnight UTC on 1 March, which is still
    // February west of Greenwich. The string is never parsed as a Date.
    expect(formatYearMonth("2024-03")).toBe("Mar 2024");
  });

  it("refuses a value that is not YYYY-MM", () => {
    expect(() => formatYearMonth("2024-13")).toThrow();
    expect(() => formatYearMonth("March 2024")).toThrow();
  });
});
