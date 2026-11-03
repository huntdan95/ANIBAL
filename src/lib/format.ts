import type { Lang } from "@/i18n/messages";

/** "6155550101" -> "(615) 555-0101" */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : digits;
}

/** "3 nov" / "Nov 3" (adds the year if it isn't this year). Shown in Nashville time. */
export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const s = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: "America/Chicago",
  }).format(d);
  return s.replace(".", "");
}

/** Whole days between a date and now. */
export function daysSince(iso: string, now = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

/** Lowercase, no accents: "Pérez" -> "perez". For search. */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
