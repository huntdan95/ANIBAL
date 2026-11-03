import type { Lead, Stage } from "@/lib/types";

/** The 4 steps everyone sees on the progress bar. "New" is the starting point, not a step. */
export const STEPS = ["contacted", "info_sent", "quote_sent", "bound"] as const;
export type Step = (typeof STEPS)[number];

const DATE_OF: Record<Step, keyof Lead> = {
  contacted: "contacted_at",
  info_sent: "info_sent_at",
  quote_sent: "quote_sent_at",
  bound: "bound_at",
};

/** Same as public.stage_rank() in the database. Closed stages are -1. */
export function stageRank(stage: Stage): number {
  return { new: 0, contacted: 1, info_sent: 2, quote_sent: 3, bound: 4, not_bought: -1, not_fit: -1 }[stage];
}

export type StepState = { step: Step; done: boolean; date: string | null };

type ProgressLead = Pick<Lead, "stage" | "contacted_at" | "info_sent_at" | "quote_sent_at" | "bound_at">;

/**
 * Which steps are done, and the date each was reached.
 * - Open leads: every step up to the current stage is done. A step that was
 *   skipped (for example, the customer sent info before Danny marked
 *   "Contacted") shows done with no date.
 * - Closed leads: shows how far they got before closing.
 */
export function progressSteps(lead: ProgressLead): StepState[] {
  const rank = stageRank(lead.stage);
  return STEPS.map((step, i) => {
    const done =
      rank >= 0 ? rank >= i + 1 : STEPS.slice(i).some((s) => Boolean(lead[DATE_OF[s] as keyof ProgressLead]));
    const date = (lead[DATE_OF[step] as keyof ProgressLead] as string | null) ?? null;
    return { step, done, date: done ? date : null };
  });
}

/** Has this lead ever reached the step? Used by the scorecard. */
export function reached(lead: ProgressLead, step: Step): boolean {
  const rank = stageRank(lead.stage);
  const k = STEPS.indexOf(step) + 1;
  if (rank >= k) return true;
  return STEPS.slice(k - 1).some((s) => Boolean(lead[DATE_OF[s] as keyof ProgressLead]));
}
