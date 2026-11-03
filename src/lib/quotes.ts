// Quote PDFs live in the private "quotes" bucket at  <lead_id>/<random id>.pdf
// The storage rules let a customer read only files under their own lead's folder.

export const MAX_QUOTE_BYTES = 10 * 1024 * 1024; // same limit as the bucket
export const QUOTE_LINK_SECONDS = 300; // signed links to a PDF last 5 minutes

export type Quote = {
  id: string;
  lead_id: string;
  note: string;
  pdf_path: string;
  created_at: string;
  proceed_at: string | null;
};

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function newQuotePath(leadId: string, fileId: string): string {
  return `${leadId}/${fileId}.pdf`;
}

/** True only for "<this lead>/<uuid>.pdf", so a path can't point into another lead's folder. */
export function isQuotePathFor(leadId: string, path: string): boolean {
  return new RegExp(`^${UUID}/${UUID}\\.pdf$`, "i").test(path) && path.startsWith(`${leadId}/`);
}

export function validateQuoteNote(raw: unknown): string | null {
  const note = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return note.length >= 1 && note.length <= 500 ? note : null;
}
