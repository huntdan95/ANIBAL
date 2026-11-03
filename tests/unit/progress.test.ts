import { describe, expect, it } from "vitest";
import { progressSteps, reached } from "@/lib/leads/progress";
import type { Stage } from "@/lib/types";

const lead = (
  stage: Stage,
  dates: Partial<Record<"contacted_at" | "info_sent_at" | "quote_sent_at" | "bound_at", string>> = {},
) => ({
  stage,
  contacted_at: null,
  info_sent_at: null,
  quote_sent_at: null,
  bound_at: null,
  ...dates,
});
const done = (l: ReturnType<typeof lead>) => progressSteps(l).map((s) => s.done);

describe("progress bar", () => {
  it("a New lead has no steps done", () => {
    expect(done(lead("new"))).toEqual([false, false, false, false]);
  });

  it("each stage fills the bar up to itself, with dates", () => {
    const l = lead("quote_sent", {
      contacted_at: "2026-11-01",
      info_sent_at: "2026-11-02",
      quote_sent_at: "2026-11-03",
    });
    expect(progressSteps(l)).toEqual([
      { step: "contacted", done: true, date: "2026-11-01" },
      { step: "info_sent", done: true, date: "2026-11-02" },
      { step: "quote_sent", done: true, date: "2026-11-03" },
      { step: "bound", done: false, date: null },
    ]);
  });

  it("a skipped step shows done with no date", () => {
    // Customer sent their info before Danny marked "Contacted".
    const steps = progressSteps(lead("info_sent", { info_sent_at: "2026-11-02" }));
    expect(steps[0]).toEqual({ step: "contacted", done: true, date: null });
    expect(steps[1]).toEqual({ step: "info_sent", done: true, date: "2026-11-02" });
  });

  it("a closed lead shows how far it got", () => {
    expect(done(lead("not_bought", { contacted_at: "a", info_sent_at: "b", quote_sent_at: "c" }))).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(done(lead("not_fit"))).toEqual([false, false, false, false]);
  });

  it("if Danny moves a lead back, later steps are no longer shown as done", () => {
    expect(done(lead("contacted", { contacted_at: "a", info_sent_at: "b" }))).toEqual([true, false, false, false]);
  });
});

describe("reached (for the scorecard)", () => {
  it("counts a step reached by date or by being past it", () => {
    expect(reached(lead("info_sent", { info_sent_at: "x" }), "contacted")).toBe(true);
    expect(reached(lead("not_bought", { quote_sent_at: "x" }), "quote_sent")).toBe(true);
    expect(reached(lead("not_bought", { quote_sent_at: "x" }), "bound")).toBe(false);
    expect(reached(lead("new"), "contacted")).toBe(false);
  });
});

describe("friendly dates", async () => {
  const { formatDay } = await import("@/lib/format");
  const words = { today: "Hoy", yesterday: "Ayer" };
  const now = new Date("2026-11-03T18:00:00Z"); // noon in Nashville
  it("says hoy / ayer for recent events, the date otherwise", () => {
    expect(formatDay("2026-11-03T15:00:00Z", "es", words, now)).toBe("hoy");
    expect(formatDay("2026-11-02T20:00:00Z", "es", words, now)).toBe("ayer");
    expect(formatDay("2026-10-30T20:00:00Z", "es", words, now)).toBe("30 oct");
    expect(formatDay("2026-10-30T20:00:00Z", "en", { today: "Today", yesterday: "Yesterday" }, now)).toBe("Oct 30");
  });
});
