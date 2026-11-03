// Danny-only details on a lead (table public.lead_private). Never shown to Aníbal or the customer;
// the database blocks them too.

export const COVERAGE_LINES = ["wc", "gl", "auto", "property", "bonds", "health", "personal", "other"] as const;
export type CoverageLine = (typeof COVERAGE_LINES)[number];

export type PrivateDetails = {
  coverage_lines: CoverageLine[];
  est_premium: number | null;
  commission: number | null;
  notes: string | null;
};

export type PrivateErrors = Partial<Record<"est_premium" | "commission" | "notes", "money" | "tooLong">>;

const money = (raw: string): number | null | "error" => {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 && n < 100_000_000 ? Math.round(n * 100) / 100 : "error";
};

export function validatePrivate(fd: FormData): { input: PrivateDetails; errors: PrivateErrors } {
  const picked = fd.getAll("coverage").map(String);
  const errors: PrivateErrors = {};
  const premium = money(String(fd.get("est_premium") ?? ""));
  const commission = money(String(fd.get("commission") ?? ""));
  const notes = String(fd.get("notes") ?? "").trim();
  if (premium === "error") errors.est_premium = "money";
  if (commission === "error") errors.commission = "money";
  if (notes.length > 5000) errors.notes = "tooLong";
  return {
    input: {
      coverage_lines: COVERAGE_LINES.filter((c) => picked.includes(c)),
      est_premium: premium === "error" ? null : premium,
      commission: commission === "error" ? null : commission,
      notes: notes || null,
    },
    errors,
  };
}
