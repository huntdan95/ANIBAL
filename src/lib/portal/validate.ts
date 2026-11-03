// Checks the customer's "Mi información" form. The contact part uses the same
// rules as the referral form; the email can't be changed here (it's their login).
// v1 rule: no DOB, driver's license, VIN or SSN fields, ever.
import { validateLead, type LeadInput } from "@/lib/leads/validate";

export const NEEDS = ["business", "workers", "vehicle", "home", "other"] as const;
export type Need = (typeof NEEDS)[number];

export type IntakeInput = {
  needs: Need[];
  other_need: string | null;
  work_type: string | null;
  weekly_payroll: number | null;
  weeks_per_year: number | null;
  roof_year: number | null;
  vehicle_count: number | null;
  driver_count: number | null;
};

export type IntakeErrorCode =
  | "required"
  | "phone"
  | "email"
  | "zip"
  | "state"
  | "tooLong"
  | "pickOne"
  | "number"
  | "weeks"
  | "year";
export type IntakeErrors = Partial<Record<string, IntakeErrorCode>>;

export type IntakeFormState = {
  status: "idle" | "error";
  errors: IntakeErrors;
  message?: "fixErrors" | "failed";
  values?: Record<string, string | string[]>;
};

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** "$2,500" -> 2500. Empty -> null. Not a number / out of range -> "error". */
function parseNumber(raw: string, min: number, max: number, integer: boolean): number | null | "error" {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) return "error";
  return n;
}

export function validateIntake(
  fd: FormData,
  loginEmail: string,
  now = new Date(),
): { contact: LeadInput; intake: IntakeInput; errors: IntakeErrors } {
  const withEmail = new FormData();
  for (const [k, v] of fd.entries()) withEmail.append(k, v);
  withEmail.set("email", loginEmail);
  const { input: contact, errors: contactErrors } = validateLead(withEmail);
  const errors: IntakeErrors = { ...contactErrors };
  delete errors.email;
  // The customer confirms their full address here (the referral itself only needs name, phone, email).
  if (!contact.street) errors.street = "required";
  if (!contact.city) errors.city = "required";
  if (!contact.state) errors.state = "required";
  if (!contact.zip) errors.zip ??= "required";

  const picked = fd.getAll("needs").map(String);
  const needs = NEEDS.filter((n) => picked.includes(n));
  if (needs.length === 0) errors.needs = "pickOne";

  const has = (n: Need) => needs.includes(n);
  const forBusiness = has("business") || has("workers");

  const num = (key: string, min: number, max: number, integer: boolean, code: IntakeErrorCode = "number") => {
    const r = parseNumber(text(fd, key), min, max, integer);
    if (r === "error") {
      errors[key] = code;
      return null;
    }
    return r;
  };

  const intake: IntakeInput = {
    needs,
    other_need: has("other") ? text(fd, "other_need").slice(0, 500) || null : null,
    work_type: forBusiness ? text(fd, "work_type").slice(0, 200) || null : null,
    weekly_payroll: forBusiness ? num("weekly_payroll", 0, 10_000_000, false) : null,
    weeks_per_year: forBusiness ? num("weeks_per_year", 0, 52, true, "weeks") : null,
    roof_year: has("home") ? num("roof_year", 1900, now.getFullYear() + 1, true, "year") : null,
    vehicle_count: has("vehicle") ? num("vehicle_count", 0, 99, true) : null,
    driver_count: has("vehicle") ? num("driver_count", 0, 99, true) : null,
  };

  if (!forBusiness) {
    // Business name is only asked about in the business part; don't wipe one Aníbal entered.
    delete errors.business_name;
  }
  return { contact, intake, errors };
}
