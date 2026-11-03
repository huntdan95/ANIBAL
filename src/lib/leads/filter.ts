import { fold } from "@/lib/format";
import { CLOSED_STAGES, OPEN_STAGES, type Lead } from "@/lib/types";

export const FILTERS = ["open", "bound", "closed", "all"] as const;
export type Filter = (typeof FILTERS)[number];

export function asFilter(v: unknown): Filter {
  return (FILTERS as readonly unknown[]).includes(v) ? (v as Filter) : "open";
}

/** Open / Bound / Closed / All, plus search by name or phone (accents and dashes ignored). */
export function filterLeads<T extends Pick<Lead, "stage" | "full_name" | "phone" | "business_name">>(
  leads: T[],
  filter: Filter,
  query: string,
): T[] {
  const q = fold(query.trim());
  const qDigits = query.replace(/\D/g, "");
  return leads.filter((l) => {
    if (filter === "open" && !OPEN_STAGES.includes(l.stage)) return false;
    if (filter === "bound" && l.stage !== "bound") return false;
    if (filter === "closed" && !CLOSED_STAGES.includes(l.stage)) return false;
    if (!q) return true;
    if (fold(l.full_name).includes(q) || (l.business_name && fold(l.business_name).includes(q))) return true;
    return qDigits.length >= 3 && l.phone.includes(qDigits);
  });
}
