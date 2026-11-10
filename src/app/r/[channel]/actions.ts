"use server";

import { after } from "next/server";
import { getReferrerId, linkCustomerAccount } from "@/lib/leads/accounts";
import { notify } from "@/lib/notify";
import { asksAboutBusiness, parseIntakeAnswers } from "@/lib/portal/validate";
import { channelSource, SIGNUP_FLOOD_LIMIT, validateSignup, type SignupErrors } from "@/lib/signup";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPEN_STAGES } from "@/lib/types";

export type SignupState = {
  status: "idle" | "error" | "done";
  errors: SignupErrors;
  message?: "busy" | "failed";
  values?: Record<string, string | string[]>;
  /** they also said what they need insured (a quote request) */
  withInfo?: boolean;
};

const valuesOf = (fd: FormData) => {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$")) continue;
    const all = fd.getAll(key).map(String);
    out[key] = key === "needs" ? all : (all[0] ?? "");
  }
  return out;
};

/**
 * Public sign-up (no login). Creates a "Nuevo" lead tagged with the channel,
 * gives the person a sign-in account, emails them their 30-day link, and pings Danny.
 * Runs with the server's key because visitors aren't signed in. Only this
 * narrow job is done with it.
 */
export async function signUp(slug: string, _prev: SignupState, fd: FormData): Promise<SignupState> {
  const source = channelSource(slug);
  if (!source) return { status: "error", errors: {}, message: "failed" };

  const { input, errors: contactErrors, isBot } = validateSignup(fd);
  if (isBot) return { status: "done", errors: {} }; // look normal, do nothing
  // Optional: what they need insured (a quote request), same questions as the customer's own form.
  const { intake, errors: answerErrors } = parseIntakeAnswers(fd);
  // (parseIntakeAnswers only ever reports "number", "weeks" or "year")
  const errors = { ...contactErrors, ...answerErrors } as SignupErrors;
  if (Object.keys(errors).length) return { status: "error", errors, values: valuesOf(fd) };
  const withInfo = intake.needs.length > 0;
  const business_name = asksAboutBusiness(intake)
    ? String(fd.get("business_name") ?? "")
        .trim()
        .slice(0, 200) || null
    : null;

  const admin = createAdminClient();

  // Flood guard: too many public sign-ups in 10 minutes means something's wrong.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("created_by", null)
    .gte("new_at", since);
  if ((count ?? 0) >= SIGNUP_FLOOD_LIMIT) {
    return { status: "error", errors: {}, message: "busy", values: valuesOf(fd) };
  }

  // Signed up before and still open? Re-send their link instead of making a duplicate.
  // (Their new answers are NOT saved here: anyone can type any email on a public page,
  // so only the person with the emailed link can change an existing file.)
  const { data: existing } = await admin
    .from("leads")
    .select("id")
    .eq("email", input.email)
    .in("stage", OPEN_STAGES)
    .order("new_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    const id = existing.id as string;
    after(() => notify("lead_added", id, { only: ["customer"] }));
    return { status: "done", errors: {} };
  }

  // Every lead is Aníbal's, whichever link they signed up with (radio, newsletter, his own link…).
  const referrer_id = await getReferrerId();

  const { data: lead, error } = await admin
    .from("leads")
    .insert({ ...input, business_name, source, referrer_id })
    .select("id")
    .single();
  if (error || !lead) {
    console.error("public sign-up failed:", error);
    return { status: "error", errors: {}, message: "failed", values: valuesOf(fd) };
  }

  try {
    await linkCustomerAccount(lead.id, input.email, { fullName: input.full_name, language: input.language });
  } catch (err) {
    console.error("Could not create the customer's account:", err);
  }

  const leadId = lead.id as string;

  if (withInfo) {
    // Save what they need and move the lead to "Información enviada" (the database stamps the date
    // and writes the activity-feed entry).
    const { error: intakeError } = await admin.from("intake").insert({ lead_id: leadId, ...intake });
    if (intakeError) console.error("public sign-up: could not save answers:", intakeError);
    else await admin.from("leads").update({ stage: "info_sent" }).eq("id", leadId);
  }

  // Customer: welcome (or "we got your request") + Danny + Aníbal.
  after(() => notify("lead_added", leadId, { addedBy: null, source, withInfo }));
  return { status: "done", errors: {}, withInfo };
}
