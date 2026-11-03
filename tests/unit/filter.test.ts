import { describe, expect, it } from "vitest";
import { asFilter, filterLeads } from "@/lib/leads/filter";
import type { Stage } from "@/lib/types";

const lead = (full_name: string, phone: string, stage: Stage, business_name: string | null = null) => ({
  full_name,
  phone,
  stage,
  business_name,
});

const leads = [
  lead("Juan Pérez", "6155550101", "new", "Pérez Framing"),
  lead("María López", "6155550102", "quote_sent"),
  lead("Carlos Ramírez", "7065550103", "bound"),
  lead("Ana Gómez", "6155550104", "not_bought"),
  lead("Luis Díaz", "6155550105", "not_fit"),
];
const names = (xs: { full_name: string }[]) => xs.map((x) => x.full_name);

describe("lead list filters", () => {
  it("Open / Bound / Closed / All", () => {
    expect(names(filterLeads(leads, "open", ""))).toEqual(["Juan Pérez", "María López"]);
    expect(names(filterLeads(leads, "bound", ""))).toEqual(["Carlos Ramírez"]);
    expect(names(filterLeads(leads, "closed", ""))).toEqual(["Ana Gómez", "Luis Díaz"]);
    expect(filterLeads(leads, "all", "")).toHaveLength(5);
  });

  it("search ignores accents and capitals", () => {
    expect(names(filterLeads(leads, "all", "perez"))).toEqual(["Juan Pérez"]);
    expect(names(filterLeads(leads, "all", "MARIA"))).toEqual(["María López"]);
    expect(names(filterLeads(leads, "all", "framing"))).toEqual(["Juan Pérez"]);
  });

  it("search by phone works with dashes or parentheses", () => {
    expect(names(filterLeads(leads, "all", "(706) 555"))).toEqual(["Carlos Ramírez"]);
    expect(names(filterLeads(leads, "all", "555-0104"))).toEqual(["Ana Gómez"]);
  });

  it("unknown filter values fall back to Open", () => {
    expect(asFilter("nonsense")).toBe("open");
    expect(asFilter(undefined)).toBe("open");
  });
});
