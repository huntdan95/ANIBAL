"use server";

import { after } from "next/server";
import { linkCustomerAccount } from "@/lib/leads/accounts";
import { notify } from "@/lib/notify";
import { channelSource, SIGNUP_FLOOD_LIMIT, validateSignup, type SignupErrors } from "@/lib/signup";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPEN_STAGES } from "@/lib/types";

export type SignupState = {
  status: "idle" | "error" | "done";
  errors: SignupErrors;
  message?: "busy" | "failed";
  values?: Record<string, string>;
};

const valuesOf = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([k, v]) => !k.startsWith("$") && typeof v === "string")) as Record<
    string,
    string
  >;

/**
 * Public sign-up (no login). Creates a "Nuevo" lead tagged with the channel,
 * gives the person a sign-in account, emails them their 30-day link, and pings Danny.
 * Runs with the server's key because visitors aren't signed in. Only this
 * narrow job is done with it.
 */
export async function signUp(slug: string, _prev: SignupState, fd: FormData): Promise<SignupState> {
  const source = channelSource(slug);
  if (!source) return { status: "error", errors: {}, message: "failed" };

  const { input, errors, isBot } = validateSignup(fd);
  if (isBot) return { status: "done", errors: {} }; // look normal, do nothing
  if (Object.keys(errors).length) return { status: "error", errors, values: valuesOf(fd) };

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

  const { data: lead, error } = await admin
    .from("leads")
    .insert({ ...input, source })
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
  after(() => notify("lead_added", leadId, { addedBy: null, source })); // customer welcome + Danny
  return { status: "done", errors: {} };
}
