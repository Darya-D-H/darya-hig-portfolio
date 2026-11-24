import { describe, expect, it } from "vitest";
import { byOrder, fromEducation, fromRole } from "@/lib/timeline";

describe("fromRole", () => {
  it("maps a role onto the shared timeline shape", () => {
    expect(
      fromRole({
        role: "Engineer",
        company: "Acme",
        companyUrl: "https://acme.example",
        startDate: "2024-03",
        location: "Remote",
        bullets: ["Did a thing.", "Did another."],
        order: 1,
      }),
    ).toEqual({
      title: "Engineer",
      organisation: "Acme",
      organisationUrl: "https://acme.example",
      startDate: "2024-03",
      endDate: undefined,
      location: "Remote",
      points: ["Did a thing.", "Did another."],
      order: 1,
    });
  });
});

describe("fromEducation", () => {
  it("maps a qualification, keeping an empty details list empty", () => {
    expect(
      fromEducation({
        qualification: "BSc Computer Science",
        institution: "University",
        startDate: "2017-09",
        endDate: "2021-06",
        details: [],
        order: 2,
      }),
    ).toMatchObject({
      title: "BSc Computer Science",
      organisation: "University",
      startDate: "2017-09",
      endDate: "2021-06",
      points: [],
      order: 2,
    });
  });
});

describe("byOrder", () => {
  it("puts the lowest order first without changing the input", () => {
    const entry = (order: number) => ({
      title: `t${order}`,
      organisation: "o",
      startDate: "2020-01",
      points: [],
      order,
    });
    const input = [entry(3), entry(1), entry(2)];
    expect(byOrder(input).map((e) => e.order)).toEqual([1, 2, 3]);
    expect(input.map((e) => e.order)).toEqual([3, 1, 2]);
  });
});
