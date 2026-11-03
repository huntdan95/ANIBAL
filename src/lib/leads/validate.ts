// Checks the referral form. Used on the server (the real check) and its error
// codes are turned into words by the translation file.
import { STATE_CODES } from "@/lib/states";
import { SOURCES, type Source } from "@/lib/types";

export type LeadInput = {
  full_name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  business_name: string | null;
  language: "es" | "en";
  needs_notes: string | null;
  source: Source | null;
};

export type ErrorCode = "required" | "phone" | "email" | "zip" | "state" | "tooLong";
export type FieldErrors = Partial<Record<keyof LeadInput, ErrorCode>>;

/** What the referral form's save action sends back when something needs fixing. */
export type LeadFormState = {
  status: "idle" | "error";
  errors: FieldErrors;
  message?: "fixErrors" | "failed";
  values?: Record<string, string>;
};

/** Keeps only digits; drops a leading US "1" from 11-digit numbers. */
export function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (v: string) => (v === "" ? null : v);

export function validateLead(fd: FormData): { input: LeadInput; errors: FieldErrors } {
  const sourceRaw = text(fd, "source");
  const zipRaw = text(fd, "zip");
  const input: LeadInput = {
    full_name: text(fd, "full_name").replace(/\s+/g, " "),
    phone: normalizePhone(text(fd, "phone")),
    email: text(fd, "email").toLowerCase(),
    street: text(fd, "street"),
    city: text(fd, "city"),
    state: text(fd, "state").toUpperCase(),
    zip: /^\d{5}-\d{4}$/.test(zipRaw) ? zipRaw.slice(0, 5) : zipRaw,
    business_name: optional(text(fd, "business_name")),
    language: text(fd, "language") === "en" ? "en" : "es",
    needs_notes: optional(text(fd, "needs_notes")),
    source: (SOURCES as readonly string[]).includes(sourceRaw) ? (sourceRaw as Source) : null,
  };

  const errors: FieldErrors = {};
  if (input.full_name.length < 2) errors.full_name = "required";
  else if (input.full_name.length > 120) errors.full_name = "tooLong";
  if (!input.phone) errors.phone = "required";
  else if (input.phone.length !== 10) errors.phone = "phone";
  if (!input.email) errors.email = "required";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || input.email.length > 200) errors.email = "email";
  if (!input.street) errors.street = "required";
  else if (input.street.length > 200) errors.street = "tooLong";
  if (!input.city) errors.city = "required";
  else if (input.city.length > 100) errors.city = "tooLong";
  if (!input.state) errors.state = "required";
  else if (!STATE_CODES.has(input.state)) errors.state = "state";
  if (!input.zip) errors.zip = "required";
  else if (!/^\d{5}$/.test(input.zip)) errors.zip = "zip";
  if (input.business_name && input.business_name.length > 200) errors.business_name = "tooLong";
  if (input.needs_notes && input.needs_notes.length > 2000) errors.needs_notes = "tooLong";

  return { input, errors };
}
