// Danny's scorecard numbers. Pure: give it leads, get the numbers.
import { reached, STEPS, type Step } from "@/lib/leads/progress";
import { SOURCES, type Lead, type Source } from "@/lib/types";

export type ScoreLead = Pick<
  Lead,
  "stage" | "source" | "new_at" | "contacted_at" | "info_sent_at" | "quote_sent_at" | "bound_at" | "is_example"
>;

export type Scorecard = {
  total: number;
  steps: { step: Step; count: number; pct: number }[];
  bySource: { source: Source | null; count: number; pct: number }[];
};

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

/**
 * Referrals that came in during the last 12 months (example leads don't count),
 * how far they got (each step counts if it was ever reached), and where they came from.
 */
export function buildScorecard(leads: ScoreLead[], now = new Date()): Scorecard {
  const since = new Date(now);
  since.setFullYear(since.getFullYear() - 1);
  const recent = leads.filter((l) => !l.is_example && new Date(l.new_at) >= since && new Date(l.new_at) <= now);
  const total = recent.length;

  const steps = STEPS.map((step) => {
    const count = recent.filter((l) => reached(l, step)).length;
    return { step, count, pct: pct(count, total) };
  });

  const counts = new Map<Source | null, number>();
  for (const l of recent) counts.set(l.source ?? null, (counts.get(l.source ?? null) ?? 0) + 1);
  const order = (s: Source | null) => (s === null ? SOURCES.length : SOURCES.indexOf(s));
  const bySource = [...counts.entries()]
    .map(([source, count]) => ({ source, count, pct: pct(count, total) }))
    .sort((a, b) => b.count - a.count || order(a.source) - order(b.source));

  return { total, steps, bySource };
}
