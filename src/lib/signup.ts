// The public sign-up page /r/<channel> for people who hear about IPT on the
// radio, in the newsletter or magazine, or at an event.
import { normalizePhone } from "@/lib/leads/validate";
import type { Source } from "@/lib/types";

/** The link names Danny can share. Spanish first, English also works. */
export const CHANNELS: Record<string, Source> = {
  radio: "radio",
  boletin: "newsletter",
  newsletter: "newsletter",
  revista: "magazine",
  magazine: "magazine",
  evento: "event",
  event: "event",
  // Aníbal's own link: people who sign up here are counted as his referrals.
  anibal: "anibal",
};

/** The link Aníbal shares (shown on his lead list). */
export const ANIBAL_LINK = "anibal";

export const SIGNUP_LINKS = ["radio", "boletin", "revista", "evento"] as const;

/** If more than this many people sign up in 10 minutes, pause (protects against bots). */
export const SIGNUP_FLOOD_LIMIT = 25;

export function channelSource(slug: string): Source | null {
  return CHANNELS[slug.toLowerCase()] ?? null;
}

export type SignupInput = { full_name: string; phone: string; email: string; language: "es" | "en" };
export type SignupErrorCode = "required" | "phone" | "email" | "name" | "number" | "weeks" | "year";
/** Contact fields plus the optional "what do you need" follow-ups (weekly_payroll, roof_year, …). */
export type SignupErrors = Partial<Record<string, SignupErrorCode>>;

export function validateSignup(fd: FormData): { input: SignupInput; errors: SignupErrors; isBot: boolean } {
  const text = (k: string) => String(fd.get(k) ?? "").trim();
  const input: SignupInput = {
    full_name: text("full_name").replace(/\s+/g, " "),
    phone: normalizePhone(text("phone")),
    email: text("email").toLowerCase(),
    language: text("language") === "en" ? "en" : "es",
  };
  const errors: SignupErrors = {};
  if (input.full_name.length < 2) errors.full_name = "required";
  // A name is a name: no links or email addresses (so nobody can use our emails to send spam text).
  else if (input.full_name.length > 80 || /https?:|www\.|\.com|@|<|>/i.test(input.full_name)) errors.full_name = "name";
  if (!input.phone) errors.phone = "required";
  else if (input.phone.length !== 10) errors.phone = "phone";
  if (!input.email) errors.email = "required";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || input.email.length > 200) errors.email = "email";

  // Hidden "website" field: people never see it, bots fill it in.
  const isBot = text("website") !== "";
  return { input, errors, isBot };
}
