import { describe, expect, it } from "vitest";
import { buildScorecard, type ScoreLead } from "@/lib/scorecard";

const now = new Date("2026-11-03T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 864e5).toISOString();
const lead = (over: Partial<ScoreLead>): ScoreLead => ({
  stage: "new",
  source: "radio",
  new_at: daysAgo(10),
  contacted_at: null,
  info_sent_at: null,
  quote_sent_at: null,
  bound_at: null,
  is_example: false,
  ...over,
});

describe("scorecard", () => {
  const leads = [
    lead({ source: "anibal" }), // new
    lead({ source: "anibal", stage: "contacted", contacted_at: daysAgo(9) }),
    lead({ source: "anibal", stage: "quote_sent", contacted_at: "x", info_sent_at: "x", quote_sent_at: "x" }),
    lead({ source: "radio", stage: "bound", contacted_at: "x", info_sent_at: "x", quote_sent_at: "x", bound_at: "x" }),
    lead({ source: "radio", stage: "not_bought", contacted_at: "x", info_sent_at: "x", quote_sent_at: "x" }),
    lead({ source: null, stage: "info_sent", info_sent_at: "x" }), // skipped "contacted" still counts
    lead({ source: "radio", new_at: daysAgo(400) }), // older than 12 months: not counted
    lead({ source: "event", is_example: true }), // example: not counted
  ];
  const s = buildScorecard(leads, now);

  it("counts referrals in the last 12 months, without examples", () => {
    expect(s.total).toBe(6);
  });

  it("% of referrals that reached each step (a later step counts the earlier ones)", () => {
    expect(s.steps).toEqual([
      { step: "contacted", count: 5, pct: 83 },
      { step: "info_sent", count: 4, pct: 67 },
      { step: "quote_sent", count: 3, pct: 50 },
      { step: "bound", count: 1, pct: 17 },
    ]);
  });

  it("counts by how they heard about IPT, largest first", () => {
    expect(s.bySource).toEqual([
      { source: "anibal", count: 3, pct: 50 },
      { source: "radio", count: 2, pct: 33 },
      { source: null, count: 1, pct: 17 },
    ]);
  });

  it("an empty year gives zeros, not errors", () => {
    expect(buildScorecard([], now)).toEqual({
      total: 0,
      steps: [
        { step: "contacted", count: 0, pct: 0 },
        { step: "info_sent", count: 0, pct: 0 },
        { step: "quote_sent", count: 0, pct: 0 },
        { step: "bound", count: 0, pct: 0 },
      ],
      bySource: [],
    });
  });
});
