import { describe, expect, it } from "vitest";
import { validatePrivate } from "@/lib/leads/private";
import { isQuotePathFor, newQuotePath, validateQuoteNote } from "@/lib/quotes";

const lead = "11111111-2222-4333-8444-555555555555";
const other = "99999999-2222-4333-8444-555555555555";
const file = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("quote PDF paths", () => {
  it("only accepts <this lead>/<uuid>.pdf", () => {
    expect(isQuotePathFor(lead, newQuotePath(lead, file))).toBe(true);
    expect(isQuotePathFor(lead, newQuotePath(other, file))).toBe(false); // another lead's folder
    expect(isQuotePathFor(lead, `${lead}/../${other}/${file}.pdf`)).toBe(false);
    expect(isQuotePathFor(lead, `${lead}/${file}.exe`)).toBe(false);
    expect(isQuotePathFor(lead, `${lead}/notes.pdf`)).toBe(false);
  });

  it("quote notes are short and trimmed", () => {
    expect(validateQuoteNote("  Opción 1:  $350/mes   con Progressive ")).toBe("Opción 1: $350/mes con Progressive");
    expect(validateQuoteNote("   ")).toBeNull();
    expect(validateQuoteNote("x".repeat(501))).toBeNull();
  });
});

describe("Danny-only details", () => {
  const fd = (fields: Record<string, string | string[]>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) f.append(k, x);
    return f;
  };

  it("reads coverage lines, money like '$4,800', and notes", () => {
    const { input, errors } = validatePrivate(
      fd({ coverage: ["gl", "wc", "bogus"], est_premium: "$4,800", commission: "480.50", notes: " call after 5 " }),
    );
    expect(errors).toEqual({});
    expect(input).toEqual({
      coverage_lines: ["wc", "gl"],
      est_premium: 4800,
      commission: 480.5,
      notes: "call after 5",
    });
  });

  it("empty amounts are fine; nonsense or negative amounts are not", () => {
    expect(validatePrivate(fd({})).input).toEqual({
      coverage_lines: [],
      est_premium: null,
      commission: null,
      notes: null,
    });
    expect(validatePrivate(fd({ est_premium: "lots", commission: "-5" })).errors).toEqual({
      est_premium: "money",
      commission: "money",
    });
  });
});
