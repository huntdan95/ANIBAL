// Shapes of the main records, matching supabase/migrations.

export const STAGES = ["new", "contacted", "info_sent", "quote_sent", "bound", "not_bought", "not_fit"] as const;
export type Stage = (typeof STAGES)[number];

export const OPEN_STAGES: Stage[] = ["new", "contacted", "info_sent", "quote_sent"];
export const CLOSED_STAGES: Stage[] = ["not_bought", "not_fit"];

export const SOURCES = ["radio", "newsletter", "magazine", "anibal", "event", "other"] as const;
export type Source = (typeof SOURCES)[number];

export type Lead = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  business_name: string | null;
  language: "es" | "en";
  needs_notes: string | null;
  source: Source | null;
  referrer_id: string | null;
  customer_id: string | null;
  stage: Stage;
  new_at: string;
  contacted_at: string | null;
  info_sent_at: string | null;
  quote_sent_at: string | null;
  bound_at: string | null;
  closed_at: string | null;
  is_example: boolean;
};

export const LEAD_COLUMNS =
  "id, full_name, phone, email, street, city, state, zip, business_name, language, needs_notes, source, referrer_id, customer_id, stage, new_at, contacted_at, info_sent_at, quote_sent_at, bound_at, closed_at, is_example";
